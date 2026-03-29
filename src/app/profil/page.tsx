'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Booking, Listing } from '@/types';

interface BookingWithListing extends Booking {
  listing?: Listing;
}

const roleTurkish: Record<string, string> = {
  guest: 'Misafir',
  host: 'Ev Sahibi',
  admin: 'Yönetici',
};

const planTurkish: Record<string, string> = {
  none: 'Standart',
  basic: 'Standart',
  premium: 'Premium',
};

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: { label: 'Beklemede', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { label: 'Onaylandı', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'İptal Edildi', bg: 'bg-red-100', text: 'text-red-700' },
  completed: {
    label: 'Tamamlandı',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
};

export default function ProfilPage() {
  const router = useRouter();
  const { user, isLoading, loadFromStorage, logout } = useAuthStore();
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/giris');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user && user.role === 'guest') {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = (await api.getBookings()) as { bookings: BookingWithListing[] };
      setBookings(res.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/giris');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-gold-500">
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <p className="text-gray-500 mt-1">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 rounded-lg transition"
            >
              Çıkış Yap
            </button>
          </div>

          {/* User Details */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Hesap Türü
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {roleTurkish[user.role] || user.role}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Abonelik Planı
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {planTurkish[user.subscriptionPlan] || user.subscriptionPlan}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Üyelik Tarihi
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Bookings Section - only for guests */}
        {user.role === 'guest' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Rezervasyon Geçmişi
            </h2>

            {bookingsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gold-500 border-t-transparent" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500">Henüz bir rezervasyonunuz yok.</p>
                <Link
                  href="/"
                  className="inline-block mt-4 px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition"
                >
                  Ev Keşfet
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const status = statusConfig[booking.status] || {
                    label: booking.status,
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                  };

                  return (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {booking.listing?.title || 'Konaklama'}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                            <span>
                              {formatDate(booking.checkIn)} -{' '}
                              {formatDate(booking.checkOut)}
                            </span>
                            {booking.listing?.city && (
                              <span className="flex items-center gap-1">
                                📍 {booking.listing.city}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(booking.totalPrice)}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
