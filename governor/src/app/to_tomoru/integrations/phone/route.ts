import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { SignalPayload } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SignalPayload;
    const res = await store.handleSignal(body);
    // Возвращаем исходный ответ + последние логи
    return NextResponse.json({ ...res});
  } catch (e) {
    return new NextResponse('Bad request', { status: 400 });
  }
}