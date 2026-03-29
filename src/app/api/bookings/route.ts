import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { getAuthUser, COMMISSION_RATE } from '@/lib/auth';
import { calculateNights } from '@/lib/utils';

export async function GET(request: NextRequest) {
  await db.init();

  const { searchParams } = new URL(request.url);

  // Public endpoint: get booked dates for a listing (no auth required)
  const listingId = searchParams.get('listingId');
  if (listingId) {
    const bookedDates = db.bookings
      .filter(b => b.listingId === listingId && ['pending', 'confirmed'].includes(b.status))
      .map(b => ({ checkIn: b.checkIn, checkOut: b.checkOut }));
    return NextResponse.json({ bookedDates });
  }

  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const role = searchParams.get('role') || user.role;

  let bookings;
  if (user.role === 'admin') {
    bookings = db.bookings;
  } else if (role === 'host') {
    bookings = db.bookings.filter(b => b.hostId === user.id);
  } else {
    bookings = db.bookings.filter(b => b.guestId === user.id);
  }

  // Enrich with listing and guest info
  const enriched = bookings.map(b => {
    const listing = db.listings.find(l => l.id === b.listingId);
    const guest = db.users.find(u => u.id === b.guestId);
    const host = db.users.find(u => u.id === b.hostId);
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
  const listing = db.listings.find(l => l.id === listingId);
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });

  const nights = calculateNights(checkIn, checkOut);
  if (nights <= 0) return NextResponse.json({ error: 'Geçersiz tarih aralığı' }, { status: 400 });

  // Check for date conflicts with existing bookings
  const hasConflict = db.bookings.some(b =>
    b.listingId === listingId &&
    ['pending', 'confirmed'].includes(b.status) &&
    checkIn < b.checkOut && checkOut > b.checkIn
  );
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

  db.bookings.push(booking);

  // Create payment record (escrow)
  db.payments.push({
    id: uuid(),
    bookingId: booking.id,
    amount: totalPrice,
    commission,
    hostPayout: hostEarnings,
    status: 'held',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ booking }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const { id, status } = await request.json();
  const booking = db.bookings.find(b => b.id === id);
  if (!booking) return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 });

  if (booking.hostId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
  }

  booking.status = status;

  // Update payment status based on booking status
  const payment = db.payments.find(p => p.bookingId === id);
  if (payment) {
    if (status === 'completed') payment.status = 'released';
    if (status === 'cancelled') payment.status = 'refunded';
  }
  if (status === 'completed') booking.paymentStatus = 'released';
  if (status === 'cancelled') booking.paymentStatus = 'refunded';

  return NextResponse.json({ booking });
}
