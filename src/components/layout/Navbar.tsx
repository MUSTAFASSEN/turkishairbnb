'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export default function Navbar() {
  const { user, logout, loadFromStorage, loadFavorites } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFromStorage();
    setMounted(true);
  }, [loadFromStorage]);

  useEffect(() => {
    if (user) loadFavorites();
  }, [user, loadFavorites]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const data = await api.getConversations();
        const total = (data.conversations || []).reduce((sum: number, c: { unread: number }) => sum + (c.unread || 0), 0);
        setUnreadCount(total);
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const t = setInterval(fetchUnread, 30000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
    setMenuOpen(false);
  };

  // Hide navbar on admin and host panel pages
  const isPanel = pathname.startsWith('/admin') || pathname.startsWith('/ev-sahibi');
  if (isPanel) return null;

  // Skeleton while loading
  if (!mounted) return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <Link href="/" className="text-gold-500 font-bold text-xl">TürkEvim</Link>
      </div>
    </nav>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg className="w-8 h-8 text-gold-500" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 1C7.7 1 1 7.7 1 16s6.7 15 15 15 15-6.7 15-15S24.3 1 16 1zm-.2 24.2c-2.5-1.5-8.3-5.5-8.3-11.4 0-3.2 2.1-5.3 4.5-5.3 1.6 0 3 .8 3.8 2.2.8-1.4 2.2-2.2 3.8-2.2 2.4 0 4.5 2.1 4.5 5.3 0 5.9-5.8 9.9-8.3 11.4z"/>
          </svg>
          <span className="text-gold-500 font-bold text-xl hidden sm:inline">TürkEvim</span>
        </Link>

        {/* Center - Mini Search Bar (desktop) */}
        <Link
          href="/ilanlar"
          className="hidden md:flex items-center border border-gray-200 rounded-pill shadow-sm hover:shadow-md transition-shadow px-4 py-2 gap-4 cursor-pointer"
        >
          <span className="text-sm font-semibold text-hof border-r border-gray-200 pr-4">Herhangi bir yer</span>
          <span className="text-sm font-semibold text-hof border-r border-gray-200 pr-4">Herhangi bir hafta</span>
          <span className="text-sm text-foggy">Misafir ekleyin</span>
          <div className="bg-gold-500 rounded-full p-2 ml-1">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </Link>

        {/* Right - User Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {user?.role === 'host' && (
            <Link href="/ev-sahibi/panel" className="hidden lg:block text-sm font-semibold text-hof hover:bg-gray-100 px-4 py-2.5 rounded-pill transition">
              Ev sahibi paneli
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link href="/admin/panel" className="hidden lg:block text-sm font-semibold text-hof hover:bg-gray-100 px-4 py-2.5 rounded-pill transition">
              Admin paneli
            </Link>
          )}
          {!user && (
            <Link href="/kayit" className="hidden lg:block text-sm font-semibold text-hof hover:bg-gray-100 px-4 py-2.5 rounded-pill transition">
              Evinizi açın
            </Link>
          )}

          {/* Profile button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 border border-gray-200 rounded-pill p-1.5 pl-3 hover:shadow-md transition-shadow"
            >
              <svg className="w-4 h-4 text-hof" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-hof">{user.name}</p>
                      <p className="text-xs text-foggy">{user.email}</p>
                    </div>
                    <Link href="/profil" className="block px-4 py-2.5 text-sm text-hof hover:bg-gray-50 transition" onClick={() => setMenuOpen(false)}>
                      Profil
                    </Link>
                    <Link href="/favorilerim" className="block px-4 py-2.5 text-sm text-hof hover:bg-gray-50 transition" onClick={() => setMenuOpen(false)}>
                      Favorilerim
                    </Link>
                    <Link
                      href={user.role === 'admin' ? '/admin/mesajlar' : '/mesajlar'}
                      className="flex items-center justify-between px-4 py-2.5 text-sm text-hof hover:bg-gray-50 transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>Mesajlar</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link href="/ilanlar" className="block px-4 py-2.5 text-sm text-hof hover:bg-gray-50 transition" onClick={() => setMenuOpen(false)}>
                      İlanları Keşfet
                    </Link>
                    {user.role === 'host' && (
                      <Link href="/ev-sahibi/panel" className="block px-4 py-2.5 text-sm text-hof hover:bg-gray-50 transition lg:hidden" onClick={() => setMenuOpen(false)}>
                        Ev Sahibi Paneli
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link href="/admin/panel" className="block px-4 py-2.5 text-sm text-hof hover:bg-gray-50 transition lg:hidden" onClick={() => setMenuOpen(false)}>
                        Admin Paneli
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-hof hover:bg-gray-50 transition">
                        Çıkış yap
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/giris" className="block px-4 py-2.5 text-sm font-semibold text-hof hover:bg-gray-50 transition" onClick={() => setMenuOpen(false)}>
                      Giriş yap
                    </Link>
                    <Link href="/kayit" className="block px-4 py-2.5 text-sm text-hof hover:bg-gray-50 transition" onClick={() => setMenuOpen(false)}>
                      Kayıt ol
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <Link href="/kayit" className="block px-4 py-2.5 text-sm text-hof hover:bg-gray-50 transition" onClick={() => setMenuOpen(false)}>
                        Evinizi açın
                      </Link>
                      <Link href="/ilanlar" className="block px-4 py-2.5 text-sm text-hof hover:bg-gray-50 transition" onClick={() => setMenuOpen(false)}>
                        İlanları Keşfet
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-6 pb-3">
        <Link
          href="/ilanlar"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-pill shadow-sm px-4 py-3 w-full"
        >
          <svg className="w-5 h-5 text-hof" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-hof">Herhangi bir yer</p>
            <p className="text-xs text-foggy">Herhangi bir hafta · Misafir ekleyin</p>
          </div>
        </Link>
      </div>
    </nav>
  );
}
