'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const sidebarLinks = [
  { href: '/ev-sahibi/panel', label: 'Panel', icon: '📊' },
  { href: '/ev-sahibi/ilanlar/yeni', label: 'Yeni İlan', icon: '➕' },
  { href: '/ev-sahibi/rezervasyonlar', label: 'Rezervasyonlar', icon: '📅' },
  { href: '/ev-sahibi/kazanclar', label: 'Kazançlar', icon: '💰' },
  { href: '/ev-sahibi/abonelik', label: 'Abonelik', icon: '⭐' },
];

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Standart',
    price: 0,
    period: 'ay',
    description: 'Temel ev sahipliği özellikleri',
    features: [
      { text: 'Aylık 3 ilan yayınlama hakkı', included: true },
      { text: 'Standart arama sonuçlarında görünme', included: true },
      { text: 'Temel istatistikler', included: true },
      { text: 'E-posta desteği', included: true },
      { text: 'Öne çıkan ilanlar', included: false },
      { text: 'Sınırsız ilan yayınlama', included: false },
      { text: 'Öncelikli müşteri desteği', included: false },
      { text: 'Detaylı performans raporları', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 499.99,
    period: 'ay',
    description: 'Tüm özellikler, sınırsız ilan, öne çıkarma hakkı',
    popular: true,
    features: [
      { text: 'Sınırsız ilan yayınlama', included: true },
      { text: 'Aylık 5 öne çıkarma hakkı', included: true },
      { text: 'Yüksek görünürlük ve öncelik', included: true },
      { text: 'Detaylı istatistikler ve analizler', included: true },
      { text: 'Öncelikli müşteri desteği', included: true },
      { text: '7/24 telefon desteği', included: true },
      { text: 'Özel performans raporları', included: true },
      { text: 'Tüm eklentilere erişim', included: true },
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, loadFromStorage, setAuth, logout } = useAuthStore();

  // Payment modal state
  const [payingPlan, setPayingPlan] = useState<Plan | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [formError, setFormError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'host') router.push('/giris');
  }, [user, authLoading, router]);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  const openPayment = (plan: Plan) => {
    setPayingPlan(plan);
    setCardName('');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setFormError('');
    setPaymentSuccess(false);
  };

  const handleDowngrade = async () => {
    if (!user) return;
    if (!confirm('Standart plana geçmek istediğinizden emin misiniz?')) return;
    try {
      const data = await api.purchaseSubscription('basic');
      const token = localStorage.getItem('token') || '';
      setAuth({ ...user, subscriptionPlan: 'basic' }, token);
      void data;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Hata oluştu');
    }
  };

  const handlePayment = async () => {
    if (!payingPlan || !user) return;

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
    await new Promise((r) => setTimeout(r, 2000));

    try {
      await api.purchaseSubscription(payingPlan.id);
      const token = localStorage.getItem('token') || '';
      setAuth({ ...user, subscriptionPlan: payingPlan.id as 'basic' | 'premium' }, token);
      setPaymentSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ödeme işlenirken hata oluştu.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" />
      </div>
    );
  }
  if (!user || user.role !== 'host') return null;

  const currentPlan = user.subscriptionPlan || 'basic';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Nav */}
        <div className="lg:hidden overflow-x-auto mb-6">
          <div className="flex gap-2 min-w-max">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  link.href === '/ev-sahibi/abonelik'
                    ? 'bg-gold-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 bg-white shadow-lg rounded-xl p-4 h-fit sticky top-24 hidden lg:block">
            <h2 className="text-lg font-bold text-gray-800 mb-4 px-3">Ev Sahibi Paneli</h2>
            <nav className="space-y-1">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    link.href === '/ev-sahibi/abonelik'
                      ? 'bg-gold-50 text-gold-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış Yap
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Abonelik Planları</h1>
              <p className="text-gray-500 mt-1">Ev sahipliği deneyiminizi yükseltmek için bir plan seçin</p>
            </div>

            {/* Current Plan */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{currentPlan === 'premium' ? '👑' : '🏷️'}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mevcut Planınız</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentPlan === 'premium' ? 'Premium Plan' : 'Standart Plan'}
                  </p>
                  {user.subscriptionExpiry && currentPlan === 'premium' && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Yenileme: {new Date(user.subscriptionExpiry).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Aktif
                </span>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {plans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
                      plan.popular ? 'border-gold-500' : 'border-gray-100'
                    }`}
                  >
                    {plan.popular && (
                      <div className="bg-gold-500 text-white text-xs font-bold text-center py-1.5 uppercase tracking-wider">
                        En Popüler
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      <div className="mt-4 mb-6">
                        {plan.price === 0 ? (
                          <span className="text-4xl font-bold text-gray-900">Ücretsiz</span>
                        ) : (
                          <>
                            <span className="text-4xl font-bold text-gray-900">
                              {plan.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-lg text-gray-500">₺</span>
                            <span className="text-gray-400">/{plan.period}</span>
                          </>
                        )}
                      </div>

                      {isCurrentPlan ? (
                        <button
                          disabled
                          className="w-full py-3 rounded-lg font-semibold text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                        >
                          Mevcut Plan
                        </button>
                      ) : plan.id === 'basic' ? (
                        <button
                          onClick={handleDowngrade}
                          className="w-full py-3 rounded-lg font-semibold text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                        >
                          Standart'a Geç
                        </button>
                      ) : (
                        <button
                          onClick={() => openPayment(plan)}
                          className="w-full py-3 rounded-lg font-semibold text-sm bg-gold-500 text-white hover:bg-gold-600 transition-colors"
                        >
                          Premium'a Yükselt
                        </button>
                      )}

                      <div className="mt-6 space-y-3">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3">
                            {feature.included ? (
                              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Plan Karşılaştırması</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Özellik</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Standart (Ücretsiz)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gold-600">Premium (499,99₺/ay)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { feature: 'Aylık İlan Limiti', basic: '3 ilan', premium: 'Sınırsız' },
                      { feature: 'Öne Çıkarma Hakkı', basic: false, premium: 'Aylık 5 hak' },
                      { feature: 'Arama Görünürlüğü', basic: 'Standart', premium: 'Yüksek Öncelik' },
                      { feature: 'İstatistikler', basic: 'Temel', premium: 'Detaylı Analiz' },
                      { feature: 'Müşteri Desteği', basic: 'E-posta', premium: '7/24 Telefon' },
                      { feature: 'Performans Raporları', basic: false, premium: true },
                      { feature: 'Tüm Eklentiler', basic: false, premium: true },
                      { feature: 'Özel Rozetler', basic: false, premium: true },
                    ].map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-700 font-medium">{row.feature}</td>
                        <td className="py-3 px-4 text-center">
                          {typeof row.basic === 'boolean' ? (
                            row.basic ? <span className="text-green-500">✓</span> : <span className="text-gray-300">✕</span>
                          ) : (
                            <span className="text-sm text-gray-600">{row.basic}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof row.premium === 'boolean' ? (
                            row.premium ? <span className="text-green-500 font-bold">✓</span> : <span className="text-gray-300">✕</span>
                          ) : (
                            <span className="text-sm font-medium text-gold-600">{row.premium}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Payment Modal */}
      {payingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !paymentLoading && setPayingPlan(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Success State */}
            {paymentSuccess ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarılı!</h2>
                <p className="text-gray-500 mb-2">
                  <span className="font-semibold text-gold-600">Premium Plan</span>'a yükseltildiniz.
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  {payingPlan.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}₺/ay — 1 aylık üyeliğiniz başladı.
                </p>
                <button
                  onClick={() => setPayingPlan(null)}
                  className="w-full py-3 bg-gold-500 text-white rounded-xl font-semibold hover:bg-gold-600 transition-colors"
                >
                  Panele Dön
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-gold-500 to-amber-500 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Premium Plan</h2>
                      <p className="text-white/80 text-sm mt-0.5">Aylık abonelik</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">499,99₺</p>
                      <p className="text-white/70 text-xs">/ay</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {['Sınırsız ilan', '5 öne çıkarma', 'Öncelikli destek'].map((f) => (
                      <span key={f} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">✓ {f}</span>
                    ))}
                  </div>
                </div>

                {/* Form */}
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Kart Bilgileri
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Kart Üzerindeki İsim</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Ad Soyad"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Kart Numarası</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent pr-12"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                          <div className="w-6 h-4 bg-red-500 rounded-sm opacity-80" />
                          <div className="w-6 h-4 bg-yellow-400 rounded-sm opacity-80 -ml-3" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Son Kullanma</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="AA/YY"
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                        <input
                          type="password"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="•••"
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {formError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                      {formError}
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Ödeme bilgileriniz 256-bit SSL ile şifrelenerek güvende tutulur.
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => setPayingPlan(null)}
                      disabled={paymentLoading}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={paymentLoading}
                      className="flex-1 py-3 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          İşleniyor...
                        </>
                      ) : (
                        '499,99₺ Öde'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
