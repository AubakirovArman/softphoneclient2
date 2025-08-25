import { NextRequest, NextResponse } from 'next/server';
import { getAppConfig, setAppConfig } from '@/lib/softphoneClient';

export async function GET() {
  const cfg = getAppConfig();
  return NextResponse.json({
    ...cfg,
    softphoneSecret: cfg.softphoneSecret ? '***' : '',
    softphoneBearer: cfg.softphoneBearer ? '***' : '',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = getAppConfig();
    // sanitize/trim and preserve values if masked or absent
    const url = typeof body.softphoneUrl === 'string' ? body.softphoneUrl.trim() : current.softphoneUrl;
    let secret: string = current.softphoneSecret || '';
    if (typeof body.softphoneSecret === 'string') {
      const v = body.softphoneSecret.trim();
      if (v === '') secret = '';
      else if (v !== '***') secret = v; // ignore mask
    }
    let bearer: string | undefined = current.softphoneBearer;
    if (typeof body.softphoneBearer === 'string') {
      const v = body.softphoneBearer.trim();
      if (v === '') bearer = undefined; // allow clearing
      else if (v !== '***') bearer = v; // ignore mask
    }
    setAppConfig({ softphoneUrl: url, softphoneSecret: secret, softphoneBearer: bearer });
    return new NextResponse('OK');
  } catch (e) {
    return new NextResponse('Bad request', { status: 400 });
  }
}