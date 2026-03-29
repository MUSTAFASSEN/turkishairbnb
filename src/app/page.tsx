'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ListingCard from '@/components/ui/ListingCard';
import { Listing } from '@/types';

const categories = [
  { icon: '🏖️', label: 'Sahil kenarı' },
  { icon: '🏔️', label: 'Dağ evi' },
  { icon: '🏡', label: 'Kır evi' },
  { icon: '🏰', label: 'Tarihi' },
  { icon: '🌊', label: 'Göl kenarı' },
  { icon: '🏕️', label: 'Kamp alanı' },
  { icon: '🌴', label: 'Tropikal' },
  { icon: '⛷️', label: 'Kayak' },
  { icon: '🏠', label: 'Tiny house' },
  { icon: '🌾', label: 'Çiftlik' },
  { icon: '🏙️', label: 'Şehir merkezi' },
  { icon: '🧖', label: 'Termal' },
];

const popularCities = [
  {
    name: 'İstanbul',
    slug: 'istanbul',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&h=400&fit=crop',
    description: 'Tarihi yarımada ve Boğaz manzarası',
  },
  {
    name: 'Antalya',
    slug: 'antalya',
    image: 'https://images.unsplash.com/photo-1593352216840-1aee13f45818?w=600&h=400&fit=crop',
    description: 'Turkuaz sahiller ve antik kentler',
  },
  {
    name: 'Kapadokya',
    slug: 'kapadokya',
    image: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&h=400&fit=crop',
    description: 'Peri bacaları ve balon turları',
  },
  {
    name: 'Bodrum',
    slug: 'bodrum',
    image: 'https://images.unsplash.com/photo-1614587185092-af24ec455e67?w=600&h=400&fit=crop',
    description: 'Ege\'nin incisi',
  },
];

export default function Home() {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        const params = new URLSearchParams();
        if (activeCategory) params.set('category', activeCategory);
        const url = params.toString() ? `/api/listings?${params}` : '/api/listings';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const listings: Listing[] = data.listings || data || [];
          const active = listings.filter((l: Listing) => l.isActive);
          setAllListings(active);
          setFeaturedListings(active.filter((l: Listing) => l.isFeatured).slice(0, 8));
        }
      } catch (error) {
        console.error('İlanlar yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchListings();
  }, [activeCategory]);

  return (
    <div className="flex flex-col">
      {/* Category Bar */}
      <div className="sticky top-20 z-40 bg-white border-b border-gray-200">
        <div className="max-w-[1760px] mx-auto px-6 md:px-10">
          <div className="flex items-center gap-8 overflow-x-auto hide-scrollbar py-4">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
                className={`flex flex-col items-center gap-1.5 min-w-fit pb-2 border-b-2 transition-colors ${
                  activeCategory === cat.label
                    ? 'border-hof text-hof'
                    : 'border-transparent text-foggy hover:text-hof hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-semibold whitespace-nowrap">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <section className="py-8 bg-white">
        <div className="max-w-[1760px] mx-auto px-6 md:px-10">
          {activeCategory && (
            <h2 className="text-2xl font-bold text-hof mb-6">{activeCategory}</h2>
          )}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[20/19] bg-gray-200 rounded-card" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (activeCategory ? allListings : featuredListings).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(activeCategory ? allListings : featuredListings).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-foggy text-lg">
                {activeCategory ? `"${activeCategory}" kategorisinde ilan bulunamadı.` : 'Henüz ilan bulunmuyor.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-12 bg-white">
        <div className="max-w-[1760px] mx-auto px-6 md:px-10">
          <h2 className="text-2xl font-bold text-hof mb-6">Popüler destinasyonlar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/ilanlar?city=${city.slug}`}
                className="group flex items-center gap-4 p-4 rounded-card border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 rounded-card overflow-hidden shrink-0">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-hof">{city.name}</h3>
                  <p className="text-sm text-foggy">{city.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Host CTA */}
      <section className="bg-hof text-white">
        <div className="max-w-[1760px] mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Evinizi açın,<br/>kazanmaya başlayın
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              TürkEvim&apos;de sadece %5 komisyon ile evinizi paylaşın.
              Diğer platformlara kıyasla %10 daha fazla kazanın.
            </p>
            <Link
              href="/ev-sahibi"
              className="inline-flex items-center bg-gold-500 hover:bg-gold-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition"
            >
              Ev Sahibi Ol
            </Link>
          </div>
        </div>
      </section>

      {/* All Listings (only when no category filter) */}
      {!activeCategory && allListings.length > featuredListings.length && (
        <section className="py-12 bg-white">
          <div className="max-w-[1760px] mx-auto px-6 md:px-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-hof">Tüm ilanlar</h2>
              <Link href="/ilanlar" className="text-sm font-semibold text-hof underline hover:text-gold-500 transition">
                Tümünü göster
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allListings.slice(0, 12).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
