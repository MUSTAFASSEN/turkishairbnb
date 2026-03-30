import { NextRequest, NextResponse } from 'next/server';
import { initDb, usersCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const users = await usersCol();
  const userList = await users.find({}, { projection: { _id: 0, password: 0 } }).toArray();
  return NextResponse.json({ users: userList });
}

export async function PUT(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const body = await request.json();
  const users = await usersCol();
  const target = await users.findOne({ id: body.id });
  if (!target) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  const updateFields: Record<string, unknown> = {};
  if (body.role) updateFields.role = body.role;
  if (body.subscriptionPlan) updateFields.subscriptionPlan = body.subscriptionPlan;

  await users.updateOne({ id: body.id }, { $set: updateFields });
  const updated = await users.findOne({ id: body.id }, { projection: { _id: 0, password: 0 } });
  return NextResponse.json({ user: updated });
}
