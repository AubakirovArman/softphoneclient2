import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    if (!phone) return new NextResponse('Missing phone', { status: 400 });
    const advised = store.adviseOnIncomingCall(phone);
    const first = advised[0];
    // Логируем событие, чтобы в терминале было видно обращение и выбор конфига
    console.log('[advise_on_incoming_call]', { phone, advisedFirst: first ?? null, advisedAll: advised });
    return NextResponse.json(first ? [first] : []);
  } catch (e) {
    console.error('[advise_on_incoming_call][error]', e);
    return new NextResponse('Server error', { status: 500 });
  }
}