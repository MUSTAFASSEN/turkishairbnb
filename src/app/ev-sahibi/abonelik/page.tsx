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
    description: 'Temel ev sahipligi ozellikleri',
    features: [
      { text: 'Aylik 3 ilan yayinlama hakki', included: true },
      { text: 'Standart arama sonuclarinda gorunme', included: true },
      { text: 'Temel istatistikler', included: true },
      { text: 'E-posta destegi', included: true },
      { text: 'One cikan ilanlar (aylik 5 hak)', included: false },
      { text: 'Sinirsiz ilan yayinlama', included: false },
      { text: 'Oncelikli musteri destegi', included: false },
      { text: 'Detayli performans raporlari', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 499.99,
    period: 'ay',
    description: 'Tum ozellikler, sinirsiz ilan, one cikarma hakki',
    popular: true,
    features: [
      { text: 'Sinirsiz ilan yayinlama', included: true },
      { text: 'Aylik 5 one cikarma hakki', included: true },
      { text: 'Yuksek gorunurluk ve oncelik', included: true },
      { text: 'Detayli istatistikler ve analizler', included: true },
      { text: 'Oncelikli musteri destegi', included: true },
      { text: '7/24 telefon destegi', included: true },
      { text: 'Ozel performans raporlari', included: true },
      { text: 'Tum eklentilere erisim', included: true },
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, loadFromStorage, setAuth, logout } = useAuthStore();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'host') {
      router.push('/giris');
    }
  }, [user, authLoading, router]);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;
    setSubscribing(planId);
    setError('');
    setSuccess('');

    try {
      await api.updateSubscription(user.id, planId);
      const updatedUser = { ...user, subscriptionPlan: planId as 'basic' | 'premium' };
      const token = localStorage.getItem('token') || '';
      setAuth(updatedUser, token);
      setSuccess(
        planId === 'basic'
          ? 'Standart plana gecis yapildi!'
          : 'Premium plana basariyla yukseltildiniz!'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abonelik islenirken bir hata olustu.');
    } finally {
      setSubscribing(null);
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

  const currentPlan = user.subscriptionPlan || 'none';

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
                Cikis Yap
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Abonelik Planlari</h1>
              <p className="text-gray-500 mt-1">Ev sahipligi deneyiminizi yukseltmek icin bir plan secin</p>
            </div>

            {/* Current Plan */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">
                    {currentPlan === 'premium' ? '👑' : currentPlan === 'basic' ? '🏷️' : '📋'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mevcut Planınız</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentPlan === 'premium'
                      ? 'Premium Plan'
                      : currentPlan === 'basic'
                      ? 'Standart Plan'
                      : 'Standart Plan'}
                  </p>
                </div>
                {currentPlan !== 'none' && (
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Aktif
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                {success}
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

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
                        En Populer
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      <div className="mt-4 mb-6">
                        {plan.price === 0 ? (
                          <span className="text-4xl font-bold text-gray-900">Ucretsiz</span>
                        ) : (
                          <>
                            <span className="text-4xl font-bold text-gray-900">{plan.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-lg text-gray-500">₺</span>
                            <span className="text-gray-400">/{plan.period}</span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isCurrentPlan || subscribing !== null}
                        className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors disabled:cursor-not-allowed ${
                          isCurrentPlan
                            ? 'bg-gray-100 text-gray-400'
                            : plan.popular
                            ? 'bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-50'
                            : 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50'
                        }`}
                      >
                        {subscribing === plan.id
                          ? 'İşleniyor...'
                          : isCurrentPlan
                          ? 'Mevcut Plan'
                          : currentPlan === 'premium' && plan.id === 'basic'
                          ? 'Plani Dusur'
                          : 'Plani Sec'}
                      </button>

                      <div className="mt-6 space-y-3">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3">
                            {feature.included ? (
                              <svg
                                className="w-5 h-5 text-green-500 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 text-gray-300 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                            <span
                              className={`text-sm ${
                                feature.included ? 'text-gray-700' : 'text-gray-400'
                              }`}
                            >
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

            {/* Benefits Comparison */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Plan Karsilastirmasi</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Ozellik
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Standart (Ucretsiz)
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gold-600">
                        Premium (499,99₺/ay)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { feature: 'Aylik İlan Limiti', basic: '3 ilan', premium: 'Sinirsiz' },
                      { feature: 'One Cikarma Hakki', basic: false, premium: 'Aylik 5 hak' },
                      { feature: 'Arama Gorunurlugu', basic: 'Standart', premium: 'Yuksek Oncelik' },
                      { feature: 'İstatistikler', basic: 'Temel', premium: 'Detayli Analiz' },
                      { feature: 'Musteri Destegi', basic: 'E-posta', premium: '7/24 Telefon' },
                      { feature: 'Performans Raporlari', basic: false, premium: true },
                      { feature: 'Tum Eklentiler', basic: false, premium: true },
                      { feature: 'Ozel Rozetler', basic: false, premium: true },
                    ].map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-700 font-medium">
                          {row.feature}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof row.basic === 'boolean' ? (
                            row.basic ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-gray-300">✕</span>
                            )
                          ) : (
                            <span className="text-sm text-gray-600">{row.basic}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof row.premium === 'boolean' ? (
                            row.premium ? (
                              <span className="text-green-500 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">✕</span>
                            )
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
    </div>
  );
}
