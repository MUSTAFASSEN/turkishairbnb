'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Listing } from '@/types';
import ListingCard from '@/components/ui/ListingCard';

export default function FavorilerimPage() {
  const { user, isLoading, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/giris');
      return;
    }
    const fetchFavorites = async () => {
      try {
        const data = await api.getFavorites();
        setListings(data.listings || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [user, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <h1 className="text-2xl font-semibold text-hof mb-6">Favorilerim</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[20/19] bg-gray-200 rounded-card" />
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
      <h1 className="text-2xl font-semibold text-hof mb-6">Favorilerim</h1>

      {listings.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 00-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 009 4a6.98 6.98 0 00-7 7c0 7 7 12.27 14 17z"/>
          </svg>
          <h2 className="text-xl font-semibold text-hof mb-2">Henuz favoriniz yok</h2>
          <p className="text-foggy mb-6">Begendginiz ilanlarin kalp ikonuna tiklayarak favorilerinize ekleyin.</p>
          <a href="/ilanlar" className="inline-block bg-gold-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gold-600 transition">
            Ilanlari Kesfet
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
