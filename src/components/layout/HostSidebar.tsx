'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const sidebarLinks = [
  { href: '/ev-sahibi/panel', label: 'Panel', icon: '📊' },
  { href: '/ev-sahibi/ilanlar/yeni', label: 'Yeni İlan', icon: '➕' },
  { href: '/ev-sahibi/rezervasyonlar', label: 'Rezervasyonlar', icon: '📅' },
  { href: '/ev-sahibi/kazanclar', label: 'Kazançlar', icon: '💰' },
  { href: '/ev-sahibi/abonelik', label: 'Abonelik', icon: '⭐' },
];

export function HostSidebar({ active }: { active: string }) {
  const router = useRouter();
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 bg-white shadow-lg rounded-xl p-4 h-fit sticky top-24 hidden lg:block">
      <h2 className="text-lg font-bold text-gray-800 mb-4 px-3">Ev Sahibi Paneli</h2>
      <nav className="space-y-1">
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active === link.href
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
  );
}

export function MobileNav({ active }: { active: string }) {
  return (
    <div className="lg:hidden overflow-x-auto mb-6">
      <div className="flex gap-2 min-w-max">
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              active === link.href
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
  );
}
