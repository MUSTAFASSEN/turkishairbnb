'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface EnrichedConversation {
  id: string;
  type: 'direct' | 'support';
  otherUser: { id: string; name: string; role: string } | null;
  lastMessage?: string;
  lastMessageAt?: string;
  unread: number;
  createdAt: string;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} sa önce`;
  const days = Math.floor(hrs / 24);
  return `${days} gün önce`;
}

export default function MesajlarPage() {
  const { user, isLoading, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/giris'); return; }
    if (user.role === 'admin') { router.push('/admin/mesajlar'); return; }
    fetchConversations();
  }, [user, isLoading, router]);

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const startSupportChat = async () => {
    setCreating(true);
    try {
      const data = await api.createConversation({ type: 'support' });
      router.push(`/mesajlar/${data.conversation.id}`);
    } catch {
      setCreating(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-hof mb-6">Mesajlar</h1>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-hof">Mesajlar</h1>
        <button
          onClick={startSupportChat}
          disabled={creating}
          className="text-sm bg-gold-500 text-white px-4 py-2 rounded-lg hover:bg-gold-600 transition disabled:opacity-50"
        >
          {creating ? 'Açılıyor...' : '💬 Destek Hattı'}
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-lg font-semibold text-hof mb-2">Henüz mesajınız yok</h2>
          <p className="text-foggy text-sm mb-6">Bir ev sahibiyle iletişime geçin veya destek hattına yazın.</p>
          <button
            onClick={startSupportChat}
            disabled={creating}
            className="bg-gold-500 text-white px-6 py-2.5 rounded-lg hover:bg-gold-600 transition disabled:opacity-50 font-medium"
          >
            Destek Hattına Mesaj Gönder
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <Link
              key={conv.id}
              href={`/mesajlar/${conv.id}`}
              className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-200 hover:border-gold-300 hover:shadow-sm transition group"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-semibold text-lg shrink-0">
                {conv.type === 'support'
                  ? '🛎'
                  : conv.otherUser?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-hof text-sm truncate">
                    {conv.type === 'support' ? 'TürkEvim Destek' : conv.otherUser?.name || 'Kullanıcı'}
                  </span>
                  <span className="text-xs text-foggy shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                </div>
                <p className="text-sm text-foggy truncate mt-0.5">
                  {conv.lastMessage || 'Konuşma başladı'}
                </p>
              </div>
              {/* Unread badge */}
              {conv.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-gold-500 text-white text-xs flex items-center justify-center font-semibold shrink-0">
                  {conv.unread > 9 ? '9+' : conv.unread}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
