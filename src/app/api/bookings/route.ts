import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { initDb, bookingsCol, listingsCol, usersCol, paymentsCol } from '@/lib/db';
import { getAuthUser, COMMISSION_RATE } from '@/lib/auth';
import { calculateNights } from '@/lib/utils';
import { Booking, Payment } from '@/types';

export async function GET(request: NextRequest) {
  await initDb();
  const bookings = await bookingsCol();

  const { searchParams } = new URL(request.url);

  // Public endpoint: get booked dates for a listing (no auth required)
  const listingId = searchParams.get('listingId');
  if (listingId) {
    const bookedDates = await bookings.find(
      { listingId, status: { $in: ['pending', 'confirmed'] } },
      { projection: { _id: 0, checkIn: 1, checkOut: 1 } }
    ).toArray();
    return NextResponse.json({ bookedDates });
  }

  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const role = searchParams.get('role') || user.role;

  const filter: Record<string, unknown> = {};
  if (user.role !== 'admin') {
    if (role === 'host') {
      filter.hostId = user.id;
    } else {
      filter.guestId = user.id;
    }
  }

  const bookingList = await bookings.find(filter, { projection: { _id: 0 } }).toArray();

  // Batch lookups for enrichment
  const listingIds = [...new Set(bookingList.map(b => b.listingId))];
  const guestIds = [...new Set(bookingList.map(b => b.guestId))];
  const hostIds = [...new Set(bookingList.map(b => b.hostId))];

  const [listings, users] = await Promise.all([
    listingsCol(),
    usersCol(),
  ]);

  const [listingDocs, guestDocs, hostDocs] = await Promise.all([
    listingIds.length ? listings.find({ id: { $in: listingIds } }, { projection: { _id: 0 } }).toArray() : [],
    guestIds.length ? users.find({ id: { $in: guestIds } }, { projection: { _id: 0 } }).toArray() : [],
    hostIds.length ? users.find({ id: { $in: hostIds } }, { projection: { _id: 0 } }).toArray() : [],
  ]);

  const listingMap = new Map(listingDocs.map(l => [l.id, l]));
  const guestMap = new Map(guestDocs.map(u => [u.id, u]));
  const hostMap = new Map(hostDocs.map(u => [u.id, u]));

  const enriched = bookingList.map(b => {
    const listing = listingMap.get(b.listingId);
    const guest = guestMap.get(b.guestId);
    const host = hostMap.get(b.hostId);
    return {
      ...b,
      listing: listing ? { id: listing.id, title: listing.title, city: listing.city, images: listing.images } : null,
      guest: guest ? { id: guest.id, name: guest.name, email: guest.email } : null,
      host: host ? { id: host.id, name: host.name } : null,
    };
  });

  return NextResponse.json({ bookings: enriched });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const { listingId, checkIn, checkOut } = await request.json();
  const listings = await listingsCol();
  const listing = await listings.findOne({ id: listingId }, { projection: { _id: 0 } });
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });

  const nights = calculateNights(checkIn, checkOut);
  if (nights <= 0) return NextResponse.json({ error: 'Geçersiz tarih aralığı' }, { status: 400 });

  // Check for date conflicts
  const bookings = await bookingsCol();
  const hasConflict = await bookings.findOne({
    listingId,
    status: { $in: ['pending', 'confirmed'] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });
  if (hasConflict) {
    return NextResponse.json({ error: 'Seçilen tarihler başka bir rezervasyonla çakışıyor' }, { status: 409 });
  }

  const totalPrice = listing.pricePerNight * nights;
  const commission = totalPrice * COMMISSION_RATE();
  const hostEarnings = totalPrice - commission;

  const booking = {
    id: uuid(),
    listingId,
    guestId: user.id,
    hostId: listing.hostId,
    checkIn,
    checkOut,
    totalPrice,
    commissionAmount: commission,
    hostEarnings,
    status: 'pending' as const,
    paymentStatus: 'held' as const,
    createdAt: new Date().toISOString(),
  };

  await bookings.insertOne(booking as Booking);

  // Create payment record (escrow)
  const payments = await paymentsCol();
  await payments.insertOne({
    id: uuid(),
    bookingId: booking.id,
    amount: totalPrice,
    commission,
    hostPayout: hostEarnings,
    status: 'held',
    createdAt: new Date().toISOString(),
  } as Payment);

  return NextResponse.json({ booking }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const { id, status } = await request.json();
  const bookings = await bookingsCol();
  const booking = await bookings.findOne({ id }, { projection: { _id: 0 } });
  if (!booking) return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 });

  if (booking.hostId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
  }

  const bookingUpdate: Record<string, unknown> = { status };
  // Sadece iptal durumunda ödeme iade edilir; tamamlandı durumunda ödemeyi sadece admin serbest bırakabilir
  if (status === 'cancelled') bookingUpdate.paymentStatus = 'refunded';
  await bookings.updateOne({ id }, { $set: bookingUpdate });

  // Ödeme kaydını sadece iptal durumunda güncelle; serbest bırakma işlemi admin emanet sayfasından yapılır
  if (status === 'cancelled') {
    const payments = await paymentsCol();
    await payments.updateOne({ bookingId: id }, { $set: { status: 'refunded' } });
  }

  const updated = await bookings.findOne({ id }, { projection: { _id: 0 } });
  return NextResponse.json({ booking: updated });
}
