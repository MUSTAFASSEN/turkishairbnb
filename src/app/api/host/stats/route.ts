import { NextRequest, NextResponse } from 'next/server';
import { initDb, listingsCol, bookingsCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'host') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const [listings, bookings] = await Promise.all([listingsCol(), bookingsCol()]);

  const [totalListings, activeListingCount] = await Promise.all([
    listings.countDocuments({ hostId: user.id }),
    listings.countDocuments({ hostId: user.id, isActive: true }),
  ]);

  const bookingList = await bookings.find({ hostId: user.id }, { projection: { _id: 0 } }).toArray();
  const completedBookings = bookingList.filter(b => b.status === 'completed');
  const activeBookings = bookingList.filter(b => b.status === 'confirmed' || b.status === 'pending');

  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.hostEarnings, 0);
  const pendingEarnings = activeBookings.reduce((sum, b) => sum + b.hostEarnings, 0);

  // Monthly earnings (last 6 months)
  const monthlyEarnings: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const monthBookings = completedBookings.filter(b => {
      const bd = new Date(b.createdAt);
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
    });
    monthlyEarnings.push({
      month: monthStr,
      amount: monthBookings.reduce((sum, b) => sum + b.hostEarnings, 0),
    });
  }

  return NextResponse.json({
    totalListings,
    activeListings: activeListingCount,
    totalBookings: bookingList.length,
    activeBookings: activeBookings.length,
    totalEarnings,
    pendingEarnings,
    monthlyEarnings,
  });
}
