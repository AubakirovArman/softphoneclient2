import { NextRequest, NextResponse } from 'next/server';
import { sendToSoftphone } from '@/lib/softphoneClient';
import { ChatIntegrationMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatIntegrationMessage;
    await sendToSoftphone(body);
    return new NextResponse('Accepted');
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error', { status: 400 });
  }
}