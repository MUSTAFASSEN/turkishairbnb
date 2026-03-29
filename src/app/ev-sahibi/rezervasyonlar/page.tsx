'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const sidebarLinks = [
  { href: '/ev-sahibi/panel', label: 'Panel', icon: '📊' },
  { href: '/ev-sahibi/ilanlar/yeni', label: 'Yeni İlan', icon: '➕' },
  { href: '/ev-sahibi/rezervasyonlar', label: 'Rezervasyonlar', icon: '📅' },
  { href: '/ev-sahibi/kazanclar', label: 'Kazançlar', icon: '💰' },
  { href: '/ev-sahibi/abonelik', label: 'Abonelik', icon: '⭐' },
];

interface Booking {
  id: string;
  listingId: string;
  listingTitle?: string;
  listing?: { id: string; title: string; city: string };
  guestId: string;
  guestName?: string;
  guest?: { id: string; name: string; email: string };
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  hostEarnings: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
};

export default function HostBookingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, loadFromStorage, logout } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'host') {
      router.push('/giris');
      return;
    }

    fetchBookings();
  }, [user, authLoading, router]);

  async function fetchBookings() {
    try {
      const data = await api.getBookings('role=host');
      const bookingsArr = data.bookings || data;
      setBookings(Array.isArray(bookingsArr) ? bookingsArr : []);
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    setUpdating(bookingId);
    try {
      await api.updateBooking(bookingId, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    } finally {
      setUpdating(null);
    }
  };

  const filteredBookings =
    filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'host') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Nav */}
        <div className="lg:hidden overflow-x-auto mb-6">
          <div className="flex gap-2 min-w-max">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  link.href === '/ev-sahibi/rezervasyonlar'
                    ? 'bg-gold-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 bg-white shadow-lg rounded-xl p-4 h-fit sticky top-24 hidden lg:block">
            <h2 className="text-lg font-bold text-gray-800 mb-4 px-3">Ev Sahibi Paneli</h2>
            <nav className="space-y-1">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    link.href === '/ev-sahibi/rezervasyonlar'
                      ? 'bg-gold-50 text-gold-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cikis Yap
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Rezervasyonlar</h1>
              <p className="text-gray-500 mt-1">Gelen rezervasyonları yönetin</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {[
                { key: 'all', label: 'Tümü' },
                { key: 'pending', label: 'Beklemede' },
                { key: 'confirmed', label: 'Onaylanan' },
                { key: 'completed', label: 'Tamamlanan' },
                { key: 'cancelled', label: 'İptal' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === tab.key
                      ? 'bg-gold-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'all' && (
                    <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                      {bookings.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Bookings Table */}
            {filteredBookings.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Misafir
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          İlan
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Tarihler
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Tutar
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">
                              {booking.guest?.name || booking.guestName || booking.guestId}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700 truncate max-w-[200px]">
                              {booking.listing?.title || booking.listingTitle || booking.listingId}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">
                              {formatDate(booking.checkIn)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(booking.checkOut)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(booking.totalPrice)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${
                                statusColors[booking.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {statusLabels[booking.status] || booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                    disabled={updating === booking.id}
                                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                                  >
                                    {updating === booking.id ? '...' : 'Onayla'}
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                    disabled={updating === booking.id}
                                    className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                  >
                                    İptal
                                  </button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                    disabled={updating === booking.id}
                                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                  >
                                    {updating === booking.id ? '...' : 'Tamamla'}
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                    disabled={updating === booking.id}
                                    className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                  >
                                    İptal
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {booking.guest?.name || booking.guestName || booking.guestId}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {booking.listing?.title || booking.listingTitle || booking.listingId}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            statusColors[booking.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {statusLabels[booking.status] || booking.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-gray-500">
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(booking.totalPrice)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              disabled={updating === booking.id}
                              className="flex-1 py-2 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                              disabled={updating === booking.id}
                              className="flex-1 py-2 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              İptal
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'completed')}
                              disabled={updating === booking.id}
                              className="flex-1 py-2 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              Tamamla
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                              disabled={updating === booking.id}
                              className="flex-1 py-2 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              İptal
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Rezervasyon bulunamadı</h3>
                <p className="text-gray-500 text-sm">
                  {filter === 'all'
                    ? 'Henüz hiç rezervasyonunuz yok.'
                    : 'Bu filtreye uygun rezervasyon bulunamadı.'}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
