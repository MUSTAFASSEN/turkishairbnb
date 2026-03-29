import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await db.init();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const totalUsers = db.users.length;
  const totalHosts = db.users.filter(u => u.role === 'host').length;
  const totalGuests = db.users.filter(u => u.role === 'guest').length;
  const totalListings = db.listings.length;
  const activeListings = db.listings.filter(l => l.isActive).length;
  const totalBookings = db.bookings.length;

  const completedBookings = db.bookings.filter(b => b.status === 'completed');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalCommission = completedBookings.reduce((sum, b) => sum + b.commissionAmount, 0);

  // Subscription revenue
  const basicSubs = db.users.filter(u => u.subscriptionPlan === 'basic').length;
  const premiumSubs = db.users.filter(u => u.subscriptionPlan === 'premium').length;
  const subscriptionRevenue = (basicSubs * 499) + (premiumSubs * 999);

  // Monthly revenue (last 6 months)
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
