import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { SoftphoneLogPayload } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SoftphoneLogPayload;
    store.logEvent(body);
    return new NextResponse('OK');
  } catch (e) {
    return new NextResponse('Bad request', { status: 400 });
  }
}