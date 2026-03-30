'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  type: 'direct' | 'support';
  otherUser: { id: string; name: string; role: string } | null;
  lastMessage?: string;
  lastMessageAt?: string;
  unread: number;
}

const sidebarLinks = [
  { href: '/admin/panel', label: 'Panel', icon: '📊' },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: '👥' },
  { href: '/admin/ilanlar', label: 'İlanlar', icon: '🏠' },
  { href: '/admin/rezervasyonlar', label: 'Rezervasyonlar', icon: '📅' },
  { href: '/admin/gelirler', label: 'Gelirler', icon: '💰' },
  { href: '/admin/abonelikler', label: 'Abonelikler', icon: '⭐' },
  { href: '/admin/mesajlar', label: 'Mesajlar', icon: '💬' },
];

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} sa`;
  return `${Math.floor(hrs / 24)} gün`;
}

export default function AdminMesajlarPage() {
  const { user, isLoading: authLoading, loadFromStorage, logout } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { router.push('/giris'); return; }
    fetchConversations();
  }, [user, authLoading, router]);

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

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const data = await api.getMessages(convId);
      setMessages(data.messages || []);
    } catch {
      // ignore
    }
  }, []);

  const selectConversation = async (convId: string) => {
    setSelectedId(convId);
    setMessages([]);
    await fetchMessages(convId);
    await api.markRead(convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread: 0 } : c));
  };

  // Poll for new messages in selected conversation
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!selectedId) return;
    intervalRef.current = setInterval(() => fetchMessages(selectedId), 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedId, fetchMessages]);

  // Poll conversation list every 10s
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const t = setInterval(fetchConversations, 10000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || sending || !selectedId) return;
    setSending(true);
    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      conversationId: selectedId,
      senderId: user!.id,
      senderName: user!.name,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setContent('');
    try {
      const data = await api.sendMessage(selectedId, tempMsg.content);
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
      fetchConversations();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setContent(tempMsg.content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const selectedConv = conversations.find(c => c.id === selectedId);

  if (authLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white p-2 rounded-lg shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex lg:flex-col`}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">TürkEvim Admin</h1>
          <p className="text-slate-400 text-sm mt-1">{user?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map(link => (
            <a key={link.href} href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                link.href === '/admin/mesajlar'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}>
              <span>{link.icon}</span>{link.label}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Çıkış Yap
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden" style={{ height: '100vh' }}>
        {/* Conversation list */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-hof text-lg">Mesajlar</h2>
            <p className="text-xs text-foggy mt-1">Kullanıcı destek talepleri</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-foggy text-sm">Henüz mesaj yok</div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition text-left ${selectedId === conv.id ? 'bg-gold-50 border-l-4 border-l-gold-500' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-semibold shrink-0">
                    {conv.otherUser?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-hof text-sm truncate">{conv.otherUser?.name || 'Kullanıcı'}</span>
                      <span className="text-xs text-foggy shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-foggy truncate mt-0.5">{conv.lastMessage || 'Konuşma başladı'}</p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-gold-500 text-white text-xs flex items-center justify-center font-semibold shrink-0">
                      {conv.unread > 9 ? '9+' : conv.unread}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-foggy">
                <div className="text-5xl mb-3">💬</div>
                <p className="font-medium text-hof">Bir konuşma seçin</p>
                <p className="text-sm mt-1">Sol listeden bir konuşmaya tıklayın</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-semibold shrink-0">
                  {selectedConv?.otherUser?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-hof">{selectedConv?.otherUser?.name || 'Kullanıcı'}</p>
                  <p className="text-xs text-foggy">Destek talebi</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-foggy text-sm py-10">Henüz mesaj yok.</div>
                )}
                {messages.map(msg => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        isOwn
                          ? 'bg-gold-500 text-white rounded-br-sm'
                          : 'bg-white text-hof border border-gray-200 rounded-bl-sm shadow-sm'
                      }`}>
                        {!isOwn && <p className="text-xs font-semibold mb-1 text-gold-600">{msg.senderName}</p>}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-foggy'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Cevabınızı yazın... (Enter ile gönder)"
                    rows={1}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none outline-none"
                    style={{ maxHeight: '120px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!content.trim() || sending}
                    className="bg-gold-500 text-white rounded-xl p-2.5 hover:bg-gold-600 transition disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
