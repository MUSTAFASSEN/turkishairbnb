import { create } from 'zustand';
import { PublicUser } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  isLoading: boolean;
  favoriteIds: string[];
  setAuth: (user: PublicUser, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  favoriteIds: [],
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isLoading: false });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isLoading: false, favoriteIds: [] });
  },
  loadFromStorage: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
  loadFavorites: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const data = await api.getFavoriteIds();
      set({ favoriteIds: data.favoriteIds || [] });
    } catch {
      // silently fail
    }
  },
  toggleFavorite: async (listingId: string) => {
    const { favoriteIds, token } = get();
    if (!token) return;
    const isFav = favoriteIds.includes(listingId);
    if (isFav) {
      set({ favoriteIds: favoriteIds.filter(id => id !== listingId) });
      try {
        await api.removeFavorite(listingId);
      } catch {
        set({ favoriteIds: [...favoriteIds] });
      }
    } else {
      set({ favoriteIds: [...favoriteIds, listingId] });
      try {
        await api.addFavorite(listingId);
      } catch {
        set({ favoriteIds: favoriteIds.filter(id => id !== listingId) });
      }
    }
  },
}));
