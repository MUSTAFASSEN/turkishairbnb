import { NextRequest, NextResponse } from 'next/server';
import { initDb, bookingsCol, listingsCol, usersCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const bookings = await bookingsCol();
  const heldBookings = await bookings
    .find({ paymentStatus: 'held' }, { projection: { _id: 0 } })
    .sort({ checkIn: 1 })
    .toArray();

  if (heldBookings.length === 0) {
    return NextResponse.json({
      bookings: [],
      stats: { totalHeldAmount: 0, totalHeldCount: 0, totalCommissionHeld: 0 },
    });
  }

  // Batch enrich
  const listingIds = [...new Set(heldBookings.map((b) => b.listingId))];
  const userIds = [...new Set([
    ...heldBookings.map((b) => b.guestId),
    ...heldBookings.map((b) => b.hostId),
  ])];

  const [listingsData, usersData] = await Promise.all([
    (await listingsCol()).find({ id: { $in: listingIds } }, { projection: { _id: 0, id: 1, title: 1, city: 1 } }).toArray(),
    (await usersCol()).find({ id: { $in: userIds } }, { projection: { _id: 0, id: 1, name: 1 } }).toArray(),
  ]);

  const listingMap = new Map(listingsData.map((l) => [l.id, l]));
  const userMap = new Map(usersData.map((u) => [u.id, u]));

  const enriched = heldBookings.map((b) => ({
    ...b,
    listing: listingMap.get(b.listingId) ?? null,
    guest: userMap.get(b.guestId) ?? null,
    host: userMap.get(b.hostId) ?? null,
  }));

  const stats = {
    totalHeldAmount: heldBookings.reduce((s, b) => s + (b.totalPrice ?? 0), 0),
    totalHeldCount: heldBookings.length,
    totalCommissionHeld: heldBookings.reduce((s, b) => s + (b.commissionAmount ?? 0), 0),
  };

  return NextResponse.json({ bookings: enriched, stats });
}
