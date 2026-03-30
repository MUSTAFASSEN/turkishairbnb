import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { usersCol, initDb } from './db';
import { PublicUser } from '@/types';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export function signToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function getAuthUser(request: NextRequest): Promise<PublicUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;

  await initDb();
  const users = await usersCol();
  const user = await users.findOne({ id: decoded.id }, { projection: { _id: 0 } });
  if (!user) return null;

  const { password: _, ...publicUser } = user;
  return publicUser;
}

export function COMMISSION_RATE() {
  return 0.05; // 5% commission
}
