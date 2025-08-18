import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    return NextResponse.json(store.listConfigs());
  } catch (e) {
    return new NextResponse('Server error', { status: 500 });
  }
}