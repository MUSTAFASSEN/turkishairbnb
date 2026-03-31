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
  { href: '/admin/emanet', label: 'Emanet', icon: '🔒' },
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
        <div className="w-80 bg-white border-r border-gray-100 flex flex-col shrink-0 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="font-bold text-hof text-base">Gelen Kutusu</h2>
            <p className="text-xs text-foggy mt-0.5">
              {conversations.filter(c => c.unread > 0).length > 0
                ? `${conversations.filter(c => c.unread > 0).length} yanıt bekliyor`
                : 'Destek talepleri'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-2">
                    <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <p className="text-sm text-foggy">Henüz destek talebi yok</p>
              </div>
            ) : (
              conversations.map(conv => {
                const name = conv.otherUser?.name || 'Kullanıcı';
                const isSelected = selectedId === conv.id;
                const hasUnread = conv.unread > 0;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 transition-all text-left relative ${
                      isSelected
                        ? 'bg-gold-50 border-l-[3px] border-l-gold-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full ring-2 ring-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-hof'}`}>
                          {name}
                        </span>
                        <span className="text-[10px] text-foggy shrink-0 ml-1">{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                      <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-foggy'}`}>
                        {conv.lastMessage || 'Konuşma başladı'}
                      </p>
                    </div>
                    {hasUnread && (
                      <span className="shrink-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unread > 9 ? '9+' : conv.unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col" style={{backgroundColor:'#f5ece0',backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M26 3L49 26L26 49L3 26z' fill='none' stroke='%23c9944a' stroke-width='0.8' stroke-opacity='0.18'/%3E%3C/svg%3E\")",backgroundSize:'52px 52px'}}>
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 bg-white/80 rounded-2xl shadow-sm flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <p className="font-semibold text-hof text-lg">Bir konuşma seçin</p>
              <p className="text-foggy text-sm mt-1">Sol panelden bir kullanıcının mesajını açın</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-white shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                  {selectedConv?.otherUser?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-hof leading-tight">{selectedConv?.otherUser?.name || 'Kullanıcı'}</p>
                  <p className="text-xs text-foggy">Destek talebi</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-foggy text-sm">Henüz mesaj yok.</p>
                  </div>
                )}
                {messages.map((msg, mi) => {
                  const isOwn = msg.senderId === user?.id;
                  const prevMsg = mi > 0 ? messages[mi - 1] : null;
                  const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}>
                      {!isOwn && (
                        <div className="w-7 h-7 shrink-0 mb-0.5">
                          {!isConsecutive && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {msg.senderName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[68%]`}>
                        {!isOwn && !isConsecutive && (
                          <span className="text-xs text-foggy font-medium ml-1 mb-1">{msg.senderName}</span>
                        )}
                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isOwn
                            ? 'bg-gradient-to-br from-gold-500 to-amber-500 text-white rounded-br-sm'
                            : 'bg-white text-hof border border-gray-100 rounded-bl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-foggy mt-1 mx-1">
                          {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-gray-100 bg-white">
                <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Yanıt yazın... (Enter ile gönder)"
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-hof placeholder:text-foggy resize-none outline-none leading-relaxed py-0.5"
                    style={{ maxHeight: '120px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!content.trim() || sending}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shrink-0 ${
                      content.trim() && !sending
                        ? 'bg-gradient-to-br from-gold-500 to-amber-500 text-white shadow-md hover:scale-105'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
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
