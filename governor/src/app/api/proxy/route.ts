import { NextRequest, NextResponse } from 'next/server';
import { sendToSoftphone } from '@/lib/softphoneClient';
import { ChatIntegrationMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatIntegrationMessage;
    await sendToSoftphone(body);
    return new NextResponse('Accepted');
  } catch (e: any) {
  const msg = e?.message || 'Error';
  const match = typeof msg === 'string' ? msg.match(/Softphone error (\d+):/) : null;
  const status = match ? parseInt(match[1], 10) : 400;
  return new NextResponse(msg, { status });
  }
}