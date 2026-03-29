'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/ui/SearchBar';
import ListingCard from '@/components/ui/ListingCard';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Listing } from '@/types';

function IlanlarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const city = searchParams.get('city') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);

      const data = await api.getListings(params.toString()) as { listings: Listing[] };
      setListings(data.listings || []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [city, minPrice, maxPrice]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    setMinPriceInput(minPrice);
    setMaxPriceInput(maxPrice);
  }, [minPrice, maxPrice]);

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPriceInput) params.set('minPrice', minPriceInput);
    else params.delete('minPrice');
    if (maxPriceInput) params.set('maxPrice', maxPriceInput);
    else params.delete('maxPrice');
    router.push(`/ilanlar?${params.toString()}`);
  };

  const clearFilters = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    router.push('/ilanlar');
  };

  const hasActiveFilters = city || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-white">
      {/* Search bar */}
      <div className="border-b border-gray-200">
        <div className="max-w-[1760px] mx-auto px-6 md:px-10 py-4">
          <SearchBar variant="compact" />
        </div>
      </div>

      <div className="max-w-[1760px] mx-auto px-6 md:px-10 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white rounded-card border border-gray-200 p-5 sticky top-24">
              <h2 className="font-semibold text-hof text-lg mb-4">Filtreler</h2>
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-hof mb-3">Fiyat aralığı</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-foggy mb-1">Min (₺)</label>
                    <input
                      type="number"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      placeholder="0"
                      min={0}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hof focus:border-transparent"
                    />
                  </div>
                  <span className="text-gray-400 mt-5">—</span>
                  <div className="flex-1">
                    <label className="block text-xs text-foggy mb-1">Max (₺)</label>
                    <input
                      type="number"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      placeholder="10000"
                      min={0}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hof focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={applyPriceFilter}
                  className="w-full mt-3 bg-hof text-white py-2.5 rounded-lg hover:bg-hof/90 transition text-sm font-semibold"
                >
                  Uygula
                </button>
              </div>
              {hasActiveFilters && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-hof">Aktif filtreler</span>
                    <button onClick={clearFilters} className="text-xs text-hof underline hover:text-gold-500 font-semibold">
                      Temizle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {city && (
                      <span className="inline-flex items-center bg-gray-100 text-hof text-xs font-semibold px-3 py-1.5 rounded-pill">
                        {city}
                      </span>
                    )}
                    {(minPrice || maxPrice) && (
                      <span className="inline-flex items-center bg-gray-100 text-hof text-xs font-semibold px-3 py-1.5 rounded-pill">
                        {minPrice ? formatCurrency(Number(minPrice)) : '₺0'} - {maxPrice ? formatCurrency(Number(maxPrice)) : '∞'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-hof">
                {city ? `${city} ilanları` : 'Tüm ilanlar'}
              </h1>
              {!loading && (
                <span className="text-sm text-foggy">{listings.length} ilan bulundu</span>
              )}
            </div>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[20/19] bg-gray-200 rounded-card" />
                    <div className="mt-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && listings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}

            {!loading && listings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h2 className="text-xl font-semibold text-hof mb-2">Sonuç bulunamadı</h2>
                <p className="text-foggy mb-6 max-w-md">
                  Arama kriterlerinize uygun ilan bulunamadı. Filtreleri değiştirmeyi deneyin.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-hof text-white px-6 py-2.5 rounded-lg hover:bg-hof/90 transition font-semibold"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function IlanlarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" />
      </div>
    }>
      <IlanlarContent />
    </Suspense>
  );
}
