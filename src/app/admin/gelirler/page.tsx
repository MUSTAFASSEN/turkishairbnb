'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  listing?: { title: string };
  listingTitle?: string;
  guest?: { name: string };
  guestName?: string;
  totalPrice: number;
  commission?: number;
  status: string;
  checkIn: string;
}

interface Stats {
  totalRevenue: number;
  commissionRevenue: number;
  subscriptionRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  subscriptionCounts?: {
    basic: number;
    premium: number;
  };
}

const sidebarLinks = [
  { href: '/admin/panel', label: 'Panel', icon: '📊' },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: '👥' },
  { href: '/admin/ilanlar', label: 'İlanlar', icon: '🏠' },
  { href: '/admin/rezervasyonlar', label: 'Rezervasyonlar', icon: '📅' },
  { href: '/admin/gelirler', label: 'Gelirler', icon: '💰' },
  { href: '/admin/abonelikler', label: 'Abonelikler', icon: '⭐' },
  { href: '/admin/mesajlar', label: 'Mesajlar', icon: '💬' },
];

const COMMISSION_RATE = 0.05;
const BASIC_PRICE = 0;
const PREMIUM_PRICE = 499.99;

export default function AdminGelirlerPage() {
  const { user, isLoading: authLoading, loadFromStorage, logout } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/giris');
      return;
    }
    fetchData();
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, bookingsData] = await Promise.all([
        api.getAdminStats(),
        api.getBookings(),
      ]);
      setStats(statsData);
      const allBookings = bookingsData.bookings || bookingsData;
      setBookings(Array.isArray(allBookings) ? allBookings : []);
    } catch (error) {
      console.error('Gelir verileri yuklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return null;
  }

  const totalCommission = bookings.reduce(
    (sum, b) => sum + (b.commission || b.totalPrice * COMMISSION_RATE),
    0
  );

  const basicCount = stats?.subscriptionCounts?.basic || 0;
  const premiumCount = stats?.subscriptionCounts?.premium || 0;
  const subscriptionRevenue =
    stats?.subscriptionRevenue || basicCount * BASIC_PRICE + premiumCount * PREMIUM_PRICE;

  const totalRevenue = stats?.totalRevenue || totalCommission + subscriptionRevenue;

  const maxRevenue = stats?.monthlyRevenue
    ? Math.max(...stats.monthlyRevenue.map((m) => m.revenue), 1)
    : 1;

  const commissionPercentage = totalRevenue > 0 ? ((totalCommission / totalRevenue) * 100).toFixed(1) : '0';
  const subscriptionPercentage = totalRevenue > 0 ? ((subscriptionRevenue / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white p-2 rounded-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-gold-500">TurkEvim Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Yonetim Paneli</p>
        </div>
        <nav className="mt-4">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm hover:bg-slate-700 transition-colors ${
                link.href === '/admin/gelirler' ? 'bg-slate-700 border-r-2 border-gold-500' : 'text-slate-300'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cikis Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Gelir Raporu</h2>
            <p className="text-gray-500 mt-1">Platform gelirlerinin detayli analizi</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
            </div>
          ) : (
            <>
              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Toplam Gelir</h3>
                    <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{formatCurrency(totalRevenue)}</p>
                  <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gold-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Komisyon Geliri (%5)</h3>
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{formatCurrency(totalCommission)}</p>
                  <p className="text-sm text-slate-400 mt-2">Toplam gelirin %{commissionPercentage}&apos;i</p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${commissionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Abonelik Geliri</h3>
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{formatCurrency(subscriptionRevenue)}</p>
                  <p className="text-sm text-slate-400 mt-2">Toplam gelirin %{subscriptionPercentage}&apos;i</p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${subscriptionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Counts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Abonelik Dagilimi</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">Standart Plan</p>
                        <p className="text-sm text-gray-500">Ucretsiz</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{basicCount}</p>
                        <p className="text-sm text-gray-500">abone</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">Premium Plan</p>
                        <p className="text-sm text-gray-500">{PREMIUM_PRICE} TL/ay</p>

                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">{premiumCount}</p>
                        <p className="text-sm text-gray-500">abone</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-t-2 border-gray-200">
                      <div>
                        <p className="font-medium text-gray-800">Aylik Abonelik Geliri</p>
                      </div>
                      <p className="text-xl font-bold text-gray-800">
                        {formatCurrency(basicCount * BASIC_PRICE + premiumCount * PREMIUM_PRICE)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Komisyon Ozeti</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">Komisyon Orani</p>
                        <p className="text-sm text-gray-500">Her rezervasyondan</p>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">%5</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">Toplam Rezervasyon</p>
                        <p className="text-sm text-gray-500">Tum zamanlar</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{bookings.length}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-t-2 border-gray-200">
                      <div>
                        <p className="font-medium text-gray-800">Toplam Komisyon</p>
                      </div>
                      <p className="text-xl font-bold text-gray-800">
                        {formatCurrency(totalCommission)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Revenue Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Aylik Gelir Grafigi</h3>
                {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                  <div className="flex items-end gap-2 h-64">
                    {stats.monthlyRevenue.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">
                          {formatCurrency(item.revenue)}
                        </span>
                        <div
                          className="w-full bg-gradient-to-t from-gold-600 to-gold-400 rounded-t-md transition-all duration-500 min-h-[4px]"
                          style={{
                            height: `${(item.revenue / maxRevenue) * 200}px`,
                          }}
                        />
                        <span className="text-xs text-gray-500">{item.month}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-12">Henuz aylik gelir verisi bulunmuyor</p>
                )}
              </div>

              {/* Per-Booking Commission Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Rezervasyon Bazli Komisyon Detayi</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Ilan
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Misafir
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Toplam Fiyat
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Komisyon (%5)
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bookings.map((booking) => {
                        const commission = booking.commission || booking.totalPrice * COMMISSION_RATE;
                        return (
                          <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-gray-800">
                              {booking.listing?.title || booking.listingTitle || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {booking.guest?.name || booking.guestName || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-800">
                              {formatCurrency(booking.totalPrice)}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gold-600">
                              {formatCurrency(commission)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  booking.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.status === 'confirmed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : booking.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {booking.status === 'completed'
                                  ? 'Tamamlandi'
                                  : booking.status === 'confirmed'
                                  ? 'Onaylandi'
                                  : booking.status === 'cancelled'
                                  ? 'Iptal'
                                  : 'Beklemede'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                            Henuz rezervasyon bulunmuyor
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
