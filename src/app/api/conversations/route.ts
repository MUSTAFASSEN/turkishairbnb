import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { initDb, conversationsCol, usersCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Conversation } from '@/types';

export async function GET(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });

  const conversations = await conversationsCol();

  let convList;
  if (user.role === 'admin') {
    // Admin sees all support conversations + their direct ones
    convList = await conversations.find(
      { $or: [{ type: 'support' }, { participantIds: user.id }] },
      { projection: { _id: 0 } }
    ).sort({ lastMessageAt: -1 }).toArray();
  } else {
    convList = await conversations.find(
      { participantIds: user.id },
      { projection: { _id: 0 } }
    ).sort({ lastMessageAt: -1 }).toArray();
  }

  // Enrich with other participant info
  const allParticipantIds = new Set<string>();
  convList.forEach(c => c.participantIds.forEach((id: string) => allParticipantIds.add(id)));

  const users = await usersCol();
  const userDocs = await users.find(
    { id: { $in: Array.from(allParticipantIds) } },
    { projection: { _id: 0, id: 1, name: 1, role: 1 } }
  ).toArray();
  const userMap = new Map(userDocs.map(u => [u.id, u]));

  const enriched = convList.map(c => {
    // For support convs the "other" is admin; for user this is visible as "Destek"
    let otherUser = null;
    if (c.type === 'support') {
      if (user.role === 'admin') {
        const userId = c.participantIds.find((id: string) => id !== user.id) || c.participantIds[0];
        otherUser = userMap.get(userId) || { id: userId, name: 'Kullanıcı', role: 'guest' };
      } else {
        otherUser = { id: 'admin', name: 'TürkEvim Destek', role: 'admin' };
      }
    } else {
      const otherId = c.participantIds.find((id: string) => id !== user.id);
      otherUser = otherId ? userMap.get(otherId) : null;
    }
    return {
      ...c,
      otherUser,
      unread: c.unreadCounts?.[user.id] || 0,
    };
  });

  return NextResponse.json({ conversations: enriched });
}

export async function POST(request: NextRequest) {
  await initDb();
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });

  const body = await request.json();
  const conversations = await conversationsCol();

  if (body.type === 'support') {
    // Find or create support conversation for this user
    const existing = await conversations.findOne(
      { type: 'support', participantIds: user.id },
      { projection: { _id: 0 } }
    );
    if (existing) return NextResponse.json({ conversation: existing });

    const newConv: Conversation = {
      id: uuid(),
      participantIds: [user.id],
      type: 'support',
      lastMessage: undefined,
      lastMessageAt: new Date().toISOString(),
      unreadCounts: {},
      createdAt: new Date().toISOString(),
    };
    await conversations.insertOne(newConv as Conversation);
    return NextResponse.json({ conversation: newConv }, { status: 201 });
  }

  // Direct conversation
  const { participantId } = body;
  if (!participantId) return NextResponse.json({ error: 'participantId gerekli' }, { status: 400 });
  if (participantId === user.id) return NextResponse.json({ error: 'Kendinizle konuşamazsınız' }, { status: 400 });

  // Check existing direct conversation between these two users
  const existing = await conversations.findOne(
    { type: 'direct', participantIds: { $all: [user.id, participantId] } },
    { projection: { _id: 0 } }
  );
  if (existing) return NextResponse.json({ conversation: existing });

  const newConv: Conversation = {
    id: uuid(),
    participantIds: [user.id, participantId],
    type: 'direct',
    lastMessage: undefined,
    lastMessageAt: new Date().toISOString(),
    unreadCounts: {},
    createdAt: new Date().toISOString(),
  };
  await conversations.insertOne(newConv as Conversation);
  return NextResponse.json({ conversation: newConv }, { status: 201 });
}
