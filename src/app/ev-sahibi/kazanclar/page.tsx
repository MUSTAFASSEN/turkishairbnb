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

interface HostStats {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  activeBookings: number;
  totalEarnings: number;
  pendingEarnings: number;
  monthlyEarnings: { month: string; amount: number }[];
}

interface Booking {
  id: string;
  listingId: string;
  listingTitle?: string;
  guestId: string;
  guestName?: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  commissionAmount: number;
  hostEarnings: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const paymentStatusColors: Record<string, string> = {
  held: 'bg-yellow-100 text-yellow-700',
  released: 'bg-green-100 text-green-700',
  refunded: 'bg-red-100 text-red-700',
};

const paymentStatusLabels: Record<string, string> = {
  held: 'Beklemede',
  released: 'Ödendi',
  refunded: 'İade Edildi',
};

export default function HostEarningsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, loadFromStorage, logout } = useAuthStore();
  const [stats, setStats] = useState<HostStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'host') {
      router.push('/giris');
      return;
    }

    async function fetchData() {
      try {
        const [statsData, bookingsData] = await Promise.all([
          api.getHostStats(),
          api.getBookings('role=host'),
        ]);
        setStats(statsData as HostStats);
        const bookingsArr = bookingsData.bookings || bookingsData;
        setBookings(Array.isArray(bookingsArr) ? bookingsArr : []);
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'host') return null;

  const totalGross = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalCommission = bookings.reduce((sum, b) => sum + (b.commissionAmount || b.totalPrice * 0.05), 0);
  const totalNet = bookings.reduce((sum, b) => sum + (b.hostEarnings || b.totalPrice * 0.95), 0);

  const completedBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'confirmed');

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
                  link.href === '/ev-sahibi/kazanclar'
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
                    link.href === '/ev-sahibi/kazanclar'
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
              <h1 className="text-2xl font-bold text-gray-900">Kazançlarım</h1>
              <p className="text-gray-500 mt-1">Gelir ve komisyon detaylarınız</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Toplam Gelir (Brüt)</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalGross)}</p>
                <p className="text-xs text-gray-400 mt-2">Komisyon öncesi toplam</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Toplam Komisyon (%5)</p>
                <p className="text-2xl font-bold text-gold-500">{formatCurrency(totalCommission)}</p>
                <p className="text-xs text-gray-400 mt-2">Platform komisyonu</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Net Kazanç</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalNet)}</p>
                <p className="text-xs text-gray-400 mt-2">Komisyon sonrası kazanç</p>
              </div>
            </div>

            {/* Pending vs Released */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
                    <span className="text-lg">⏳</span>
                  </div>
                  <div>
                    <p className="text-sm text-amber-700 font-medium">Bekleyen Kazanç</p>
                    <p className="text-xl font-bold text-amber-900">
                      {formatCurrency(stats?.pendingEarnings ?? 0)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  Konaklama tamamlandıktan sonra ödenir
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                    <span className="text-lg">✅</span>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">Ödenen Kazanç</p>
                    <p className="text-xl font-bold text-green-900">
                      {formatCurrency(stats?.totalEarnings ?? 0)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Hesabınıza aktarılan toplam tutar
                </p>
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Komisyon Detayı</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Platform Komisyon Oranı</span>
                  <span className="text-sm font-semibold text-gray-900">%5</span>
                </div>
                <div className="border-t border-gray-200 my-2" />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Toplam Rezervasyon Tutarı</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(totalGross)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Komisyon Kesintisi (%5)</span>
                  <span className="text-sm font-semibold text-gold-500">-{formatCurrency(totalCommission)}</span>
                </div>
                <div className="border-t border-gray-200 my-2" />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-900">Net Kazancınız</span>
                  <span className="text-base font-bold text-green-600">{formatCurrency(totalNet)}</span>
                </div>
              </div>
            </div>

            {/* Monthly Earnings Table */}
            {stats?.monthlyEarnings && stats.monthlyEarnings.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Aylık Kazanç Tablosu</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Ay
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Brüt Gelir
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Komisyon (%5)
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Net Kazanç
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats.monthlyEarnings.map((item, index) => {
                        const commission = item.amount * 0.05;
                        const net = item.amount - commission;
                        return (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                              {item.month}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 text-right">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gold-500 text-right">
                              -{formatCurrency(commission)}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">
                              {formatCurrency(net)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Status Per Booking */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rezervasyon Bazlı Ödeme Durumu</h2>
              {completedBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          İlan
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Tarih
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Tutar
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Komisyon
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Net
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Ödeme Durumu
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {completedBookings.map((booking) => {
                        const commission = booking.commissionAmount || booking.totalPrice * 0.05;
                        const net = booking.hostEarnings || booking.totalPrice * 0.95;
                        return (
                          <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-900 truncate max-w-[200px]">
                              {booking.listingTitle || booking.listingId}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(booking.checkIn)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 text-right">
                              {formatCurrency(booking.totalPrice)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gold-500 text-right">
                              -{formatCurrency(commission)}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">
                              {formatCurrency(net)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                                  paymentStatusColors[booking.paymentStatus] || 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {paymentStatusLabels[booking.paymentStatus] || booking.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Henüz ödeme kaydı bulunmuyor
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
