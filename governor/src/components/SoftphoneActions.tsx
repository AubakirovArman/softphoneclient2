"use client";
import { useState, useEffect } from 'react';
import { ChatIntegrationMessage, BotMessage, SoftphoneConfig } from '@/lib/types';

interface SoftphoneActionsProps {
  configId: string;
  phone: string;
}

export function SoftphoneActions({ configId, phone }: SoftphoneActionsProps) {
  const [messageText, setMessageText] = useState('');
  const [messageUrl, setMessageUrl] = useState('');
  const [dtmfSequence, setDtmfSequence] = useState('');
  const [dtmfRepeat, setDtmfRepeat] = useState(1);
  const [transferUri, setTransferUri] = useState('');
  const [messageId, setMessageId] = useState('');
  const [cfgs, setCfgs] = useState<Record<string, SoftphoneConfig>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/configs');
        const data = await res.json();
        setCfgs(data);
      } catch (e) {
        console.error('Failed to load configs', e);
      }
    };
    load();
  }, []);

  const send = async (payload: ChatIntegrationMessage) => {
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      alert(`Ошибка: ${res.status} ${text}`);
    }
  };

  const generateMessageId = () => `m-${Date.now()}`;

  const sendSayText = () => {
    if (!messageText.trim()) {
      alert('Введите текст сообщения');
      return;
    }
    const id = messageId || generateMessageId();
    send({
      type: 'say',
      configId,
      phone,
      messageId: id,
      message: { text: messageText }
    });
  };

  const sendSayUrl = () => {
    if (!messageUrl.trim()) {
      alert('Введите URL аудиофайла');
      return;
    }
    const id = messageId || generateMessageId();
    send({
      type: 'say',
      configId,
      phone,
      messageId: id,
      message: { url: messageUrl }
    });
  };

  const sendHangUp = () => {
    send({ type: 'hangUp', configId, phone });
  };

  const sendClearQueue = () => {
    send({ type: 'clearQueue', configId });
  };

  const sendDtmf = () => {
    if (!dtmfSequence.trim()) {
      alert('Введите DTMF последовательность');
      return;
    }
    send({ type: 'dtmf', configId, phone, dtmf: dtmfSequence, repeatCount: dtmfRepeat });
  };

  const sendTransfer = () => {
    if (!transferUri.trim()) {
      alert('Укажите целевой URI перевода');
      return;
    }
    send({ type: 'transfer', configId, phone, targetUri: transferUri });
  };

  const sendSetConfig = () => {
    const cfg = cfgs[configId];
    if (!configId) {
      alert('Выберите configId');
      return;
    }
    if (!cfg) {
      alert('Конфиг не найден в локальном списке. Перейдите на вкладку Configs и сохраните конфиг с таким ID.');
      return;
    }
    const payload: ChatIntegrationMessage = { type: 'setConfig', configId, config: cfg } as const;
    send(payload);
  };

  const sendRemoveConfig = () => {
    if (!configId) {
      alert('Выберите configId');
      return;
    }
    const payload: ChatIntegrationMessage = { type: 'removeConfig', configId } as const;
    send(payload);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Команды софтфона</h3>
      
      {/* Say Commands */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 border-b pb-2">Воспроизведение</h4>
        
        {/* Say Text */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Текст сообщения
            </label>
            <input
              type="text"
              className="input"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Привет! Вы позвонили в поддержку."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message ID (опционально)
            </label>
            <input
              type="text"
              className="input"
              value={messageId}
              onChange={(e) => setMessageId(e.target.value)}
              placeholder="Автогенерация"
            />
          </div>
          <button
            className="btn"
            onClick={sendSayText}
            disabled={!configId || !phone}
          >
            Проиграть текст
          </button>
        </div>

        {/* Say URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL аудиофайла
            </label>
            <input
              type="url"
              className="input"
              value={messageUrl}
              onChange={(e) => setMessageUrl(e.target.value)}
              placeholder="https://example.com/hello.wav"
            />
          </div>
          <button
            className="btn"
            onClick={sendSayUrl}
            disabled={!configId || !phone}
          >
            Проиграть аудио
          </button>
        </div>
      </div>

      {/* Call Control */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 border-b pb-2">Управление звонком</h4>
        
        <div className="flex gap-3 flex-wrap">
          <button
            className="btn-outline"
            onClick={sendHangUp}
            disabled={!configId || !phone}
          >
            Завершить звонок
          </button>
          
          <button
            className="btn-outline"
            onClick={sendClearQueue}
            disabled={!configId}
          >
            Очистить очередь
          </button>
        </div>
      </div>

      {/* DTMF */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 border-b pb-2">DTMF</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Последовательность
            </label>
            <input
              type="text"
              className="input"
              value={dtmfSequence}
              onChange={(e) => setDtmfSequence(e.target.value)}
              placeholder="123#*"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Повторы
            </label>
            <input
              type="number"
              className="input"
              min={0}
              max={255}
              value={dtmfRepeat}
              onChange={(e) => setDtmfRepeat(parseInt(e.target.value || '0', 10))}
            />
          </div>
          <button
            className="btn-outline"
            onClick={sendDtmf}
            disabled={!configId || !phone || !dtmfSequence}
          >
            Отправить DTMF
          </button>
        </div>
      </div>

      {/* Transfer */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 border-b pb-2">Перевод звонка</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Целевой URI
            </label>
            <input
              type="text"
              className="input"
              value={transferUri}
              onChange={(e) => setTransferUri(e.target.value)}
              placeholder="tel:+78005553535 или sip:user@domain.com"
            />
          </div>
          <button
            className="btn-outline"
            onClick={sendTransfer}
            disabled={!configId || !phone}
          >
            Перевести звонок
          </button>
        </div>
      </div>

      {/* Config Management */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 border-b pb-2">Регистрация SIP-конфига</h4>
        <div className="flex gap-3 flex-wrap">
          <button
            className="btn"
            onClick={sendSetConfig}
            disabled={!configId}
          >
            Зарегистрировать сейчас (setConfig)
          </button>
          <button
            className="btn-outline"
            onClick={sendRemoveConfig}
            disabled={!configId}
          >
            Удалить конфиг (removeConfig)
          </button>
        </div>
        <div className="text-xs text-gray-500">
          Для setConfig конфиг берётся из локального списка на вкладке Configs (ID: {configId || '—'}).
        </div>
      </div>
    </div>
  );
}