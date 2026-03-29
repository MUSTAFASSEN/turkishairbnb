'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';

function RezervasyonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading, loadFromStorage } = useAuthStore();

  const listingId = searchParams.get('listingId') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const total = Number(searchParams.get('total') || 0);
  const nights = Number(searchParams.get('nights') || 0);
  const pricePerNight = Number(searchParams.get('pricePerNight') || 0);
  const serviceFee = Number(searchParams.get('serviceFee') || 0);
  const title = searchParams.get('title') || '';

  const subtotal = pricePerNight * nights;

  // Payment form state (visual only)
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (authLoading) return;
    if (!listingId || !checkIn || !checkOut) {
      router.push('/ilanlar');
      return;
    }
    if (!user) {
      router.push('/giris');
    }
  }, [listingId, checkIn, checkOut, router, authLoading, user]);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (!cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      setFormError('Lütfen tüm ödeme bilgilerini doldurun.');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 16) {
      setFormError('Geçerli bir kart numarası girin.');
      return;
    }

    if (cvv.length < 3) {
      setFormError('Geçerli bir CVV girin.');
      return;
    }

    setFormError('');
    setPaymentLoading(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setPaymentLoading(false);
    setPaymentSuccess(true);
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Rezervasyonunuz onaylandı!
          </h1>
          <p className="text-gray-600 mb-6">
            Ödemeniz başarıyla alındı. Rezervasyon detaylarınız e-posta adresinize gönderilecektir.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Rezervasyon Özeti</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Konaklama</span>
                <span className="text-gray-900 font-medium">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Giriş</span>
                <span className="text-gray-900">{checkIn ? formatDate(checkIn) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Çıkış</span>
                <span className="text-gray-900">{checkOut ? formatDate(checkOut) : '-'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
                <span>Toplam Ödeme</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/profil')}
              className="w-full bg-gold-500 text-white py-3 rounded-lg hover:bg-gold-600 transition font-semibold"
            >
              Rezervasyonlarım
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Rezervasyonu Tamamla</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Ödeme Bilgileri</h2>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                {/* Card Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kart Üzerindeki İsim
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kart Numarası
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent pr-12"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <svg className="w-8 h-5 text-gray-400" viewBox="0 0 48 32" fill="currentColor">
                        <rect width="48" height="32" rx="4" fill="#1A1F71" opacity="0.1" />
                        <text x="8" y="22" fontSize="14" fill="#1A1F71" fontWeight="bold">VISA</text>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Son Kullanma Tarihi
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="AA/YY"
                      maxLength={5}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="000"
                      maxLength={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-gray-50 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-gray-500">
                  Ödeme bilgileriniz 256-bit SSL ile korunmaktadır. Kart bilgileriniz güvenle işlenir.
                </p>
              </div>

              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full mt-6 bg-gold-500 text-white py-3.5 rounded-lg hover:bg-gold-600 transition font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ödeme İşleniyor...
                  </span>
                ) : (
                  `Ödeme Yap - ${formatCurrency(total)}`
                )}
              </button>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rezervasyon Detayları</h2>

              {/* Listing Info */}
              <div className="pb-4 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">{title}</h3>
              </div>

              {/* Dates */}
              <div className="py-4 border-b border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giriş</span>
                  <span className="text-gray-900 font-medium">{checkIn ? formatDate(checkIn) : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Çıkış</span>
                  <span className="text-gray-900 font-medium">{checkOut ? formatDate(checkOut) : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Konaklama Süresi</span>
                  <span className="text-gray-900 font-medium">{nights} gece</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="py-4 border-b border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(pricePerNight)} x {nights} gece
                  </span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hizmet bedeli (%5)</span>
                  <span className="text-gray-900">{formatCurrency(serviceFee)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Toplam</span>
                  <span className="text-gold-600">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Guest Info */}
              {user && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Misafir Bilgileri</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
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

export default function RezervasyonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" /></div>}>
      <RezervasyonContent />
    </Suspense>
  );
}
