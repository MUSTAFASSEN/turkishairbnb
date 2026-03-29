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

const cities = [
  'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Trabzon',
  'Muğla', 'Aydın', 'Nevşehir', 'Çanakkale', 'Karabük', 'Artvin',
  'Rize', 'Gaziantep', 'Mersin', 'Eskişehir', 'Konya', 'Adana',
  'Bodrum', 'Fethiye', 'Kaş', 'Kuşadası', 'Marmaris', 'Alanya',
];

const categoryOptions = [
  'Sahil kenarı', 'Dağ evi', 'Kır evi', 'Tarihi', 'Göl kenarı',
  'Kamp alanı', 'Tropikal', 'Kayak', 'Tiny house', 'Çiftlik',
  'Şehir merkezi', 'Termal',
];

const amenitiesList = [
  'WiFi', 'Klima', 'Mutfak', 'Çamaşır Makinesi', 'Otopark',
  'Havuz', 'Balkon', 'Bahçe', 'TV', 'Bulaşık Makinesi',
  'Saç Kurutma Makinesi', 'Ütü', 'Isıtma', 'Jakuzi',
  'Mangal', 'Deniz Manzarası', 'Evcil Hayvan Kabul', 'Asansör',
];

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, loadFromStorage } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    pricePerNight: '',
    city: '',
    address: '',
    maxGuests: '1',
    bedrooms: '1',
    bathrooms: '1',
    amenities: [] as string[],
    images: '',
  });

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'host') {
      router.push('/giris');
    }
  }, [user, authLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.description || !form.pricePerNight || !form.city || !form.address || !form.category) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setSubmitting(true);
    try {
      const images = form.images
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      await api.createListing({
        title: form.title,
        description: form.description,
        category: form.category,
        pricePerNight: Number(form.pricePerNight),
        city: form.city,
        address: form.address,
        maxGuests: Number(form.maxGuests),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        amenities: form.amenities,
        images,
      });

      router.push('/ev-sahibi/panel');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlan oluşturulurken bir hata oluştu.');
    } finally {
      setSubmitting(false);
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
                  link.href === '/ev-sahibi/ilanlar/yeni'
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
                    link.href === '/ev-sahibi/ilanlar/yeni'
                      ? 'bg-gold-50 text-gold-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Yeni İlan Oluştur</h1>
              <p className="text-gray-500 mt-1">Evinizi misafirlere açmak için ilan bilgilerini doldurun</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İlan Başlığı <span className="text-gold-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Örn: Boğaz Manzaralı Modern Daire"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama <span className="text-gold-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Evinizi detaylı bir şekilde tanımlayın..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori <span className="text-gold-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="">Kategori seçin</option>
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gecelik Fiyat (₺) <span className="text-gold-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="pricePerNight"
                        value={form.pricePerNight}
                        onChange={handleChange}
                        min="1"
                        placeholder="500"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Şehir <span className="text-gold-500">*</span>
                      </label>
                      <select
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all bg-white"
                      >
                        <option value="">Şehir seçin</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adres <span className="text-gold-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Tam adres bilgisi"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ev Detayları</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maksimum Misafir
                    </label>
                    <input
                      type="number"
                      name="maxGuests"
                      value={form.maxGuests}
                      onChange={handleChange}
                      min="1"
                      max="20"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yatak Odası
                    </label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={form.bedrooms}
                      onChange={handleChange}
                      min="0"
                      max="20"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banyo
                    </label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={form.bathrooms}
                      onChange={handleChange}
                      min="0"
                      max="20"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Olanaklar</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {amenitiesList.map((amenity) => (
                    <label
                      key={amenity}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        form.amenities.includes(amenity)
                          ? 'border-gold-500 bg-gold-50 text-gold-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          form.amenities.includes(amenity)
                            ? 'border-gold-500 bg-gold-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {form.amenities.includes(amenity) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Fotoğraflar</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fotoğraf URL&apos;leri (her satıra bir URL)
                  </label>
                  <textarea
                    name="images"
                    value={form.images}
                    onChange={handleChange}
                    rows={4}
                    placeholder={"https://ornek.com/foto1.jpg\nhttps://ornek.com/foto2.jpg"}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Her satıra bir fotoğraf URL&apos;si girin
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-gold-500 text-white font-semibold rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Oluşturuluyor...' : 'İlanı Yayınla'}
                </button>
                <Link
                  href="/ev-sahibi/panel"
                  className="px-8 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  İptal
                </Link>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
