'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
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

const roleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'host':
      return 'bg-blue-100 text-blue-800';
    case 'guest':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const roleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'host':
      return 'Ev Sahibi';
    case 'guest':
      return 'Misafir';
    default:
      return role;
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

export default function AdminKullanicilarPage() {
  const { user, isLoading: authLoading, loadFromStorage, logout } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedUsers, setEditedUsers] = useState<Record<string, { role?: string; subscriptionPlan?: string }>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/giris');
      return;
    }
    fetchUsers();
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminUsers();
      setUsers(data.users || data);
    } catch (error) {
      console.error('Kullanicilar yuklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userId: string, field: string, value: string) => {
    setEditedUsers((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (userId: string) => {
    const changes = editedUsers[userId];
    if (!changes) return;

    try {
      setSaving(userId);
      await api.updateAdminUser(userId, changes);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...changes } : u))
      );
      setEditedUsers((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setSuccessMsg('Kullanici basariyla guncellendi');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Kullanici guncellenirken hata:', error);
    } finally {
      setSaving(null);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar toggle */}
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
                link.href === '/admin/kullanicilar' ? 'bg-slate-700 border-r-2 border-gold-500' : 'text-slate-300'
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
            <h2 className="text-2xl font-bold text-gray-800">Kullanici Yonetimi</h2>
            <p className="text-gray-500 mt-1">Tum kullanicilari goruntuleyin ve duzenleyin</p>
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
                        Ad Soyad
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        E-posta
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Abonelik
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
                    {users.map((u) => {
                      const edited = editedUsers[u.id];
                      const currentRole = edited?.role || u.role;
                      const currentPlan = edited?.subscriptionPlan ?? u.subscriptionPlan;
                      const hasChanges = !!edited;

                      return (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center text-gold-600 font-semibold text-sm">
                                {u.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <span className="font-medium text-gray-800">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                          <td className="px-6 py-4">
                            <select
                              value={currentRole}
                              onChange={(e) => handleEdit(u.id, 'role', e.target.value)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${roleBadge(currentRole)}`}
                            >
                              <option value="guest">Misafir</option>
                              <option value="host">Ev Sahibi</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={currentPlan || 'none'}
                              onChange={(e) =>
                                handleEdit(u.id, 'subscriptionPlan', e.target.value === 'none' ? '' : e.target.value)
                              }
                              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                            >
                              <option value="none">Standart</option>
                              <option value="basic">Standart</option>
                              <option value="premium">Premium</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            {hasChanges && (
                              <button
                                onClick={() => handleSave(u.id)}
                                disabled={saving === u.id}
                                className="bg-gold-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50"
                              >
                                {saving === u.id ? 'Kaydediliyor...' : 'Kaydet'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          Henuz kullanici bulunmuyor
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
