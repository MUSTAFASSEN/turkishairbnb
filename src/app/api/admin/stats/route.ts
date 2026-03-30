import { NextRequest, NextResponse } from 'next/server';
import { initDb, usersCol, listingsCol, bookingsCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const [users, listings, bookings] = await Promise.all([usersCol(), listingsCol(), bookingsCol()]);

  const [totalUsers, totalHosts, totalGuests, totalListings, activeListings, totalBookings] = await Promise.all([
    users.countDocuments(),
    users.countDocuments({ role: 'host' }),
    users.countDocuments({ role: 'guest' }),
    listings.countDocuments(),
    listings.countDocuments({ isActive: true }),
    bookings.countDocuments(),
  ]);

  // Revenue from completed bookings
  const revenueAgg = await bookings.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, totalCommission: { $sum: '$commissionAmount' } } },
  ]).toArray();
  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
  const totalCommission = revenueAgg[0]?.totalCommission || 0;

  // Subscription counts
  const [basicSubs, premiumSubs] = await Promise.all([
    users.countDocuments({ subscriptionPlan: 'basic' }),
    users.countDocuments({ subscriptionPlan: 'premium' }),
  ]);
  const subscriptionRevenue = (basicSubs * 499) + (premiumSubs * 999);

  // Monthly revenue (last 6 months)
  const completedBookings = await bookings.find(
    { status: 'completed' },
    { projection: { _id: 0, commissionAmount: 1, createdAt: 1 } }
  ).toArray();

  const monthlyRevenue: { month: string; commission: number; subscriptions: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const monthBookings = completedBookings.filter(b => {
      const bd = new Date(b.createdAt);
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
    });
    monthlyRevenue.push({
      month: monthStr,
      commission: monthBookings.reduce((sum, b) => sum + b.commissionAmount, 0),
      subscriptions: subscriptionRevenue / 6,
    });
  }

  return NextResponse.json({
    totalUsers,
    totalHosts,
    totalGuests,
    totalListings,
    activeListings,
    totalBookings,
    totalRevenue,
    totalCommission,
    subscriptionRevenue,
    basicSubs,
    premiumSubs,
    monthlyRevenue,
  });
}
