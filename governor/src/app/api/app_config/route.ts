import { NextRequest, NextResponse } from 'next/server';
import { getAppConfig, setAppConfig } from '@/lib/softphoneClient';

export async function GET() {
  const cfg = getAppConfig();
  return NextResponse.json({ ...cfg, softphoneSecret: cfg.softphoneSecret ? '***' : '' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    setAppConfig(body);
    return new NextResponse('OK');
  } catch (e) {
    return new NextResponse('Bad request', { status: 400 });
  }
}