'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, calculateNights } from '@/lib/utils';
import { Listing, Review } from '@/types';
import type { PublicUser } from '@/types';
import BookingCalendar from '@/components/ui/BookingCalendar';

const amenityIcons: Record<string, string> = {
  'Wi-Fi': '📶',
  'Klima': '❄️',
  'Mutfak': '🍳',
  'Otopark': '🅿️',
  'Havuz': '🏊',
  'TV': '📺',
  'Çamaşır Makinesi': '👕',
  'Isıtma': '🔥',
  'Balkon': '🌅',
  'Bahçe': '🌿',
  'Deniz Manzarası': '🌊',
  'Jakuzi': '🛁',
  'Barbekü': '🥩',
  'Kahvaltı': '🥐',
  'Evcil Hayvan': '🐾',
};

function getAmenityIcon(amenity: string): string {
  return amenityIcons[amenity] || '✓';
}

export default function IlanDetayPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();
  const id = params.id as string;

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const [listing, setListing] = useState<Listing | null>(null);
  const [host, setHost] = useState<PublicUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookedDates, setBookedDates] = useState<{ checkIn: string; checkOut: string }[]>([]);

  // Image gallery state
  const [selectedImage, setSelectedImage] = useState(0);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      setLoading(true);
      try {
        const data = await api.getListing(id) as {
          listing: Listing;
          host: PublicUser;
          reviews: Review[];
        };
        setListing(data.listing);
        setHost(data.host);
        setReviews(data.reviews || []);
      } catch {
        setListing(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchListing();
  }, [id]);

  // Fetch booked dates for this listing
  useEffect(() => {
    async function fetchBookedDates() {
      try {
        const data = await api.getBookedDates(id);
        setBookedDates(data.bookedDates || []);
      } catch {
        setBookedDates([]);
      }
    }
    if (id) fetchBookedDates();
  }, [id]);

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;
  const subtotal = listing ? nights * listing.pricePerNight : 0;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const today = new Date().toISOString().split('T')[0];

  // Check if selected dates conflict with existing bookings
  const hasDateConflict = !!(checkIn && checkOut && bookedDates.some(
    b => checkIn < b.checkOut && checkOut > b.checkIn
  ));

  const handleBooking = async () => {
    if (!user) {
      router.push('/giris');
      return;
    }

    if (!checkIn || !checkOut) {
      setBookingError('Lütfen giriş ve çıkış tarihlerini seçin.');
      return;
    }

    if (nights <= 0) {
      setBookingError('Çıkış tarihi giriş tarihinden sonra olmalıdır.');
      return;
    }

    if (hasDateConflict) {
      setBookingError('Seçilen tarihler başka bir rezervasyonla çakışıyor.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      await api.createBooking({
        listingId: id,
        checkIn,
        checkOut,
        totalPrice: total,
      });
      router.push(
        `/rezervasyon?listingId=${id}&checkIn=${checkIn}&checkOut=${checkOut}&total=${total}&nights=${nights}&pricePerNight=${listing?.pricePerNight}&serviceFee=${serviceFee}&title=${encodeURIComponent(listing?.title || '')}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Rezervasyon oluşturulurken bir hata oluştu.';
      setBookingError(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      router.push('/giris');
      return;
    }

    setReviewLoading(true);
    try {
      const newReview = await api.createReview({
        listingId: id,
        rating: reviewRating,
        comment: reviewComment,
      }) as { review: Review };
      setReviews((prev) => [newReview.review || newReview, ...prev]);
      setReviewComment('');
      setReviewRating(5);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch {
      // silently fail
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="aspect-[16/9] bg-gray-200 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
              </div>
              <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">İlan bulunamadı</h1>
          <p className="text-gray-500 mb-4">Bu ilan mevcut değil veya kaldırılmış olabilir.</p>
          <button
            onClick={() => router.push('/ilanlar')}
            className="bg-gold-500 text-white px-6 py-2.5 rounded-lg hover:bg-gold-600 transition font-medium"
          >
            İlanlara Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {/* Title */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{listing.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold">{listing.averageRating > 0 ? listing.averageRating.toFixed(1) : 'Yeni'}</span>
            </span>
            {listing.totalReviews > 0 && (
              <span className="text-gray-400">({listing.totalReviews} değerlendirme)</span>
            )}
            <span className="text-gray-400">·</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {listing.city}
            </span>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="rounded-xl overflow-hidden">
            <div className="aspect-[16/9] md:aspect-[2/1] relative">
              <img
                src={listing.images[selectedImage] || '/placeholder.jpg'}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {listing.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === idx ? 'border-gold-500' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${listing.title} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Info */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {listing.city} konumunda konaklama yeri
                </h2>
                <p className="text-gray-600 mt-1">
                  {listing.maxGuests} misafir · {listing.bedrooms} yatak odası · {listing.bathrooms} banyo
                </p>
              </div>
            </div>

            {/* Host Info Card */}
            {host && (
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 text-xl font-bold shrink-0">
                  {host.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Ev Sahibi: {host.name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(host.createdAt)} tarihinden beri üye
                  </p>
                </div>
                {user && user.id !== host.id && (
                  <button
                    onClick={async () => {
                      try {
                        const data = await api.createConversation({ participantId: host.id });
                        router.push(`/mesajlar/${data.conversation.id}`);
                      } catch {
                        router.push('/mesajlar');
                      }
                    }}
                    className="shrink-0 flex items-center gap-2 bg-gold-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-gold-600 transition font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    İletişime Geç
                  </button>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Konaklama Hakkında</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Amenities */}
            {listing.amenities.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sunulan Olanaklar</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listing.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
                    >
                      <span className="text-xl">{getAmenityIcon(amenity)}</span>
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Değerlendirmeler
                {listing.totalReviews > 0 && (
                  <span className="text-gray-500 font-normal ml-2">({listing.totalReviews})</span>
                )}
              </h2>

              {/* Leave Review Form */}
              {user && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Değerlendirme Yaz</h3>
                  {reviewSuccess && (
                    <div className="mb-3 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                      Değerlendirmeniz eklendi!
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">Puan</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1"
                        >
                          <svg
                            className={`w-7 h-7 ${
                              star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">Yorumunuz</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="Deneyiminizi paylaşın..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    onClick={handleReviewSubmit}
                    disabled={!reviewComment.trim() || reviewLoading}
                    className="bg-gold-500 text-white px-5 py-2 rounded-lg hover:bg-gold-600 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reviewLoading ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
                  </button>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                            {review.guestName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{review.guestName}</p>
                            <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Henüz değerlendirme yok. İlk değerlendirmeyi siz yapın!</p>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(listing.pricePerNight)}</span>
                <span className="text-gray-500">/ gece</span>
              </div>

              {/* Calendar Date Picker */}
              <div className="mb-4">
                <BookingCalendar
                  bookedDates={bookedDates}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onSelectCheckIn={(d) => { setCheckIn(d); setBookingError(''); }}
                  onSelectCheckOut={(d) => { setCheckOut(d); setBookingError(''); }}
                />
              </div>

              {/* Price Calculation */}
              {nights > 0 && (
                <div className="border-t border-gray-100 pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {formatCurrency(listing.pricePerNight)} x {nights} gece
                    </span>
                    <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Hizmet bedeli (%5)</span>
                    <span className="text-gray-900">{formatCurrency(serviceFee)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-100">
                    <span>Toplam</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              {/* Conflict Warning */}
              {hasDateConflict && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Seçilen tarihler başka bir rezervasyonla çakışıyor
                </div>
              )}

              {/* Error Message */}
              {bookingError && !hasDateConflict && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {bookingError}
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBooking}
                disabled={bookingLoading || hasDateConflict}
                className="w-full bg-gold-500 text-white py-3 rounded-lg hover:bg-gold-600 transition font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    İşleniyor...
                  </span>
                ) : (
                  'Rezervasyon Yap'
                )}
              </button>

              {!user && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  Rezervasyon yapmak için{' '}
                  <button onClick={() => router.push('/giris')} className="text-gold-500 hover:underline font-medium">
                    giriş yapın
                  </button>
                </p>
              )}

              {/* Booked Dates Summary */}
              {bookedDates.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Dolu tarihler</h4>
                  <div className="space-y-1">
                    {bookedDates.map((bd, i) => (
                      <p key={i} className="text-xs text-red-600">
                        {formatDate(bd.checkIn)} — {formatDate(bd.checkOut)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
