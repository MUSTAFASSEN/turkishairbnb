import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await db.init();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const city = searchParams.get('city');
  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const hostId = searchParams.get('hostId');

  if (id) {
    const listing = db.listings.find(l => l.id === id);
    if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
    const host = db.users.find(u => u.id === listing.hostId);
    const reviews = db.reviews.filter(r => r.listingId === id);
    return NextResponse.json({
      listing,
      host: host ? { id: host.id, name: host.name, avatar: host.avatar, createdAt: host.createdAt } : null,
      reviews,
    });
  }

  let results = hostId
    ? db.listings.filter(l => l.hostId === hostId)
    : db.listings.filter(l => l.isActive);
  if (city) results = results.filter(l => l.city.toLowerCase().includes(city.toLowerCase()));
  if (category) results = results.filter(l => l.category === category);
  if (minPrice) results = results.filter(l => l.pricePerNight >= Number(minPrice));
  if (maxPrice) results = results.filter(l => l.pricePerNight <= Number(maxPrice));

  // Sort: featured first, then by creation date
  results.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json({ listings: results });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== 'host' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const body = await request.json();
  const hostUser = db.users.find(u => u.id === user.id);
  const isPremium = hostUser?.subscriptionPlan === 'premium';

  // Basic (Standart) users: max 3 listings per month
  if (!isPremium && user.role !== 'admin') {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const hostListingsThisMonth = db.listings.filter(
      l => l.hostId === user.id && l.createdAt >= monthStart
    );
    if (hostListingsThisMonth.length >= 3) {
      return NextResponse.json(
        { error: 'Standart planda aylik 3 ilan limitine ulastiniz. Daha fazla ilan icin Premium plana yukseltın.' },
        { status: 403 }
      );
    }
  }

  // Premium users: max 5 featured listings per month
  let canFeature = false;
  if (isPremium) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const featuredThisMonth = db.listings.filter(
      l => l.hostId === user.id && l.isFeatured && l.createdAt >= monthStart
    );
    canFeature = featuredThisMonth.length < 5;
  }

  const newListing = {
    id: uuid(),
    hostId: user.id,
    title: body.title,
    description: body.description,
    category: body.category || 'Şehir merkezi',
    pricePerNight: Number(body.pricePerNight),
    city: body.city,
    address: body.address || body.city,
    latitude: body.latitude || 39.9334,
    longitude: body.longitude || 32.8597,
    images: body.images || ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    amenities: body.amenities || [],
    maxGuests: body.maxGuests || 2,
    bedrooms: body.bedrooms || 1,
    bathrooms: body.bathrooms || 1,
    isFeatured: canFeature,
    isActive: true,
    averageRating: 0,
    totalReviews: 0,
    createdAt: new Date().toISOString(),
  };

  db.listings.push(newListing);
  return NextResponse.json({ listing: newListing }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const body = await request.json();
  const listing = db.listings.find(l => l.id === body.id);
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
  if (listing.hostId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Bu ilanı düzenleme yetkiniz yok' }, { status: 403 });
  }

  Object.assign(listing, {
    ...(body.title && { title: body.title }),
    ...(body.description && { description: body.description }),
    ...(body.pricePerNight && { pricePerNight: Number(body.pricePerNight) }),
    ...(body.city && { city: body.city }),
    ...(body.address && { address: body.address }),
    ...(body.images && { images: body.images }),
    ...(body.amenities && { amenities: body.amenities }),
    ...(body.maxGuests && { maxGuests: body.maxGuests }),
    ...(body.bedrooms && { bedrooms: body.bedrooms }),
    ...(body.bathrooms && { bathrooms: body.bathrooms }),
    ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
    ...(body.category && { category: body.category }),
  });

  return NextResponse.json({ listing });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const index = db.listings.findIndex(l => l.id === id);
  if (index === -1) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });

  const listing = db.listings[index];
  if (listing.hostId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Bu ilanı silme yetkiniz yok' }, { status: 403 });
  }

  db.listings.splice(index, 1);
  return NextResponse.json({ success: true });
}
