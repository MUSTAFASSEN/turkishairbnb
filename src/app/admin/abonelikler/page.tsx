'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HostUser {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionPlan?: string;
  createdAt: string;
}

const sidebarLinks = [
  { href: '/admin/panel', label: 'Panel', icon: '📊' },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: '👥' },
  { href: '/admin/ilanlar', label: 'İlanlar', icon: '🏠' },
  { href: '/admin/rezervasyonlar', label: 'Rezervasyonlar', icon: '📅' },
  { href: '/admin/gelirler', label: 'Gelirler', icon: '💰' },
  { href: '/admin/abonelikler', label: 'Abonelikler', icon: '⭐' },
];

const BASIC_PRICE = 0;
const PREMIUM_PRICE = 499.99;

const planBadge = (plan?: string) => {
  switch (plan) {
    case 'basic':
      return 'bg-blue-100 text-blue-800';
    case 'premium':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const planLabel = (plan?: string) => {
  switch (plan) {
    case 'basic':
      return 'Standart';
    case 'premium':
      return 'Premium';
    default:
      return 'Standart';
  }
};

export default function AdminAboneliklerPage() {
  const { user, isLoading: authLoading, loadFromStorage, logout } = useAuthStore();
  const router = useRouter();
  const [hosts, setHosts] = useState<HostUser[]>([]);
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
    fetchHosts();
  }, [user, authLoading, router]);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminUsers();
      const allUsers = data.users || data;
      const hostUsers = Array.isArray(allUsers)
        ? allUsers.filter((u: HostUser) => u.role === 'host' || u.role === 'admin')
        : [];
      setHosts(hostUsers);
    } catch (error) {
      console.error('Ev sahipleri yuklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (userId: string, plan: string) => {
    try {
      setActionLoading(userId);
      await api.updateSubscription(userId, plan);
      setHosts((prev) =>
        prev.map((h) =>
          h.id === userId ? { ...h, subscriptionPlan: plan || undefined } : h
        )
      );
      const label = plan === 'basic' ? 'Standart' : plan === 'premium' ? 'Premium' : 'Yok';
      setSuccessMsg(`Abonelik plani "${label}" olarak guncellendi`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Abonelik guncellenirken hata:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return null;
  }

  const basicCount = hosts.filter((h) => h.subscriptionPlan === 'basic').length;
  const premiumCount = hosts.filter((h) => h.subscriptionPlan === 'premium').length;
  const noSubCount = hosts.filter((h) => !h.subscriptionPlan || h.subscriptionPlan === 'none').length;

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
                link.href === '/admin/abonelikler' ? 'bg-slate-700 border-r-2 border-gold-500' : 'text-slate-300'
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
            <h2 className="text-2xl font-bold text-gray-800">Abonelik Yonetimi</h2>
            <p className="text-gray-500 mt-1">Ev sahiplerinin abonelik planlarini yonetin</p>
          </div>

          {successMsg && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {successMsg}
            </div>
          )}

          {/* Plan Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Plan Yok</h3>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{noSubCount}</p>
              <p className="text-sm text-slate-400 mt-1">ev sahibi</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Standart Plan</h3>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{basicCount}</p>
              <p className="text-sm text-slate-400 mt-1">
                {formatCurrency(BASIC_PRICE)}/ay - Toplam: {formatCurrency(basicCount * BASIC_PRICE)}/ay
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-200 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Premium Plan</h3>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{premiumCount}</p>
              <p className="text-sm text-slate-400 mt-1">
                {formatCurrency(PREMIUM_PRICE)}/ay - Toplam: {formatCurrency(premiumCount * PREMIUM_PRICE)}/ay
              </p>
            </div>
          </div>

          {/* Plan Pricing Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-3">Standart Plan</h3>
              <p className="text-3xl font-bold text-blue-600 mb-4">
                Ucretsiz
              </p>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Aylik 3 ilan hakki
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Temel istatistikler
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  E-posta destegi
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-bold text-purple-800 mb-3">Premium Plan</h3>
              <p className="text-3xl font-bold text-purple-600 mb-4">
                {formatCurrency(PREMIUM_PRICE)}
                <span className="text-sm font-normal text-purple-400">/ay</span>
              </p>
              <ul className="space-y-2 text-sm text-purple-700">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Sinirsiz ilan
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Aylik 5 one cikarma hakki
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Tum eklentilere erisim
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Oncelikli 7/24 destek
                </li>
              </ul>
            </div>
          </div>

          {/* Hosts Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Ev Sahipleri ve Abonelik Planlari</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Ev Sahibi
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        E-posta
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Mevcut Plan
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Kayit Tarihi
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Islemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hosts.map((host) => (
                      <tr key={host.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center text-gold-600 font-semibold text-sm">
                              {host.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-gray-800">{host.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{host.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${planBadge(host.subscriptionPlan)}`}
                          >
                            {planLabel(host.subscriptionPlan)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(host.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {host.subscriptionPlan !== 'basic' && (
                              <button
                                onClick={() => updatePlan(host.id, 'basic')}
                                disabled={actionLoading === host.id}
                                className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === host.id ? '...' : 'Standart Yap'}
                              </button>
                            )}
                            {host.subscriptionPlan !== 'premium' && (
                              <button
                                onClick={() => updatePlan(host.id, 'premium')}
                                disabled={actionLoading === host.id}
                                className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === host.id ? '...' : 'Premium Yap'}
                              </button>
                            )}
                            {host.subscriptionPlan && host.subscriptionPlan !== 'none' && (
                              <button
                                onClick={() => updatePlan(host.id, 'none')}
                                disabled={actionLoading === host.id}
                                className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === host.id ? '...' : 'Iptal Et'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {hosts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          Henuz ev sahibi bulunmuyor
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
