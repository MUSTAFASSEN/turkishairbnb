'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isPanel = pathname.startsWith('/admin') || pathname.startsWith('/ev-sahibi');
  if (isPanel) return null;

  return (
    <footer className="bg-slate-50 border-t border-gray-200 mt-auto">
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-sm font-bold text-hof mb-4">TürkEvim</h4>
            <ul className="space-y-3 text-sm text-foggy">
              <li><Link href="/ilanlar" className="hover:underline hover:text-hof transition">İlanları Keşfet</Link></li>
              <li><Link href="/ev-sahibi" className="hover:underline hover:text-hof transition">Ev Sahibi Ol</Link></li>
              <li><span>Sadece %5 Komisyon</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-hof mb-4">Keşfet</h4>
            <ul className="space-y-3 text-sm text-foggy">
              <li><Link href="/ilanlar?city=İstanbul" className="hover:underline hover:text-hof transition">İstanbul</Link></li>
              <li><Link href="/ilanlar?city=Antalya" className="hover:underline hover:text-hof transition">Antalya</Link></li>
              <li><Link href="/ilanlar?city=İzmir" className="hover:underline hover:text-hof transition">İzmir</Link></li>
              <li><Link href="/ilanlar?city=Muğla" className="hover:underline hover:text-hof transition">Bodrum & Fethiye</Link></li>
              <li><Link href="/ilanlar?city=Nevşehir" className="hover:underline hover:text-hof transition">Kapadokya</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-hof mb-4">Destek</h4>
            <ul className="space-y-3 text-sm text-foggy">
              <li><span>Yardım Merkezi</span></li>
              <li><span>İletişim</span></li>
              <li><span>Gizlilik Politikası</span></li>
              <li><span>Kullanım Koşulları</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-foggy">© 2026 TürkEvim. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4 text-sm text-foggy">
            <span>Türkçe (TR)</span>
            <span>₺ TRY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
