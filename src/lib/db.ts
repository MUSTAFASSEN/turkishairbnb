import { Collection } from 'mongodb';
import { User, Listing, Booking, Review, Payment } from '@/types';
import { getDb } from './mongodb';
import bcrypt from 'bcryptjs';

export async function usersCol(): Promise<Collection<User>> {
  return (await getDb()).collection<User>('users');
}
export async function listingsCol(): Promise<Collection<Listing>> {
  return (await getDb()).collection<Listing>('listings');
}
export async function bookingsCol(): Promise<Collection<Booking>> {
  return (await getDb()).collection<Booking>('bookings');
}
export async function reviewsCol(): Promise<Collection<Review>> {
  return (await getDb()).collection<Review>('reviews');
}
export async function paymentsCol(): Promise<Collection<Payment>> {
  return (await getDb()).collection<Payment>('payments');
}

let initialized = false;

export async function initDb() {
  if (initialized) return;
  initialized = true;

  const db = await getDb();

  await Promise.all([
    db.collection('users').createIndex({ id: 1 }, { unique: true }),
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('listings').createIndex({ id: 1 }, { unique: true }),
    db.collection('listings').createIndex({ hostId: 1 }),
    db.collection('bookings').createIndex({ id: 1 }, { unique: true }),
    db.collection('bookings').createIndex({ listingId: 1 }),
    db.collection('bookings').createIndex({ guestId: 1 }),
    db.collection('bookings').createIndex({ hostId: 1 }),
    db.collection('reviews').createIndex({ id: 1 }, { unique: true }),
    db.collection('reviews').createIndex({ listingId: 1 }),
    db.collection('payments').createIndex({ id: 1 }, { unique: true }),
    db.collection('payments').createIndex({ bookingId: 1 }),
  ]);

  const users = await usersCol();
  const adminExists = await users.findOne({ role: 'admin' });
  if (!adminExists) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@turkevim.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await users.insertOne({
      id: 'user-1',
      email: adminEmail,
      password: bcrypt.hashSync(adminPassword, 10),
      name: 'Admin',
      role: 'admin',
      phone: '',
      subscriptionPlan: 'none',
      createdAt: new Date().toISOString(),
    } as User);
  }
}
