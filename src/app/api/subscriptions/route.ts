import { NextRequest, NextResponse } from 'next/server';
import { initDb, usersCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'host') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { plan } = await request.json();
  if (!plan || !['basic', 'premium'].includes(plan)) {
    return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 });
  }

  const users = await usersCol();
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);

  await users.updateOne(
    { id: user.id },
    {
      $set: {
        subscriptionPlan: plan,
        subscriptionExpiry: expiry.toISOString(),
      },
    }
  );

  const updated = await users.findOne({ id: user.id }, { projection: { _id: 0, password: 0 } });
  return NextResponse.json({ user: updated });
}
