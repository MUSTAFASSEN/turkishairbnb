import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { SubscriptionPlan } from '@/types';

export async function PUT(request: NextRequest) {
  await db.init();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { userId, plan } = await request.json();
  const target = db.users.find(u => u.id === userId);
  if (!target) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  target.subscriptionPlan = plan as SubscriptionPlan;
  if (plan !== 'none') {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    target.subscriptionExpiry = expiry.toISOString();
  }

  // Update listing featured status
  const isPremium = plan === 'premium';
  db.listings.filter(l => l.hostId === userId).forEach(l => {
    l.isFeatured = isPremium;
  });

  const { password: _, ...publicUser } = target;
  return NextResponse.json({ user: publicUser });
}
