'use server';

import { initializeFirebase } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

// Получить последние сообщения
export async function GET() {
  try {
    const { firestore } = initializeFirebase();
    const messagesRef = collection(firestore, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .reverse();
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch messages' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Отправить новое сообщение
export async function POST(request: NextRequest) {
  try {
    const { firestore } = initializeFirebase();
    const body = await request.json();
    const { author, content } = body;

    if (!author || !content) {
      return new NextResponse(
        JSON.stringify({ error: 'Author and content are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const docRef = await addDoc(collection(firestore, 'messages'), {
      author,
      content,
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id, author, content, timestamp: new Date().toISOString() }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to send message' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
