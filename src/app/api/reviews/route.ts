import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await db.init();
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');

  if (!listingId) return NextResponse.json({ error: 'listingId gerekli' }, { status: 400 });

  const reviews = db.reviews.filter(r => r.listingId === listingId);
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const { listingId, rating, comment } = await request.json();

  if (!listingId || !rating || !comment) {
    return NextResponse.json({ error: 'Tüm alanlar gerekli' }, { status: 400 });
  }

  const review = {
    id: uuid(),
    listingId,
    guestId: user.id,
    guestName: user.name,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString(),
  };

  db.reviews.push(review);

  // Update listing average rating
  const listing = db.listings.find(l => l.id === listingId);
  if (listing) {
    const allReviews = db.reviews.filter(r => r.listingId === listingId);
    listing.totalReviews = allReviews.length;
    listing.averageRating = Math.round(
      (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10
    ) / 10;
  }

  return NextResponse.json({ review }, { status: 201 });
}
