import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { initDb, favoritesCol, listingsCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Favorite } from '@/types';

export async function GET(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const idsOnly = searchParams.get('idsOnly');

  const favorites = await favoritesCol();
  const userFavorites = await favorites.find({ userId: user.id }, { projection: { _id: 0 } }).toArray();

  if (idsOnly === 'true') {
    return NextResponse.json({ favoriteIds: userFavorites.map(f => f.listingId) });
  }

  const listingIds = userFavorites.map(f => f.listingId);
  if (listingIds.length === 0) {
    return NextResponse.json({ favorites: [], listings: [] });
  }

  const listings = await listingsCol();
  const favoriteListings = await listings.find(
    { id: { $in: listingIds } },
    { projection: { _id: 0 } }
  ).toArray();

  return NextResponse.json({ favorites: userFavorites, listings: favoriteListings });
}

export async function POST(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });

  const { listingId } = await request.json();
  if (!listingId) return NextResponse.json({ error: 'İlan ID gerekli' }, { status: 400 });

  const favorites = await favoritesCol();
  const existing = await favorites.findOne({ userId: user.id, listingId });
  if (existing) {
    return NextResponse.json({ error: 'Zaten favorilerde' }, { status: 409 });
  }

  const newFavorite: Favorite = {
    id: uuid(),
    userId: user.id,
    listingId,
    createdAt: new Date().toISOString(),
  };

  await favorites.insertOne(newFavorite as Favorite);
  return NextResponse.json({ favorite: newFavorite }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ error: 'İlan ID gerekli' }, { status: 400 });

  const favorites = await favoritesCol();
  await favorites.deleteOne({ userId: user.id, listingId });
  return NextResponse.json({ success: true });
}
