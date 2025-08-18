import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { SoftphoneConfig } from '@/lib/types';

export async function GET() {
  return NextResponse.json(store.listConfigs());
}

export async function POST(req: NextRequest) {
  try {
    const { configId, config } = (await req.json()) as { configId: string; config: SoftphoneConfig };
    if (!configId || !config) return new NextResponse('Bad request', { status: 400 });
    store.setConfig(configId, config);
    return new NextResponse('OK');
  } catch (e) {
    return new NextResponse('Bad request', { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('configId');
    if (!id) return new NextResponse('Missing configId', { status: 400 });
    store.removeConfig(id);
    return new NextResponse('OK');
  } catch (e) {
    return new NextResponse('Bad request', { status: 400 });
  }
}