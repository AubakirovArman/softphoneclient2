import { SoftphoneConfig, SignalPayload, SignalResponse, SoftphoneLogPayload } from './types';
import { v4 as uuidv4 } from 'uuid';
import { sendToSoftphone } from './softphoneClient';

// In-memory data store. In production replace with DB.
class DataStore {
  configs = new Map<string, SoftphoneConfig>();
  dialogs = new Map<string, { configId: string; phone: string; createdAt: string }>();
  // logs ring buffer (latest first when served)
  private logs: SoftphoneLogPayload[] = [];
  private seenMessageIds = new Set<string>();

  listConfigs(): Record<string, SoftphoneConfig> {
    const out: Record<string, SoftphoneConfig> = {};
    for (const [k, v] of this.configs.entries()) out[k] = v;
    return out;
  }

  setConfig(id: string, cfg: SoftphoneConfig) {
    this.configs.set(id, cfg);
  }

  removeConfig(id: string) {
    this.configs.delete(id);
  }

  // Найти существующий диалог по паре (configId, phone)
  private findDialog(configId: string, phone: string): { dialogId: string; configId: string; phone: string; createdAt: string } | undefined {
    for (const [id, d] of this.dialogs) {
      if (d.configId === configId && d.phone === phone) return { dialogId: id, ...d };
    }
    return undefined;
  }

  // Получить существующий диалог или создать новый
  private getOrCreateDialog(configId: string, phone: string, date: string) {
    const found = this.findDialog(configId, phone);
    if (found) return found;
    const dialogId = uuidv4();
    const dlg = { configId, phone, createdAt: date };
    this.dialogs.set(dialogId, dlg);
    return { dialogId, ...dlg };
  }

  async handleSignal(payload: SignalPayload): Promise<SignalResponse> {
    if (payload.signal.type === 'event' && payload.signal.eventType === 'call_start') {
      const dialogId = uuidv4();
      this.dialogs.set(dialogId, { configId: payload.configId, phone: payload.phone, createdAt: payload.date });
      return { success: true, dialogId };
    }
    if (payload.signal.type === 'event' && payload.signal.eventType === 'call_end') {
      // naive: clear any dialog for this config/phone
      for (const [id, d] of this.dialogs) {
        if (d.configId === payload.configId && d.phone === payload.phone) {
          this.dialogs.delete(id);
        }
      }
      return { success: true };
    }

    // пользователь сказал фразу
    if (payload.signal.type === 'new_user_phrase') {
      const signal = payload.signal;
      if (signal.messageId && this.seenMessageIds.has(signal.messageId)) {
        const dlg = this.findDialog(payload.configId, payload.phone);
        return { success: true, dialogId: dlg?.dialogId }; // идемпотентно
      }
      if (signal.messageId) this.seenMessageIds.add(signal.messageId);

      const dlg = this.getOrCreateDialog(payload.configId, payload.phone, payload.date);
      const userText = (signal.message || '').trim();

      // простая логика бота: эхо
      const reply = userText ? `Вы сказали: ${userText}` : 'Извините, я вас не расслышал.';
      const botMessageId = uuidv4();

      try {
        await sendToSoftphone({
          type: 'say',
          configId: payload.configId,
          phone: payload.phone,
          message: { text: reply },
          messageId: botMessageId,
          dialogId: dlg.dialogId,
          taskId: payload.taskId,
        });
      } catch (e) {
        // можно залогировать ошибку, но ответ остаётся успешным, чтобы избежать ретраев
        console.error('sendToSoftphone(say) failed', e);
      }

      return { success: true, dialogId: dlg.dialogId };
    }

    // подтверждение, что фраза договорилась
    if (payload.signal.type === 'message_delivered') {
      const dlg = this.findDialog(payload.configId, payload.phone);
      // тут можно посчитать длительность по deliveryDate и залогировать
      return { success: true, dialogId: dlg?.dialogId };
    }

    // неизвестный сигнал — всё равно 200/true, чтобы софтфон не ретраил бесконечно
    const dlg = this.findDialog(payload.configId, payload.phone);
    return { success: true, dialogId: dlg?.dialogId };
  }

  adviseOnIncomingCall(phone: string): string[] {
    // naive strategy: return all configs; UI can refine later
    return Array.from(this.configs.keys());
  }

  logEvent(_log: SoftphoneLogPayload) {
    // push to ring buffer and log to console for debugging
    this.logs.push(_log);
    if (this.logs.length > 200) this.logs.splice(0, this.logs.length - 200);
    console.log('softphone_log', _log);
  }

  getLogs(limit = 200): SoftphoneLogPayload[] {
    const slice = this.logs.slice(-limit);
    // return newest first
    return slice.reverse();
  }
}

export const store = new DataStore();