'use client';

import Link from 'next/link';
import { Listing } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  listing: Listing;
}

export default function ListingCard({ listing }: Props) {
  return (
    <Link href={`/ilan/${listing.id}`} className="group">
      <div className="relative">
        {/* Image */}
        <div className="relative aspect-[20/19] overflow-hidden rounded-card">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Heart icon */}
          <button
            className="absolute top-3 right-3 z-10"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <svg className="w-7 h-7 drop-shadow-sm" viewBox="0 0 32 32" fill="rgba(0,0,0,0.5)" stroke="white" strokeWidth={2}>
              <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 00-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 009 4a6.98 6.98 0 00-7 7c0 7 7 12.27 14 17z"/>
            </svg>
          </button>
          {/* Featured badge */}
          {listing.isFeatured && (
            <span className="absolute top-3 left-3 bg-white text-hof text-xs font-semibold px-3 py-1.5 rounded-pill shadow-sm">
              Misafir favorisi
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mt-3">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-semibold text-hof text-[15px] line-clamp-1">{listing.city}, Türkiye</h3>
            {listing.averageRating > 0 && (
              <span className="flex items-center gap-1 text-sm shrink-0 text-hof">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {listing.averageRating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-foggy text-sm mt-0.5">{listing.title}</p>
          <p className="text-foggy text-sm">{listing.category} · {listing.bedrooms} yatak odası · {listing.maxGuests} misafir</p>
          <p className="mt-1.5">
            <span className="font-semibold text-hof">{formatCurrency(listing.pricePerNight)}</span>
            <span className="text-hof"> / gece</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
