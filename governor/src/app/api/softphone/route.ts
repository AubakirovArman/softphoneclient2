import { NextRequest, NextResponse } from 'next/server';
import { getAppConfig } from '@/lib/softphoneClient';

function buildTargetUrl(base: string, path: string, search: URLSearchParams) {
  const endpoint = base.replace(/\/$/, '');
  const u = new URL(`${endpoint}${path}`);
  // copy user params first
  for (const [k, v] of search.entries()) {
    if (k !== 'path') u.searchParams.set(k, v);
  }
  return u;
}

export async function GET(req: NextRequest) {
  try {
    const { softphoneUrl, softphoneSecret, softphoneBearer } = getAppConfig();
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/status';
    const target = buildTargetUrl(softphoneUrl, path, url.searchParams);
    if (softphoneSecret) target.searchParams.set('secret', softphoneSecret);

    const headers: Record<string, string> = {};
    if (softphoneBearer) headers['Authorization'] = `Bearer ${softphoneBearer}`;

    const res = await fetch(target.toString(), { headers });
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: res.status,
      headers: res.headers,
    });
  } catch (e: any) {
    return new NextResponse(e?.message || 'Proxy GET error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { softphoneUrl, softphoneSecret, softphoneBearer } = getAppConfig();
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/';
    const target = buildTargetUrl(softphoneUrl, path, url.searchParams);
    if (softphoneSecret) target.searchParams.set('secret', softphoneSecret);

    const contentType = req.headers.get('content-type') || '';
    const isBinary = !contentType || contentType.startsWith('application/octet-stream');
    const body = isBinary ? await req.arrayBuffer() : await req.text();

    const headers: Record<string, string> = {};
    if (contentType) headers['Content-Type'] = contentType;
    if (softphoneBearer) headers['Authorization'] = `Bearer ${softphoneBearer}`;

    const res = await fetch(target.toString(), {
      method: 'POST',
      headers,
      body: isBinary ? body : (typeof body === 'string' ? body : JSON.stringify(body)),
    });
    const resBody = await res.arrayBuffer();
    return new NextResponse(resBody, { status: res.status, headers: res.headers });
  } catch (e: any) {
    return new NextResponse(e?.message || 'Proxy POST error', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { softphoneUrl, softphoneSecret, softphoneBearer } = getAppConfig();
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/';
    const target = buildTargetUrl(softphoneUrl, path, url.searchParams);
    if (softphoneSecret) target.searchParams.set('secret', softphoneSecret);

    const headers: Record<string, string> = {};
    if (softphoneBearer) headers['Authorization'] = `Bearer ${softphoneBearer}`;

    const res = await fetch(target.toString(), { method: 'DELETE', headers });
    const resBody = await res.arrayBuffer();
    return new NextResponse(resBody, { status: res.status, headers: res.headers });
  } catch (e: any) {
    return new NextResponse(e?.message || 'Proxy DELETE error', { status: 500 });
  }
}
