import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { initDb, listingsCol, usersCol, reviewsCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Listing } from '@/types';

export async function GET(request: NextRequest) {
  await initDb();
  const listings = await listingsCol();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const city = searchParams.get('city');
  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const hostId = searchParams.get('hostId');

  if (id) {
    const listing = await listings.findOne({ id }, { projection: { _id: 0 } });
    if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
    const users = await usersCol();
    const host = await users.findOne({ id: listing.hostId }, { projection: { _id: 0 } });
    const reviews = await reviewsCol();
    const listingReviews = await reviews.find({ listingId: id }, { projection: { _id: 0 } }).toArray();
    return NextResponse.json({
      listing,
      host: host ? { id: host.id, name: host.name, avatar: host.avatar, createdAt: host.createdAt } : null,
      reviews: listingReviews,
    });
  }

  // Build filter
  const filter: Record<string, unknown> = {};
  if (hostId) {
    filter.hostId = hostId;
  } else {
    filter.isActive = true;
  }
  if (city) filter.city = { $regex: city, $options: 'i' };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.$gte = Number(minPrice);
    if (maxPrice) priceFilter.$lte = Number(maxPrice);
    filter.pricePerNight = priceFilter;
  }

  const results = await listings.find(filter, { projection: { _id: 0 } })
    .sort({ isFeatured: -1, createdAt: -1 })
    .toArray();

  return NextResponse.json({ listings: results });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || (user.role !== 'host' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const body = await request.json();
  const users = await usersCol();
  const hostUser = await users.findOne({ id: user.id });
  const isPremium = hostUser?.subscriptionPlan === 'premium';

  const listings = await listingsCol();

  // Basic (Standart) users: max 3 listings per month
  if (!isPremium && user.role !== 'admin') {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const count = await listings.countDocuments({
      hostId: user.id,
      createdAt: { $gte: monthStart },
    });
    if (count >= 3) {
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
    const featuredCount = await listings.countDocuments({
      hostId: user.id,
      isFeatured: true,
      createdAt: { $gte: monthStart },
    });
    canFeature = featuredCount < 5;
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

  await listings.insertOne(newListing as Listing);
  return NextResponse.json({ listing: newListing }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const body = await request.json();
  const listings = await listingsCol();
  const listing = await listings.findOne({ id: body.id }, { projection: { _id: 0 } });
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
  if (listing.hostId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Bu ilanı düzenleme yetkiniz yok' }, { status: 403 });
  }

  const updateFields: Record<string, unknown> = {};
  if (body.title) updateFields.title = body.title;
  if (body.description) updateFields.description = body.description;
  if (body.pricePerNight) updateFields.pricePerNight = Number(body.pricePerNight);
  if (body.city) updateFields.city = body.city;
  if (body.address) updateFields.address = body.address;
  if (body.images) updateFields.images = body.images;
  if (body.amenities) updateFields.amenities = body.amenities;
  if (body.maxGuests) updateFields.maxGuests = body.maxGuests;
  if (body.bedrooms) updateFields.bedrooms = body.bedrooms;
  if (body.bathrooms) updateFields.bathrooms = body.bathrooms;
  if (body.isActive !== undefined) updateFields.isActive = body.isActive;
  if (body.category) updateFields.category = body.category;

  const unsetFields: Record<string, ''> = {};

  if (body.isFeatured !== undefined) {
    if (body.isFeatured === true) {
      // Only premium hosts or admin can feature listings
      if (user.role !== 'admin') {
        const users = await usersCol();
        const hostUser = await users.findOne({ id: user.id });
        if (hostUser?.subscriptionPlan !== 'premium') {
          return NextResponse.json({ error: 'Bu özellik yalnızca Premium üyelere aittir.' }, { status: 403 });
        }
        // Max 5 simultaneously featured listings per premium host
        const featuredCount = await listings.countDocuments({
          hostId: user.id,
          isFeatured: true,
          id: { $ne: body.id },
        });
        if (featuredCount >= 5) {
          return NextResponse.json({ error: 'En fazla 5 ilanınızı öne çıkarabilirsiniz.' }, { status: 403 });
        }
      }
      const now = new Date();
      updateFields.isFeatured = true;
      updateFields.featuredStartAt = now.toISOString();
      updateFields.featuredEndAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      updateFields.isFeatured = false;
      unsetFields.featuredStartAt = '';
      unsetFields.featuredEndAt = '';
    }
  }

  const updateOp: Record<string, unknown> = { $set: updateFields };
  if (Object.keys(unsetFields).length > 0) updateOp.$unset = unsetFields;

  await listings.updateOne({ id: body.id }, updateOp);
  const updated = await listings.findOne({ id: body.id }, { projection: { _id: 0 } });
  return NextResponse.json({ listing: updated });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'İlan ID gerekli' }, { status: 400 });
  const listings = await listingsCol();
  const listing = await listings.findOne({ id }, { projection: { _id: 0 } });
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });

  if (listing.hostId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Bu ilanı silme yetkiniz yok' }, { status: 403 });
  }

  await listings.deleteOne({ id });
  return NextResponse.json({ success: true });
}
