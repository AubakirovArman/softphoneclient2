import axios from 'axios';

const api = axios.create({
  baseURL: 'http://35.233.3.128/',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer 22331c91-259e-4d91-baa1-42019546982f',
  },
  // важное: любые коды считаем валидными, чтобы axios не кидал Error
  validateStatus: () => true,
});

function safe(data) {
  if (typeof data === 'string') return data;
  try { return JSON.stringify(data); } catch { return String(data); }
}

const payload = {
  type: 'set_config',
  configId: 'b29a3588-03cf-4b2f-a3cb-0adb4e50daf7',
  config: {
    authenticationId: '783830426566',
    registerPassword: 'nf2gCpWDzDaS',
    registerRefresh: 300,
  hostUri: 'sip.sipout.net',
    settings: {
      maxConcurrentCalls: 2,
      vad: 'algorithmic',
      language: 'ru-RU',
      synthesisService: 'google',
      cps: 7,
      phoneValidationEnabled: true,
      use8InsteadOfPlus7: false,
      useIpTrunk: false,
      portRange: { start: 50000, end: 55000 },
    },
  },
};

const res = await api.post('/', payload);
console.log(res.status, safe(res.data)); // ← печатает только статус и ответ
