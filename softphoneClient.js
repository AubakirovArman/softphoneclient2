// try-text.js
// npm i axios
import axios from 'axios';

const BASE   = 'http://35.233.3.128/';
const TOKEN  = '22331c91-259e-4d91-baa1-42019546982f';
const CONFIG = '091e84de-44e0-44ed-b039-14ed454fde0d';
const PHONE  = '+77024986032';
const TEXT   = 'привет это арман как ты';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
  validateStatus: () => true,
  timeout: 10000,
});

const safe = (d) => typeof d === 'string' ? d : JSON.stringify(d);

for (const type of ['say', 'call']) {
  const body = { type, configId: CONFIG, phone: PHONE, messageId: 'm-' + Date.now(), text: TEXT };
  const r = await api.post('/', body);
  console.log(`${type} (top-level text) →`, r.status, safe(r.data).slice(0, 200));
  if (r.status >= 200 && r.status < 300) break; // сработало — стоп
}
