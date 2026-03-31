'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  listing?: { id: string; title: string };
  listingTitle?: string;
  guest?: { id: string; name: string };
  guestName?: string;
  host?: { id: string; name: string };
  hostName?: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  commission?: number;
  status: string;
  paymentStatus?: string;
}

const sidebarLinks = [
  { href: '/admin/panel', label: 'Panel', icon: '📊' },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: '👥' },
  { href: '/admin/ilanlar', label: 'İlanlar', icon: '🏠' },
  { href: '/admin/rezervasyonlar', label: 'Rezervasyonlar', icon: '📅' },
  { href: '/admin/gelirler', label: 'Gelirler', icon: '💰' },
  { href: '/admin/abonelikler', label: 'Abonelikler', icon: '⭐' },
  { href: '/admin/mesajlar', label: 'Mesajlar', icon: '💬' },
  { href: '/admin/emanet', label: 'Emanet', icon: '🔒' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandi',
  completed: 'Tamamlandi',
  cancelled: 'Iptal Edildi',
};


export default function AdminRezervasyonlarPage() {
  const { user, isLoading: authLoading, loadFromStorage, logout } = useAuthStore();
  const router = useRouter();
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
    fetchBookings();
  }, [user, authLoading, router]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getBookings();
      setBookings(data.bookings || data);
    } catch (error) {
      console.error('Rezervasyonlar yuklenirken hata:', error);
    } finally {
      setLoading(false);
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
                link.href === '/admin/rezervasyonlar' ? 'bg-slate-700 border-r-2 border-gold-500' : 'text-slate-300'
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
            <h2 className="text-2xl font-bold text-gray-800">Rezervasyon Yonetimi</h2>
            <p className="text-gray-500 mt-1">Tum rezervasyonlari goruntuleyin ve yonetin</p>
          </div>

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
                      <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">İlan</th>
                      <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Misafir</th>
                      <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ev Sahibi</th>
                      <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarihler</th>
                      <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fiyat</th>
                      <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rezervasyon Durumu</th>
                      <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ev Sahibi Onayı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm font-medium text-gray-800 max-w-[150px] truncate">
                          {booking.listing?.title || booking.listingTitle || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {booking.guest?.name || booking.guestName || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {booking.host?.name || booking.hostName || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          <div>{formatDate(booking.checkIn)}</div>
                          <div className="text-slate-400">- {formatDate(booking.checkOut)}</div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-800">
                          {formatCurrency(booking.totalPrice)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                            {statusLabels[booking.status] || booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {booking.status === 'pending' ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Onay Bekleniyor</span>
                          ) : booking.status === 'confirmed' ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Onaylandı</span>
                          ) : booking.status === 'completed' ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Tamamlandı</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">İptal Edildi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          Henüz rezervasyon bulunmuyor
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
