# TürkEvim - Türkiye'nin Konaklama Platformu

Türkiye odaklı, Airbnb tarzı kiralık konaklama platformu. Sadece **%5 komisyon** ile ev sahipleri ve misafirler arasında güvenli köprü.

## Özellikler

### İş Modeli
- **%5 Komisyon** - Sektörün en düşük komisyon oranı
- **Abonelik Planları** - Basic (499₺/ay) ve Premium (999₺/ay)
- **Escrow Ödeme Sistemi** - Güvenli ödeme altyapısı

### Kullanıcı Rolleri
- **Misafir** - İlan arama, rezervasyon, değerlendirme
- **Ev Sahibi** - İlan yönetimi, rezervasyon takibi, kazanç dashboard
- **Admin** - Tam kontrol paneli, kullanıcı/ilan/gelir yönetimi

### Teknik Özellikler
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- JWT Authentication
- Türkçe arayüz
- Mobil uyumlu tasarım

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Demo Hesapları

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | admin@turkevim.com | admin123 |
| Ev Sahibi (Premium) | ahmet@test.com | test123 |
| Ev Sahibi (Basic) | fatma@test.com | test123 |
| Misafir | mehmet@test.com | test123 |
| Misafir | ayse@test.com | test123 |

## Sayfa Yapısı

### Genel Sayfalar
- `/` - Ana sayfa (hero, öne çıkan ilanlar, popüler şehirler)
- `/ilanlar` - İlan arama ve filtreleme
- `/ilan/[id]` - İlan detay sayfası
- `/giris` - Giriş yap
- `/kayit` - Kayıt ol
- `/profil` - Kullanıcı profili ve rezervasyon geçmişi
- `/rezervasyon` - Ödeme ve rezervasyon onayı

### Ev Sahibi Paneli
- `/ev-sahibi/panel` - Dashboard (istatistikler, son rezervasyonlar)
- `/ev-sahibi/ilanlar/yeni` - Yeni ilan oluştur
- `/ev-sahibi/ilanlar/duzenle` - İlan düzenle
- `/ev-sahibi/rezervasyonlar` - Rezervasyon yönetimi
- `/ev-sahibi/kazanclar` - Kazanç takibi
- `/ev-sahibi/abonelik` - Abonelik planları

### Admin Paneli
- `/admin/panel` - Admin dashboard
- `/admin/kullanicilar` - Kullanıcı yönetimi
- `/admin/ilanlar` - İlan yönetimi
- `/admin/rezervasyonlar` - Rezervasyon yönetimi
- `/admin/gelirler` - Gelir raporları
- `/admin/abonelikler` - Abonelik yönetimi

## API Endpoints

### Auth
- `POST /api/auth/login` - Giriş
- `POST /api/auth/register` - Kayıt
- `GET /api/auth/me` - Mevcut kullanıcı

### İlanlar
- `GET /api/listings` - İlan listesi (filtreleme destekli)
- `POST /api/listings` - İlan oluştur
- `PUT /api/listings` - İlan güncelle
- `DELETE /api/listings?id=xxx` - İlan sil

### Rezervasyonlar
- `GET /api/bookings` - Rezervasyon listesi
- `POST /api/bookings` - Rezervasyon oluştur
- `PUT /api/bookings` - Durum güncelle

### Değerlendirmeler
- `GET /api/reviews?listingId=xxx` - Değerlendirmeler
- `POST /api/reviews` - Değerlendirme yaz

### Ödemeler
- `POST /api/payments` - Ödeme işlemi (escrow release/refund)

### Admin
- `GET /api/admin/users` - Kullanıcı listesi
- `GET /api/admin/stats` - Platform istatistikleri
- `PUT /api/admin/subscriptions` - Abonelik güncelle

## Ortam Değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyalayıp düzenleyin.

## Notlar

- MVP olarak in-memory veritabanı kullanılmaktadır (sunucu yeniden başlatılınca veriler sıfırlanır)
- Ödeme sistemi mock olarak çalışmaktadır (Stripe/iyzico entegrasyonuna hazır)
- Üretim ortamı için PostgreSQL + Prisma entegrasyonu önerilir
