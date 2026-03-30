export type UserRole = 'guest' | 'host' | 'admin';
export type SubscriptionPlan = 'basic' | 'premium' | 'none';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'held' | 'released' | 'refunded';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiry?: string;
  createdAt: string;
}

export type ListingCategory =
  | 'Sahil kenarı'
  | 'Dağ evi'
  | 'Kır evi'
  | 'Tarihi'
  | 'Göl kenarı'
  | 'Kamp alanı'
  | 'Tropikal'
  | 'Kayak'
  | 'Tiny house'
  | 'Çiftlik'
  | 'Şehir merkezi'
  | 'Termal';

export interface Listing {
  id: string;
  hostId: string;
  title: string;
  description: string;
  category: ListingCategory;
  pricePerNight: number;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  images: string[];
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  isFeatured: boolean;
  featuredStartAt?: string;
  featuredEndAt?: string;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  commissionAmount: number;
  hostEarnings: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  listingId: string;
  guestId: string;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  commission: number;
  hostPayout: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  type: 'direct' | 'support';
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCounts: Record<string, number>;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

export type PublicUser = Omit<User, 'password'>;
