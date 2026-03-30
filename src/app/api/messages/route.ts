import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { initDb, messagesCol, conversationsCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Message } from '@/types';

function canAccess(conv: { participantIds: string[]; type: string }, userId: string, userRole: string) {
  if (userRole === 'admin' && conv.type === 'support') return true;
  return conv.participantIds.includes(userId);
}

export async function GET(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');
  if (!conversationId) return NextResponse.json({ error: 'conversationId gerekli' }, { status: 400 });

  const conversations = await conversationsCol();
  const conv = await conversations.findOne({ id: conversationId }, { projection: { _id: 0 } });
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı' }, { status: 404 });
  if (!canAccess(conv, user.id, user.role)) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
  }

  const messages = await messagesCol();
  const msgList = await messages
    .find({ conversationId }, { projection: { _id: 0 } })
    .sort({ createdAt: 1 })
    .limit(100)
    .toArray();

  return NextResponse.json({ messages: msgList });
}

export async function POST(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });

  const { conversationId, content } = await request.json();
  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: 'conversationId ve content gerekli' }, { status: 400 });
  }

  const conversations = await conversationsCol();
  const conv = await conversations.findOne({ id: conversationId }, { projection: { _id: 0 } });
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı' }, { status: 404 });
  if (!canAccess(conv, user.id, user.role)) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const newMessage: Message = {
    id: uuid(),
    conversationId,
    senderId: user.id,
    senderName: user.name,
    content: content.trim(),
    createdAt: now,
  };

  const messages = await messagesCol();
  await messages.insertOne(newMessage as Message);

  // Update unread counts for all other participants
  const unreadUpdate: Record<string, number> = { ...conv.unreadCounts };
  const recipients = conv.type === 'support' && user.role !== 'admin'
    ? [] // admin will see it; we don't have admin id in participantIds for support
    : conv.participantIds.filter((id: string) => id !== user.id);

  for (const recipientId of recipients) {
    unreadUpdate[recipientId] = (unreadUpdate[recipientId] || 0) + 1;
  }
  // For support convs sent by user, increment admin unread (use 'admin' key)
  if (conv.type === 'support' && user.role !== 'admin') {
    unreadUpdate['admin'] = (unreadUpdate['admin'] || 0) + 1;
  }

  await conversations.updateOne(
    { id: conversationId },
    { $set: { lastMessage: content.trim(), lastMessageAt: now, unreadCounts: unreadUpdate } }
  );

  return NextResponse.json({ message: newMessage }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });

  const { conversationId } = await request.json();
  if (!conversationId) return NextResponse.json({ error: 'conversationId gerekli' }, { status: 400 });

  const conversations = await conversationsCol();
  const conv = await conversations.findOne({ id: conversationId }, { projection: { _id: 0 } });
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı' }, { status: 404 });
  if (!canAccess(conv, user.id, user.role)) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
  }

  // Reset unread count for current user
  const unreadKey = user.role === 'admin' && conv.type === 'support' ? 'admin' : user.id;
  await conversations.updateOne(
    { id: conversationId },
    { $set: { [`unreadCounts.${unreadKey}`]: 0 } }
  );

  return NextResponse.json({ success: true });
}
