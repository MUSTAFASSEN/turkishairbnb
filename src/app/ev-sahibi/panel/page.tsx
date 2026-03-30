'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { HostSidebar, MobileNav } from '@/components/layout/HostSidebar';

interface HostListing {
  id: string;
  title: string;
  city: string;
  pricePerNight: number;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  featuredStartAt?: string;
  featuredEndAt?: string;
  averageRating: number;
  totalReviews: number;
  maxGuests: number;
  bedrooms: number;
}

interface HostStats {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  activeBookings: number;
  totalEarnings: number;
  pendingEarnings: number;
  monthlyEarnings: { month: string; amount: number }[];
}

interface RecentBooking {
  id: string;
  guestName?: string;
  guestId: string;
  listingTitle?: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
}

export default function HostDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, loadFromStorage } = useAuthStore();
  const [stats, setStats] = useState<HostStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [myListings, setMyListings] = useState<HostListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [featureLoading, setFeatureLoading] = useState<string | null>(null);

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
        const statsData = await api.getHostStats() as HostStats;
        setStats(statsData);

        const bookingsRes = await api.getBookings('role=host&limit=5');
        const bookingsArr = bookingsRes.bookings || bookingsRes;
        setRecentBookings(Array.isArray(bookingsArr) ? bookingsArr : []);

        const listingsData = await api.getListings(`hostId=${user!.id}`) as { listings: HostListing[] };
        setMyListings(Array.isArray(listingsData?.listings) ? listingsData.listings : []);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading, router]);

  const toggleFeatured = async (listing: HostListing) => {
    setFeatureLoading(listing.id);
    try {
      const data = await api.updateListing(listing.id, { isFeatured: !listing.isFeatured });
      setMyListings(prev =>
        prev.map(l => l.id === listing.id ? { ...l, ...data.listing } : l)
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bir hata oluştu';
      alert(msg);
    } finally {
      setFeatureLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'host') return null;

  const maxMonthlyEarning = stats?.monthlyEarnings
    ? Math.max(...stats.monthlyEarnings.map((m) => m.amount), 1)
    : 1;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <MobileNav active="/ev-sahibi/panel" />
        <div className="flex gap-8">
          <HostSidebar active="/ev-sahibi/panel" />

          <main className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Hoş geldiniz, {user.name || 'Ev Sahibi'}</h1>
              <p className="text-gray-500 mt-1">Ev sahipliği panelinize genel bakış</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Aktif İlanlar</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats?.activeListings ?? 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🏠</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Toplam {stats?.totalListings ?? 0} ilan
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Toplam Rezervasyon</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats?.totalBookings ?? 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📅</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {stats?.activeBookings ?? 0} aktif rezervasyon
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Toplam Kazanç</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {formatCurrency(stats?.totalEarnings ?? 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">Komisyon düşülmüş tutar</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Bekleyen Kazanç</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">
                      {formatCurrency(stats?.pendingEarnings ?? 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">Ödeme bekleyen tutar</p>
              </div>
            </div>

            {/* Monthly Earnings Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Aylık Kazanç Grafiği</h2>
              {stats?.monthlyEarnings && stats.monthlyEarnings.length > 0 ? (
                <div className="flex items-end gap-3 h-48 px-2">
                  {stats.monthlyEarnings.map((item, index) => {
                    const heightPercent = (item.amount / maxMonthlyEarning) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">
                          {formatCurrency(item.amount)}
                        </span>
                        <div className="w-full relative" style={{ height: '160px' }}>
                          <div
                            className="absolute bottom-0 w-full bg-gradient-to-t from-gold-500 to-gold-400 rounded-t-lg transition-all duration-500 hover:from-gold-600 hover:to-gold-500"
                            style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  Henüz kazanç verisi bulunmuyor
                </div>
              )}
            </div>

            {/* My Listings */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">İlanlarım</h2>
                <Link
                  href="/ev-sahibi/ilanlar/yeni"
                  className="text-sm text-gold-500 hover:text-gold-600 font-medium flex items-center gap-1"
                >
                  <span>+ Yeni İlan</span>
                </Link>
              </div>
              {myListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-36">
                        <img
                          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 flex gap-1">
                          {listing.isFeatured && (
                            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                              Öne Çıkan
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              listing.isActive
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-500 text-white'
                            }`}
                          >
                            {listing.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{listing.city}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-gold-600">
                            {formatCurrency(listing.pricePerNight)}
                            <span className="text-xs font-normal text-gray-400"> /gece</span>
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="text-amber-500">★</span>
                            <span>{listing.averageRating > 0 ? listing.averageRating.toFixed(1) : '-'}</span>
                            <span>({listing.totalReviews})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>{listing.bedrooms} yatak odası</span>
                          <span>·</span>
                          <span>{listing.maxGuests} misafir</span>
                        </div>
                        {/* Feature toggle — herkese göster, premium olmayana kilit */}
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          {user?.subscriptionPlan === 'premium' ? (
                            <>
                              <button
                                onClick={() => toggleFeatured(listing)}
                                disabled={featureLoading === listing.id}
                                className={`w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                                  listing.isFeatured
                                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                              >
                                {featureLoading === listing.id ? (
                                  <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill={listing.isFeatured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                )}
                                {listing.isFeatured ? 'Öne Çıkarmayı Kaldır' : 'İlanı Öne Çıkar'}
                              </button>
                              {listing.isFeatured && listing.featuredStartAt && listing.featuredEndAt && (
                                <p className="text-[10px] text-amber-500 text-center mt-1">
                                  {new Date(listing.featuredStartAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                  {' – '}
                                  {new Date(listing.featuredEndAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </p>
                              )}
                            </>
                          ) : (
                            <Link
                              href="/ev-sahibi/abonelik"
                              className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-medium bg-amber-50 text-amber-500 hover:bg-amber-100 border border-amber-200 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Premium ile Öne Çıkar
                            </Link>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Link
                            href={`/ev-sahibi/ilanlar/duzenle?id=${listing.id}`}
                            className="flex-1 text-center text-xs py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                          >
                            Düzenle
                          </Link>
                          <Link
                            href={`/ilan/${listing.id}`}
                            className="flex-1 text-center text-xs py-1.5 rounded-lg bg-gold-50 text-gold-600 hover:bg-gold-100 transition-colors font-medium"
                          >
                            Görüntüle
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-3">Henüz ilanınız bulunmuyor</p>
                  <Link
                    href="/ev-sahibi/ilanlar/yeni"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors text-sm font-medium"
                  >
                    <span>+ İlk İlanınızı Oluşturun</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Links & Recent Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Links */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Erişim</h2>
                <div className="space-y-3">
                  <Link
                    href="/ev-sahibi/ilanlar/yeni"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gold-50 text-gold-600 hover:bg-gold-100 transition-colors"
                  >
                    <span className="text-lg">➕</span>
                    <span className="font-medium text-sm">Yeni İlan Oluştur</span>
                  </Link>
                  <Link
                    href="/ev-sahibi/rezervasyonlar"
                    className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <span className="text-lg">📅</span>
                    <span className="font-medium text-sm">Rezervasyonları Yönet</span>
                  </Link>
                  <Link
                    href="/ev-sahibi/kazanclar"
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                  >
                    <span className="text-lg">💰</span>
                    <span className="font-medium text-sm">Kazançları Görüntüle</span>
                  </Link>
                  <Link
                    href="/ev-sahibi/abonelik"
                    className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                  >
                    <span className="text-lg">⭐</span>
                    <span className="font-medium text-sm">Abonelik Planları</span>
                  </Link>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Son Rezervasyonlar</h2>
                  <Link
                    href="/ev-sahibi/rezervasyonlar"
                    className="text-sm text-gold-500 hover:text-gold-600 font-medium"
                  >
                    Tümünü Gör
                  </Link>
                </div>
                {recentBookings.length > 0 ? (
                  <div className="space-y-3">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {booking.listingTitle || booking.listingId}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {booking.guestName || booking.guestId}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(booking.totalPrice)}
                          </p>
                          <span
                            className={`inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                              statusColors[booking.status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {statusLabels[booking.status] || booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Henüz rezervasyon bulunmuyor
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
