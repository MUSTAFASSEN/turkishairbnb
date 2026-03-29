'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const cities = ['İstanbul', 'Antalya', 'İzmir', 'Muğla', 'Nevşehir', 'Trabzon', 'Ankara', 'Bursa'];

export default function SearchBar({ variant = 'hero' }: { variant?: 'hero' | 'compact' }) {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    router.push(`/ilanlar?${params.toString()}`);
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-hof mb-1">Konum</label>
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hof focus:border-transparent bg-white"
          >
            <option value="">Tüm Şehirler</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold text-hof mb-1">Giriş</label>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={e => setCheckIn(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hof focus:border-transparent"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold text-hof mb-1">Çıkış</label>
          <input
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={e => setCheckOut(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hof focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-gold-500 text-white px-6 py-2.5 rounded-lg hover:bg-gold-500/90 transition text-sm font-semibold"
        >
          Ara
        </button>
      </div>
    );
  }

  // Hero - Airbnb pill-shaped search
  return (
    <div className="bg-white rounded-pill shadow-lg border border-gray-200 p-2 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row items-stretch">
        {/* Where */}
        <div className="flex-1 px-4 py-2 md:border-r border-gray-200 hover:bg-gray-50 rounded-pill transition cursor-pointer">
          <label className="block text-xs font-bold text-hof">Nereye</label>
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            className="w-full text-sm text-foggy bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="">Destinasyon arayın</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Check-in */}
        <div className="flex-1 px-4 py-2 md:border-r border-gray-200 hover:bg-gray-50 rounded-pill transition cursor-pointer">
          <label className="block text-xs font-bold text-hof">Giriş</label>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={e => setCheckIn(e.target.value)}
            placeholder="Tarih ekleyin"
            className="w-full text-sm text-foggy bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none"
          />
        </div>

        {/* Check-out */}
        <div className="flex-1 px-4 py-2 hover:bg-gray-50 rounded-pill transition cursor-pointer">
          <label className="block text-xs font-bold text-hof">Çıkış</label>
          <input
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={e => setCheckOut(e.target.value)}
            placeholder="Tarih ekleyin"
            className="w-full text-sm text-foggy bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none"
          />
        </div>

        {/* Search button */}
        <div className="flex items-center px-2">
          <button
            onClick={handleSearch}
            className="bg-gold-500 hover:bg-gold-600 text-white rounded-full p-3 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden md:inline text-sm font-semibold pr-1">Ara</span>
          </button>
        </div>
      </div>
    </div>
  );
}
