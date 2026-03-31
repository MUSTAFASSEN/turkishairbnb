'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface HeldBooking {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  commissionAmount: number;
  hostEarnings: number;
  status: string;
  paymentStatus: string;
  listing: { id: string; title: string; city: string } | null;
  guest: { id: string; name: string } | null;
  host: { id: string; name: string } | null;
}

interface EmanetStats {
  totalHeldAmount: number;
  totalHeldCount: number;
  totalCommissionHeld: number;
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
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

export default function AdminEmanetPage() {
  const { user, isLoading: authLoading, loadFromStorage, logout } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<HeldBooking[]>([]);
  const [stats, setStats] = useState<EmanetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { router.push('/giris'); return; }
    fetchData();
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminEmanet() as { bookings: HeldBooking[]; stats: EmanetStats };
      setBookings(data.bookings || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Emanet verileri yuklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (booking: HeldBooking, action: 'release' | 'refund') => {
    const key = booking.id + '-' + action;
    setActionLoading(key);
    try {
      await api.processPayment({ bookingId: booking.id, action });
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      setStats(prev => prev ? {
        totalHeldAmount: prev.totalHeldAmount - booking.totalPrice,
        totalHeldCount: prev.totalHeldCount - 1,
        totalCommissionHeld: prev.totalCommissionHeld - booking.commissionAmount,
      } : prev);
      setSuccessMsg(action === 'release'
        ? `"${booking.listing?.title ?? booking.listingId}" ödemesi ev sahibine aktarıldı.`
        : `"${booking.listing?.title ?? booking.listingId}" ödemesi iade edildi.`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Islem hatasi:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" />
    </div>
  );
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white p-2 rounded-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-gold-500">TurkEvim Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Yönetim Paneli</p>
        </div>
        <nav className="mt-4">
          {sidebarLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-6 py-3 text-sm hover:bg-slate-700 transition-colors ${
                link.href === '/admin/emanet' ? 'bg-slate-700 border-r-2 border-gold-500' : 'text-slate-300'
              }`}
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
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Emanet Paralar</h2>
            <p className="text-gray-500 mt-1">Ödeme bekleyen (emanette tutulan) rezervasyonlar</p>
          </div>

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {successMsg}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Toplam Emanet Tutar</p>
                      <p className="text-2xl font-bold text-gold-600 mt-1">{formatCurrency(stats?.totalHeldAmount ?? 0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Emanetteki Rezervasyon</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.totalHeldCount ?? 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Toplam Komisyon (Emanette)</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats?.totalCommissionHeld ?? 0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['İlan', 'Misafir', 'Ev Sahibi', 'Giriş Tarihi', 'Çıkış Tarihi', 'Toplam', 'Ev Sahibi Kazancı', 'Komisyon', 'Durum', 'İşlemler'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <p className="font-medium text-sm text-gray-900 max-w-[160px] truncate">{b.listing?.title ?? '-'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{b.listing?.city ?? ''}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">{b.guest?.name ?? '-'}</td>
                          <td className="px-4 py-4 text-sm text-gray-700">{b.host?.name ?? '-'}</td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{formatDate(b.checkIn)}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(b.checkOut)}</td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(b.totalPrice)}</td>
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{formatCurrency(b.hostEarnings ?? 0)}</td>
                          <td className="px-4 py-4 text-sm font-medium text-gold-600 whitespace-nowrap">{formatCurrency(b.commissionAmount ?? 0)}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {statusLabels[b.status] ?? b.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAction(b, 'release')}
                                disabled={actionLoading !== null}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {actionLoading === b.id + '-release'
                                  ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                }
                                Serbest Bırak
                              </button>
                              <button
                                onClick={() => handleAction(b, 'refund')}
                                disabled={actionLoading !== null}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {actionLoading === b.id + '-refund'
                                  ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                }
                                İade Et
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={10} className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <p className="text-gray-500 font-medium">Emanette bekleyen rezervasyon yok</p>
                              <p className="text-gray-400 text-sm">Tüm ödemeler işlenmiş görünüyor.</p>
                            </div>
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
