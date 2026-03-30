'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Listing {
  id: string;
  title: string;
  city: string;
  pricePerNight: number;
  isFeatured: boolean;
  featuredStartAt?: string;
  featuredEndAt?: string;
  isActive: boolean;
  hostId: string;
}

interface AdminUser {
  id: string;
  name: string;
}

interface UserMap {
  [key: string]: string;
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

export default function AdminIlanlarPage() {
  const { user, isLoading: authLoading, loadFromStorage, logout } = useAuthStore();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      const [listingsData, usersData] = await Promise.all([
        api.getListings(),
        api.getAdminUsers(),
      ]);
      setListings(listingsData.listings || listingsData);
      const usersArr = usersData.users || usersData;
      const map: UserMap = {};
      if (Array.isArray(usersArr)) {
        usersArr.forEach((u: AdminUser) => {
          map[u.id] = u.name;
        });
      }
      setUserMap(map);
    } catch (error) {
      console.error('Veriler yuklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHostName = (listing: Listing): string => {
    if (listing.hostId && userMap[listing.hostId]) return userMap[listing.hostId];
    return 'Bilinmiyor';
  };

  const toggleFeatured = async (listing: Listing) => {
    try {
      setActionLoading(listing.id + '-featured');
      const data = await api.updateListing(listing.id, { isFeatured: !listing.isFeatured });
      setListings((prev) =>
        prev.map((l) => l.id === listing.id ? { ...l, ...data.listing } : l)
      );
      setSuccessMsg(listing.isFeatured ? 'İlan öne çıkarılmaktan kaldırıldı' : 'İlan öne çıkarıldı');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Ilan guncellenirken hata:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActive = async (listing: Listing) => {
    try {
      setActionLoading(listing.id + '-active');
      await api.updateListing(listing.id, { isActive: !listing.isActive });
      setListings((prev) =>
        prev.map((l) =>
          l.id === listing.id ? { ...l, isActive: !l.isActive } : l
        )
      );
      setSuccessMsg(listing.isActive ? 'Ilan pasif yapildi' : 'Ilan aktif yapildi');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Ilan guncellenirken hata:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm('Bu ilani silmek istediginizden emin misiniz?')) return;
    try {
      setActionLoading(listingId + '-delete');
      await api.deleteListing(listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      setSuccessMsg('Ilan basariyla silindi');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Ilan silinirken hata:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return null;
  }

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
                link.href === '/admin/ilanlar' ? 'bg-slate-700 border-r-2 border-gold-500' : 'text-slate-300'
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
            <h2 className="text-2xl font-bold text-gray-800">Ilan Yonetimi</h2>
            <p className="text-gray-500 mt-1">Tum ilanlari goruntuleyin ve duzenleyin</p>
          </div>

          {successMsg && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {successMsg}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Baslik
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Ev Sahibi
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Sehir
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Fiyat
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Öne Çıkan
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Öne Çıkarma Tarihleri
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Islemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {listings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">{listing.title}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {getHostName(listing)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{listing.city}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {formatCurrency(listing.pricePerNight)}/gece
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleFeatured(listing)}
                            disabled={actionLoading === listing.id + '-featured'}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              listing.isFeatured ? 'bg-gold-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                listing.isFeatured ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {listing.isFeatured && listing.featuredStartAt && listing.featuredEndAt ? (
                            <div className="text-xs">
                              <div className="flex items-center gap-1 text-green-600 font-medium">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Başlangıç: {new Date(listing.featuredStartAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="flex items-center gap-1 text-red-500 font-medium mt-0.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Bitiş: {new Date(listing.featuredEndAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleActive(listing)}
                            disabled={actionLoading === listing.id + '-active'}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              listing.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {listing.isActive ? 'Aktif' : 'Pasif'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => deleteListing(listing.id)}
                            disabled={actionLoading === listing.id + '-delete'}
                            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                          >
                            {actionLoading === listing.id + '-delete' ? 'Siliniyor...' : 'Sil'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {listings.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                          Henuz ilan bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
