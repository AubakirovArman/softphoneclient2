import { AppConfig, ChatIntegrationMessage } from './types';

let appConfig: AppConfig = {
  softphoneUrl: 'http://localhost:8080',
  softphoneSecret: '',
};

export function setAppConfig(cfg: Partial<AppConfig>) {
  appConfig = { ...appConfig, ...cfg };
}

export function getAppConfig(): AppConfig {
  return appConfig;
}

export async function sendToSoftphone(payload: ChatIntegrationMessage) {
  const url = new URL(appConfig.softphoneUrl);
  const endpoint = url.toString().replace(/\/$/, '');
  const qs = appConfig.softphoneSecret ? `?secret=${encodeURIComponent(appConfig.softphoneSecret)}` : '';
  const res = await fetch(`${endpoint}/${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Softphone error ${res.status}: ${text}`);
  }
}

export async function softphoneGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(appConfig.softphoneUrl);
  const endpoint = url.toString().replace(/\/$/, '');
  const u = new URL(`${endpoint}${path}`);
  if (appConfig.softphoneSecret) u.searchParams.set('secret', appConfig.softphoneSecret);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`Softphone GET ${path} failed: ${res.status}`);
  return res;
}

export async function softphonePost(path: string, params: Record<string, string> = {}, body?: any) {
  const url = new URL(appConfig.softphoneUrl);
  const endpoint = url.toString().replace(/\/$/, '');
  const u = new URL(`${endpoint}${path}`);
  if (appConfig.softphoneSecret) u.searchParams.set('secret', appConfig.softphoneSecret);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  
  const options: RequestInit = { method: 'POST' };
  if (body) {
    if (body instanceof File || body instanceof Blob) {
      options.body = body;
      options.headers = { 'Content-Type': 'application/octet-stream' };
    } else {
      options.body = JSON.stringify(body);
      options.headers = { 'Content-Type': 'application/json' };
    }
  }
  
  const res = await fetch(u.toString(), options);
  if (!res.ok) throw new Error(`Softphone POST ${path} failed: ${res.status}`);
  return res;
}

export async function softphoneDelete(path: string, params: Record<string, string> = {}) {
  const url = new URL(appConfig.softphoneUrl);
  const endpoint = url.toString().replace(/\/$/, '');
  const u = new URL(`${endpoint}${path}`);
  if (appConfig.softphoneSecret) u.searchParams.set('secret', appConfig.softphoneSecret);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(u.toString(), { method: 'DELETE' });
  if (!res.ok) throw new Error(`Softphone DELETE ${path} failed: ${res.status}`);
  return res;
}