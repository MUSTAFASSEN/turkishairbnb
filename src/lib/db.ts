import { User, Listing, Booking, Review, Payment } from '@/types';
import bcrypt from 'bcryptjs';

// In-memory database
class Database {
  users: User[] = [];
  listings: Listing[] = [];
  bookings: Booking[] = [];
  reviews: Review[] = [];
  payments: Payment[] = [];
  private initialized = false;

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    const hash = (pw: string) => bcrypt.hashSync(pw, 10);

    // Admin account — update credentials in .env or here before deployment
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@turkevim.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    this.users = [
      {
        id: 'user-1',
        email: adminEmail,
        password: hash(adminPassword),
        name: 'Admin',
        role: 'admin',
        phone: '',
        subscriptionPlan: 'none',
        createdAt: new Date().toISOString(),
      },
    ];

    this.listings = [];
    this.bookings = [];
    this.reviews = [];
    this.payments = [];
  }
}

// Singleton
const globalDb = globalThis as unknown as { __db: Database };
if (!globalDb.__db) {
  globalDb.__db = new Database();
}
export const db = globalDb.__db;
