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
  if (mins < 60) return `${mins} dk`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} sa`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} gün`;
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

const AVATAR_COLORS = [
  'from-violet-400 to-purple-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-orange-400 to-rose-500',
  'from-pink-400 to-fuchsia-500',
  'from-amber-400 to-orange-500',
];

function avatarColor(name: string) {
  const idx = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[idx];
}

function roleLabel(role: string) {
  if (role === 'host') return 'Ev Sahibi';
  if (role === 'admin') return 'Admin';
  return 'Misafir';
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

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen" style={{backgroundColor:'#faf4ed'}}>
        <div className="max-w-2xl mx-auto px-4 pt-10">
          <div className="h-8 bg-gray-200 rounded-lg w-32 mb-6 animate-pulse" />
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/5" />
                  <div className="h-3 bg-gray-200 rounded w-3/5" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-hof">Mesajlar</h1>
            {totalUnread > 0 && (
              <p className="text-sm text-gold-600 mt-0.5 font-medium">{totalUnread} okunmamış mesaj</p>
            )}
          </div>
          <button
            onClick={startSupportChat}
            disabled={creating}
            className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:from-gold-600 hover:to-amber-600 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {creating ? 'Açılıyor...' : 'Destek Hattı'}
          </button>
        </div>

        {/* Conversation list */}
        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-hof mb-2">Henüz mesajınız yok</h2>
            <p className="text-foggy text-sm mb-6 leading-relaxed">
              Bir ilanı ziyaret edip ev sahibiyle iletişime geçin<br />ya da destek hattımıza yazın.
            </p>
            <button
              onClick={startSupportChat}
              disabled={creating}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Destek Hattına Yaz
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {conversations.map(conv => {
              const name = conv.type === 'support' ? 'TürkEvim Destek' : conv.otherUser?.name || 'Kullanıcı';
              const isSupport = conv.type === 'support';
              const gradient = isSupport ? 'from-gold-400 to-amber-500' : avatarColor(name);
              const role = conv.otherUser?.role || '';

              return (
                <Link
                  key={conv.id}
                  href={`/mesajlar/${conv.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                      {isSupport ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {conv.unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                        {conv.unread > 9 ? '9+' : conv.unread}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-semibold text-sm truncate ${conv.unread > 0 ? 'text-gray-900' : 'text-hof'}`}>
                        {name}
                      </span>
                      {!isSupport && role && (
                        <span className="text-[10px] font-medium bg-gray-100 text-foggy px-1.5 py-0.5 rounded-full shrink-0">
                          {roleLabel(role)}
                        </span>
                      )}
                      {isSupport && (
                        <span className="text-[10px] font-medium bg-gold-50 text-gold-600 px-1.5 py-0.5 rounded-full shrink-0">
                          Destek
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${conv.unread > 0 ? 'text-gray-700 font-medium' : 'text-foggy'}`}>
                      {conv.lastMessage || 'Konuşma başladı'}
                    </p>
                  </div>

                  {/* Time + arrow */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-foggy">{timeAgo(conv.lastMessageAt)}</span>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-foggy mt-6">Tüm mesajlarınız şifreli ve güvenlidir.</p>
      </div>
    </div>
  );
}
