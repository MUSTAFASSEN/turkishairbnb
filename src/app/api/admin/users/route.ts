import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await db.init();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const users = db.users.map(u => {
    const { password: _, ...publicUser } = u;
    return publicUser;
  });

  return NextResponse.json({ users });
}

export async function PUT(request: NextRequest) {
  await db.init();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const body = await request.json();
  const target = db.users.find(u => u.id === body.id);
  if (!target) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  if (body.role) target.role = body.role;
  if (body.subscriptionPlan) target.subscriptionPlan = body.subscriptionPlan;

  const { password: _, ...publicUser } = target;
  return NextResponse.json({ user: publicUser });
}
