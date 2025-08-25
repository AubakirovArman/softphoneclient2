import { AppConfig, ChatIntegrationMessage } from './types';

let appConfig: AppConfig = {
  softphoneUrl: 'http://35.233.3.128',
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
  const targetUrl = `${endpoint}/${qs}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (appConfig.softphoneBearer) headers['Authorization'] = `Bearer ${appConfig.softphoneBearer}`;

  // Map camelCase action types to snake_case expected by softphone backend
  // and normalize legacy hostUri shapes for set_config
  const mappedPayload: any = (() => {
    const copy = JSON.parse(JSON.stringify(payload));
    const typeMap: Record<string, string> = {
      setConfig: 'set_config',
      removeConfig: 'remove_config',
      clearQueue: 'clear_queue',
      hangUp: 'hang_up',
    };
    const origType = (copy as any).type as string;
    const mappedType = typeMap[origType] ?? origType;
    (copy as any).type = mappedType;

    // hostUri normalization for set_config
    if (mappedType === 'set_config') {
      const h = (copy as any).config?.hostUri;
      if (h && typeof h === 'object') {
        if ('hostUri' in h) (copy as any).config.hostUri = h.hostUri;
        else if ('domainHost' in h) (copy as any).config.hostUri = `${h.domainHost}${h.domainPort ? `:${h.domainPort}` : ''}`;
      }
    }
    return copy;
  })();

  // Log outgoing request (mask sensitive)
  try {
    // Avoid logging full bearer/secret
    const maskedHeaders = { ...headers };
    if (maskedHeaders.Authorization) maskedHeaders.Authorization = 'Bearer ***';
    const logUrl = qs ? `${endpoint}/?secret=***` : targetUrl;
    console.log('[softphone] Request POST', logUrl);
    console.log('[softphone] Headers', maskedHeaders);
  console.log('[softphone] Body', JSON.stringify(mappedPayload));
  } catch {}

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(mappedPayload),
  });
  if (!res.ok) {
    const text = await res.text();
    // Log response on error
    try { console.error('[softphone] Response error', res.status, text); } catch {}
    throw new Error(`Softphone error ${res.status}: ${text}`);
  }
  try { console.log('[softphone] Response OK', res.status); } catch {}
}

export async function softphoneGet(path: string, params: Record<string, string> = {}) {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    // Use server proxy to avoid CORS
    const u = new URL('/api/softphone', window.location.origin);
    u.searchParams.set('path', path);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return fetch(u.toString());
  } else {
    const url = new URL(appConfig.softphoneUrl);
    const endpoint = url.toString().replace(/\/$/, '');
    const u = new URL(`${endpoint}${path}`);
    if (appConfig.softphoneSecret) u.searchParams.set('secret', appConfig.softphoneSecret);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    const headers: Record<string, string> = {};
    if (appConfig.softphoneBearer) headers['Authorization'] = `Bearer ${appConfig.softphoneBearer}`;
    try {
      const maskedHeaders = { ...headers };
      if (maskedHeaders.Authorization) maskedHeaders.Authorization = 'Bearer ***';
      const logUrl = u.toString().replace(/(secret=)([^&]+)/, '$1***');
      console.log('[softphone] Request GET', logUrl, maskedHeaders);
    } catch {}
    const res = await fetch(u.toString(), { headers });
    if (!res.ok) throw new Error(`Softphone GET ${path} failed: ${res.status}`);
    return res;
  }
}

export async function softphonePost(path: string, params: Record<string, string> = {}, body?: any) {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    // Proxy via Next.js API to avoid CORS and keep credentials server-side
    const u = new URL('/api/softphone', window.location.origin);
    u.searchParams.set('path', path);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    const options: RequestInit = { method: 'POST' };
    if (body) {
      if (body instanceof File || body instanceof Blob) {
        options.body = body as any;
        (options.headers as any) = { 'Content-Type': 'application/octet-stream' };
      } else {
        options.body = JSON.stringify(body);
        (options.headers as any) = { 'Content-Type': 'application/json' };
      }
    }
    return fetch(u.toString(), options);
  } else {
    const url = new URL(appConfig.softphoneUrl);
    const endpoint = url.toString().replace(/\/$/, '');
    const u = new URL(`${endpoint}${path}`);
    if (appConfig.softphoneSecret) u.searchParams.set('secret', appConfig.softphoneSecret);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    
    const options: RequestInit = { method: 'POST' };
    if (body) {
      if (body instanceof File || body instanceof Blob) {
        options.body = body as any;
        options.headers = { 'Content-Type': 'application/octet-stream' } as any;
      } else {
        options.body = JSON.stringify(body);
        options.headers = { 'Content-Type': 'application/json' } as any;
      }
    }
    (options.headers as any) = (options.headers as any) || {};
    if (appConfig.softphoneBearer) (options.headers as any)['Authorization'] = `Bearer ${appConfig.softphoneBearer}`;
    try {
      const maskedHeaders: any = { ...(options.headers as any) };
      if (maskedHeaders.Authorization) maskedHeaders.Authorization = 'Bearer ***';
      const logUrl = u.toString().replace(/(secret=)([^&]+)/, '$1***');
      console.log('[softphone] Request POST', logUrl, maskedHeaders);
      if (options.body && typeof options.body !== 'string') {
        console.log('[softphone] Body: <binary or form-data>');
      } else if (typeof options.body === 'string') {
        console.log('[softphone] Body', options.body);
      }
    } catch {}
    
    const res = await fetch(u.toString(), options);
    if (!res.ok) throw new Error(`Softphone POST ${path} failed: ${res.status}`);
    return res;
  }
}

export async function softphoneDelete(path: string, params: Record<string, string> = {}) {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    const u = new URL('/api/softphone', window.location.origin);
    u.searchParams.set('path', path);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return fetch(u.toString(), { method: 'DELETE' });
  } else {
    const url = new URL(appConfig.softphoneUrl);
    const endpoint = url.toString().replace(/\/$/, '');
    const u = new URL(`${endpoint}${path}`);
    if (appConfig.softphoneSecret) u.searchParams.set('secret', appConfig.softphoneSecret);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    const res = await fetch(u.toString(), { method: 'DELETE' });
    if (!res.ok) throw new Error(`Softphone DELETE ${path} failed: ${res.status}`);
    return res;
  }
}

// Helper for webhook replies: send 'say' with top-level text (variant used by your softphone build)
export async function sayText(args: { configId: string; phone: string; text: string; dialogId?: string }) {
  const url = new URL(appConfig.softphoneUrl);
  const endpoint = url.toString().replace(/\/$/, '');
  const u = new URL(`${endpoint}/`);
  if (appConfig.softphoneSecret) u.searchParams.set('secret', appConfig.softphoneSecret);

  const payload: any = {
    type: 'say',
    configId: args.configId,
    phone: args.phone,
    messageId: 'm-' + Date.now(),
    text: args.text,
  };
  if (args.dialogId) payload.dialogId = args.dialogId;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (appConfig.softphoneBearer) headers['Authorization'] = `Bearer ${appConfig.softphoneBearer}`;
  try {
    const maskedHeaders = { ...headers };
    if (maskedHeaders.Authorization) maskedHeaders.Authorization = 'Bearer ***';
    const logUrl = u.toString().replace(/(secret=)([^&]+)/, '$1***');
    console.log('[softphone] sayText POST', logUrl, maskedHeaders);
    console.log('[softphone] sayText Body', JSON.stringify(payload));
  } catch {}

  const res = await fetch(u.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Softphone say failed: ${res.status} ${text}`);
  }
}