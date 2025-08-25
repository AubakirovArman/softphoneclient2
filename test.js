// npm i axios dotenv uuid
import 'dotenv/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const BASE = 'http://35.233.3.128';
const BEARER = '22331c91-259e-4d91-baa1-42019546982f';

const api = axios.create({
  baseURL: BASE + '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(BEARER ? { Authorization: `Bearer ${BEARER}` } : {}),
  },
});

export async function setConfig({
  configId,
  authenticationId,
  registerPassword,
  domainHost,
  domainPort = 5060,
  callerId,
  settings = {},
}) {
  const payload = {
    type: 'set_config', // ВАЖНО: snake_case
    configId,
    config: {
      authenticationId,
      registerPassword,
      registerRefresh: 300,
      hostUri: domainHost ? `${domainHost}${domainPort ? `:${domainPort}` : ''}` : undefined,
      ...(callerId ? { callerId } : {}),
      settings: {
        maxConcurrentCalls: 1,
        vad: 'algorithmic',
        language: 'ru-RU',
        synthesisService: 'google',
        cps: 7,
        phoneValidationEnabled: true,
        use8InsteadOfPlus7: false,
        useIpTrunk: false,
        portRange: { start: 50000, end: 55000 },
        ...settings,
      },
    },
  };
  const { data } = await api.post('/', payload);
  return data;
}

export async function say({ configId, phone, text, dialogId }) {
  const payload = {
    type: 'say',
    configId,
    phone,
    messageId: uuidv4(),
    message: { text },
    ...(dialogId ? { dialogId } : {}),
  };
  const { data } = await api.post('/', payload);
  return data;
}

export async function hangUp({ configId, phone }) {
  const { data } = await api.post('/', { type: 'hang_up', configId, phone });
  return data;
}

export async function dtmf({ configId, phone, digits, repeatCount = 1 }) {
  const payload = { type: 'dtmf', configId, phone, dtmf: digits, repeatCount };
  const { data } = await api.post('/', payload);
  return data;
}

export async function transfer({ configId, phone, targetUri, referredBy }) {
  const payload = { type: 'transfer', configId, phone, targetUri, ...(referredBy ? { referredBy } : {}) };
  const { data } = await api.post('/', payload);
  return data;
}

export async function clearQueue({ configId }) {
  const payload = { type: 'clear_queue', configId };
  const { data } = await api.post('/', payload);
  return data;
}

export async function currentCalls() {
  const { data } = await api.get('/current_calls');
  return data; // { "<configId>": number, ... }
}

// --- мини-демо запуска по прямому вызову файла ---
if (import.meta.main) {
  const configId = 'b29a3588-03cf-4b2f-a3cb-0adb4e50daf7';
  await setConfig({
    configId,
    authenticationId: '783830426566',
    registerPassword: 'nf2gCpWDzDaS',
  domainHost: 'sip.sipout.net',
  domainPort: 5060,
    callerId: '+77010000000',
    settings: { maxConcurrentCalls: 2 },
  });
  console.log('set_config OK');

  // пример исходящего вызова: софтфон сам позвонит и озвучит фразу
  await say({ configId, phone: '+77011234567', text: 'Привет! Тест связи.' });
  console.log('say OK');
}