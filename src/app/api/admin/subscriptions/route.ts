import { NextRequest, NextResponse } from 'next/server';
import { initDb, usersCol, listingsCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { SubscriptionPlan } from '@/types';

export async function PUT(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { userId, plan } = await request.json();
  const users = await usersCol();
  const target = await users.findOne({ id: userId });
  if (!target) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  const updateFields: Record<string, unknown> = { subscriptionPlan: plan as SubscriptionPlan };
  if (plan !== 'none') {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    updateFields.subscriptionExpiry = expiry.toISOString();
  }

  await users.updateOne({ id: userId }, { $set: updateFields });

  // Update listing featured status
  const isPremium = plan === 'premium';
  const listings = await listingsCol();
  await listings.updateMany({ hostId: userId }, { $set: { isFeatured: isPremium } });

  const updated = await users.findOne({ id: userId }, { projection: { _id: 0, password: 0 } });
  return NextResponse.json({ user: updated });
}
