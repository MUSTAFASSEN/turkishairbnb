import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { initDb, reviewsCol, listingsCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Review } from '@/types';

export async function GET(request: NextRequest) {
  await initDb();
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');

  if (!listingId) return NextResponse.json({ error: 'listingId gerekli' }, { status: 400 });

  const reviews = await reviewsCol();
  const result = await reviews.find({ listingId }, { projection: { _id: 0 } }).toArray();
  return NextResponse.json({ reviews: result });
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

  const reviews = await reviewsCol();
  await reviews.insertOne(review as Review);

  // Update listing average rating using aggregation
  const agg = await reviews.aggregate([
    { $match: { listingId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]).toArray();

  if (agg.length > 0) {
    const listings = await listingsCol();
    await listings.updateOne({ id: listingId }, {
      $set: {
        totalReviews: agg[0].count,
        averageRating: Math.round(agg[0].avg * 10) / 10,
      },
    });
  }

  return NextResponse.json({ review }, { status: 201 });
}
