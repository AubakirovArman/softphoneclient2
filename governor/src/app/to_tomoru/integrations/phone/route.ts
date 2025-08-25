import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { sayText } from '@/lib/softphoneClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// простое in-memory состояние для диалогов и дедупликации
const dialogs = new Map<string, { dialogId: string; createdAt: string }>();
const seen = new Set<string>();
const key = (configId: string, phone: string) => `${configId}|${phone}`;

export async function POST(req: NextRequest) {
  try {
    // Проверка секрета, если включена
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    if (process.env.INBOUND_SECRET && secret !== process.env.INBOUND_SECRET) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Читаем сырое тело и пробуем распарсить JSON
    const raw = await req.text();
    try { console.log('[webhook raw]', raw?.slice(0, 2000)); } catch {}
    let body: any = null;
    try { body = raw ? JSON.parse(raw) : null; } catch {}

    if (!body) {
      return NextResponse.json({ success: true, note: 'empty body' });
    }

    // Нормализуем: поддерживаем как плоский формат, так и вложенный { signal }
    const s = body.signal ?? body;
    const { configId, phone } = body;
    const date = body.date || new Date().toISOString();

    if (s.type === 'event') {
      if (s.eventType === 'call_start') {
        const k = key(configId, phone);
        const dialogId = uuidv4();
        dialogs.set(k, { dialogId, createdAt: date });
        return NextResponse.json({ success: true, dialogId });
      }
      if (s.eventType === 'call_end') {
        const k = key(configId, phone);
        const dlg = dialogs.get(k);
        dialogs.delete(k);
        return NextResponse.json({ success: true, dialogId: dlg?.dialogId });
      }
      return NextResponse.json({ success: true });
    }

    if (s.type === 'message_delivered') {
      return NextResponse.json({ success: true });
    }

    if (s.type === 'new_user_phrase') {
      // дедупликация по messageId
      if (body.messageId && seen.has(body.messageId)) {
        const dlg = dialogs.get(key(configId, phone));
        return NextResponse.json({ success: true, dialogId: dlg?.dialogId });
      }
      if (body.messageId) seen.add(body.messageId);

      const k = key(configId, phone);
      let dlg = dialogs.get(k);
      if (!dlg) {
        dlg = { dialogId: uuidv4(), createdAt: date };
        dialogs.set(k, dlg);
      }

      const userText = (body.message || '').toString().trim();
      const reply = userText ? `Вы сказали: ${userText}` : 'Извините, я вас не расслышал.';

      // Отправляем ответ в софтфон: у вашей сборки text — на верхнем уровне
      try {
        await sayText({ configId, phone, text: reply, dialogId: dlg.dialogId });
      } catch (e) {
        console.error('sayText error:', e);
      }
      return NextResponse.json({ success: true, dialogId: dlg.dialogId });
    }

    // неизвестный тип — подтверждаем во избежание ретраев
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('webhook fatal:', e);
    return NextResponse.json({ success: true });
  }
}