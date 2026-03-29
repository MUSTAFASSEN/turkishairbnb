import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  await db.init();
  const { name, email, password, role } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Tüm alanlar gereklidir' }, { status: 400 });
  }

  if (db.users.find(u => u.email === email)) {
    return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 400 });
  }

  const userRole: UserRole = role === 'host' ? 'host' : 'guest';
  const newUser = {
    id: uuid(),
    email,
    password: bcrypt.hashSync(password, 10),
    name,
    role: userRole,
    subscriptionPlan: 'none' as const,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role });
  const { password: _, ...publicUser } = newUser;

  return NextResponse.json({ user: publicUser, token }, { status: 201 });
}
