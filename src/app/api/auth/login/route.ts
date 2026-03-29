import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await db.init();
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'E-posta ve şifre gereklidir' }, { status: 400 });
  }

  const user = db.users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ error: 'Geçersiz e-posta veya şifre' }, { status: 401 });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const { password: _, ...publicUser } = user;

  return NextResponse.json({ user: publicUser, token });
}
