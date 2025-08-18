"use client";
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SoftphoneConfig } from '@/lib/types';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const schema = z.object({
  configId: z.string().uuid({ message: "Необходим валидный UUID" }),
  authenticationId: z.string().min(1, "Обязательное поле"),
  registerPassword: z.string().min(1, "Обязательное поле"),
  authenticationUri: z.string().optional(),
  registerRefresh: z.coerce.number().int().min(1).optional(),
  callerId: z.string().optional(),
  
  // hostUri options
  hostUriType: z.enum(['single', 'domain']),
  hostUri: z.string().optional(),
  domainHost: z.string().optional(),
  domainPort: z.coerce.number().int().min(1).max(65535).optional(),
  
  // proxyUri options
  proxyUriType: z.enum(['uri', 'host_port']),
  proxyUri: z.string().optional(),
  proxyHost: z.string().optional(),
  proxyPort: z.coerce.number().int().min(1).max(65535).optional(),
  
  // settings
  maxConcurrentCalls: z.coerce.number().int().min(1).optional(),
  vad: z.enum(['algorithmic', 'streaming']).optional(),
  language: z.string().optional(),
  synthesisService: z.enum(['yandex', 'google', 'elevenLabs']).optional(),
  cps: z.coerce.number().int().min(1).optional(),
  additionalRecognitionTime: z.coerce.number().int().min(0).optional(),
  elevenlabsVoice: z.string().optional(),
  phoneValidationEnabled: z.boolean().optional(),
  use8InsteadOfPlus7: z.boolean().optional(),
  schedulerUrl: z.string().optional(),
  backendUrl: z.string().optional(),
  useIpTrunk: z.boolean().optional(),
  portRangeStart: z.coerce.number().int().min(1024).max(65535).optional(),
  portRangeEnd: z.coerce.number().int().min(1024).max(65535).optional(),
  stunServer: z.string().optional(),
  
  // Yandex settings
  yandexFolderId: z.string().optional(),
  yandexServiceAccountId: z.string().optional(),
  yandexServiceAccountKeyId: z.string().optional(),
  yandexPemKey: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ConfigForm({ onSaved, initialId, initialConfig }: { onSaved: () => void; initialId?: string; initialConfig?: SoftphoneConfig }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      configId: uuidv4(),
      hostUriType: 'single',
      proxyUriType: 'uri',
      vad: 'algorithmic',
      synthesisService: 'yandex',
      phoneValidationEnabled: true,
      use8InsteadOfPlus7: false,
      useIpTrunk: false,
      registerRefresh: 300,
      portRangeStart: 50000,
      portRangeEnd: 55000,
    }
  });

  useEffect(() => {
    if (!initialConfig || !initialId) return;
    const cfg = initialConfig;
    // базовые
    setValue('configId', initialId);
    setValue('authenticationId', cfg.authenticationId);
    setValue('registerPassword', cfg.registerPassword);
    if (cfg.authenticationUri) setValue('authenticationUri', cfg.authenticationUri);
    if (cfg.registerRefresh) setValue('registerRefresh', cfg.registerRefresh);
    if (cfg.callerId) setValue('callerId', cfg.callerId);

    // hostUri
    if (cfg.hostUri && 'hostUri' in cfg.hostUri) {
      setValue('hostUriType', 'single');
      setValue('hostUri', cfg.hostUri.hostUri);
    } else if (cfg.hostUri && 'domainHost' in cfg.hostUri) {
      setValue('hostUriType', 'domain');
      setValue('domainHost', (cfg.hostUri as any).domainHost);
      setValue('domainPort', (cfg.hostUri as any).domainPort);
    }

    // proxyUri
    if (cfg.proxyUri && 'proxyUri' in cfg.proxyUri) {
      setValue('proxyUriType', 'uri');
      setValue('proxyUri', cfg.proxyUri.proxyUri);
    } else if (cfg.proxyUri && 'proxy' in cfg.proxyUri) {
      setValue('proxyUriType', 'host_port');
      setValue('proxyHost', (cfg.proxyUri as any).proxy.host);
      setValue('proxyPort', (cfg.proxyUri as any).proxy.port);
    }

    // settings
    if (cfg.settings) {
      const s = cfg.settings as any;
      if (s.maxConcurrentCalls != null) setValue('maxConcurrentCalls', s.maxConcurrentCalls);
      if (s.vad) setValue('vad', s.vad);
      if (s.language) setValue('language', s.language);
      if (s.synthesisService) setValue('synthesisService', s.synthesisService);
      if (s.cps != null) setValue('cps', s.cps);
      if (s.additionalRecognitionTime != null) setValue('additionalRecognitionTime', s.additionalRecognitionTime);
      if (s.elevenlabsVoice) setValue('elevenlabsVoice', s.elevenlabsVoice);
      if (s.phoneValidationEnabled != null) setValue('phoneValidationEnabled', s.phoneValidationEnabled);
      if (s.use8InsteadOfPlus7 != null) setValue('use8InsteadOfPlus7', s.use8InsteadOfPlus7);
      if (s.useIpTrunk != null) setValue('useIpTrunk', s.useIpTrunk);
      if (s.stunServer) setValue('stunServer', s.stunServer);
      if (s.portRange) {
        setValue('portRangeStart', s.portRange.start);
        setValue('portRangeEnd', s.portRange.end);
      }
      if (s.endpoints) {
        if (s.endpoints.schedulerUrl) setValue('schedulerUrl', s.endpoints.schedulerUrl);
        if (s.endpoints.backendUrl) setValue('backendUrl', s.endpoints.backendUrl);
      }
      if (s.yandexSubaccount) {
        setValue('yandexFolderId', s.yandexSubaccount.folderId);
        setValue('yandexServiceAccountId', s.yandexSubaccount.serviceAccountId);
        setValue('yandexServiceAccountKeyId', s.yandexSubaccount.serviceAccountKeyId);
        setValue('yandexPemKey', s.yandexSubaccount.pemKey);
      }
    }
    setShowAdvanced(true);
  }, [initialConfig, initialId, setValue]);

  const hostUriType = watch('hostUriType');
  const proxyUriType = watch('proxyUriType');
  const synthesisService = watch('synthesisService');

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const cfg: SoftphoneConfig = {
      authenticationId: data.authenticationId,
      registerPassword: data.registerPassword,
    };

    // Optional basic fields
    if (data.authenticationUri) cfg.authenticationUri = data.authenticationUri;
    if (data.registerRefresh) cfg.registerRefresh = data.registerRefresh;
    if (data.callerId) cfg.callerId = data.callerId;

    // hostUri
    if (data.hostUriType === 'single' && data.hostUri) {
      cfg.hostUri = { hostUri: data.hostUri };
    } else if (data.hostUriType === 'domain' && data.domainHost && data.domainPort) {
      cfg.hostUri = { domainHost: data.domainHost, domainPort: data.domainPort };
    }

    // proxyUri
    if (data.proxyUriType === 'uri' && data.proxyUri) {
      cfg.proxyUri = { proxyUri: data.proxyUri };
    } else if (data.proxyUriType === 'host_port' && data.proxyHost && data.proxyPort) {
      cfg.proxyUri = { proxy: { host: data.proxyHost, port: data.proxyPort } };
    }

    // settings
    const settings: any = {};
    if (data.maxConcurrentCalls) settings.maxConcurrentCalls = data.maxConcurrentCalls;
    if (data.vad) settings.vad = data.vad;
    if (data.language) settings.language = data.language;
    if (data.synthesisService) settings.synthesisService = data.synthesisService;
    if (data.cps) settings.cps = data.cps;
    if (data.additionalRecognitionTime) settings.additionalRecognitionTime = data.additionalRecognitionTime;
    if (data.elevenlabsVoice) settings.elevenlabsVoice = data.elevenlabsVoice;
    if (typeof data.phoneValidationEnabled === 'boolean') settings.phoneValidationEnabled = data.phoneValidationEnabled;
    if (typeof data.use8InsteadOfPlus7 === 'boolean') settings.use8InsteadOfPlus7 = data.use8InsteadOfPlus7;
    if (typeof data.useIpTrunk === 'boolean') settings.useIpTrunk = data.useIpTrunk;
    if (data.stunServer) settings.stunServer = data.stunServer;

    if (data.portRangeStart && data.portRangeEnd) {
      settings.portRange = { start: data.portRangeStart, end: data.portRangeEnd };
    }

    if (data.schedulerUrl || data.backendUrl) {
      settings.endpoints = {};
      if (data.schedulerUrl) settings.endpoints.schedulerUrl = data.schedulerUrl;
      if (data.backendUrl) settings.endpoints.backendUrl = data.backendUrl;
    }

    // Yandex subaccount
    if (data.yandexFolderId && data.yandexServiceAccountId && data.yandexServiceAccountKeyId && data.yandexPemKey) {
      settings.yandexSubaccount = {
        folderId: data.yandexFolderId,
        serviceAccountId: data.yandexServiceAccountId,
        serviceAccountKeyId: data.yandexServiceAccountKeyId,
        pemKey: data.yandexPemKey,
      };
    }

    if (Object.keys(settings).length > 0) {
      cfg.settings = settings;
    }

    await fetch('/api/admin/configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId: data.configId, config: cfg }),
    });
    reset();
    setValue('configId', uuidv4());
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Кнопка очистки при редактировании */}
      {(initialId && initialConfig) && (
        <div className="flex justify-end">
          <button
            type="button"
            className="btn-outline text-xs"
            onClick={() => { reset(); setShowAdvanced(false); setValue('configId', uuidv4()); }}
          >Очистить форму</button>
        </div>
      )}
      {/* Базовые обязательные поля */}
      <div>
        <div className="label flex items-center justify-between">
          <span>Config ID (UUID) *</span>
          {!initialId && (
            <button type="button" className="btn-outline text-xs" onClick={() => setValue('configId', uuidv4())}>
              Сгенерировать
            </button>
          )}
        </div>
        <input className="input" placeholder="00000000-0000-0000-0000-000000000000" {...register('configId')} />
        {errors.configId && <div className="text-red-600 text-xs mt-1">{errors.configId.message}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="label">Authentication ID (SIP логин) *</div>
          <input className="input" placeholder="1001" {...register('authenticationId')} />
          {errors.authenticationId && <div className="text-red-600 text-xs mt-1">{errors.authenticationId.message}</div>}
        </div>
        <div>
          <div className="label">Register Password (пароль) *</div>
          <input className="input" type="password" placeholder="secret" {...register('registerPassword')} />
          {errors.registerPassword && <div className="text-red-600 text-xs mt-1">{errors.registerPassword.message}</div>}
        </div>
      </div>

      {/* Опциональные базовые поля */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="label">Authentication URI</div>
          <input className="input" placeholder="sip:realm.example.com" {...register('authenticationUri')} />
        </div>
        <div>
          <div className="label">Register Refresh (сек)</div>
          <input className="input" type="number" placeholder="300" {...register('registerRefresh')} />
        </div>
        <div>
          <div className="label">Caller ID</div>
          <input className="input" placeholder="+77010001122" {...register('callerId')} />
        </div>
      </div>

      {/* Host URI конфигурация */}
      <div className="space-y-3">
        <div className="label">Host URI Configuration</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select className="input" {...register('hostUriType')}>
              <option value="single">Single URI</option>
              <option value="domain">Domain + Port</option>
            </select>
          </div>
          {hostUriType === 'single' ? (
            <div className="md:col-span-2">
              <input className="input" placeholder="sip.example.com" {...register('hostUri')} />
            </div>
          ) : (
            <>
              <div>
                <input className="input" placeholder="domain.example.com" {...register('domainHost')} />
              </div>
              <div>
                <input className="input" type="number" placeholder="5060" {...register('domainPort')} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Proxy URI конфигурация */}
      <div className="space-y-3">
        <div className="label">Proxy URI Configuration</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select className="input" {...register('proxyUriType')}>
              <option value="uri">URI</option>
              <option value="host_port">Host + Port</option>
            </select>
          </div>
          {proxyUriType === 'uri' ? (
            <div className="md:col-span-2">
              <input className="input" placeholder="sip:proxy.example.com" {...register('proxyUri')} />
            </div>
          ) : (
            <>
              <div>
                <input className="input" placeholder="proxy.example.com" {...register('proxyHost')} />
              </div>
              <div>
                <input className="input" type="number" placeholder="5060" {...register('proxyPort')} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Расширенные настройки */}
      <div className="space-y-4">
        <button type="button" className="btn-outline" onClick={() => setShowAdvanced(v => !v)}>
          {showAdvanced ? 'Скрыть расширенные настройки' : 'Показать расширенные настройки'}
        </button>
        {showAdvanced && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="label">Max Concurrent Calls</div>
                <input className="input" type="number" placeholder="10" {...register('maxConcurrentCalls')} />
              </div>
              <div>
                <div className="label">VAD</div>
                <select className="input" {...register('vad')}>
                  <option value="algorithmic">algorithmic</option>
                  <option value="streaming">streaming</option>
                </select>
              </div>
              <div>
                <div className="label">Language</div>
                <input className="input" placeholder="ru-RU" {...register('language')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="label">Synthesis Service</div>
                <select className="input" {...register('synthesisService')}>
                  <option value="yandex">yandex</option>
                  <option value="google">google</option>
                  <option value="elevenLabs">elevenLabs</option>
                </select>
              </div>
              <div>
                <div className="label">CPS</div>
                <input className="input" type="number" placeholder="1" {...register('cps')} />
              </div>
              <div>
                <div className="label">Additional Recognition Time (ms)</div>
                <input className="input" type="number" placeholder="0" {...register('additionalRecognitionTime')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="label">ElevenLabs Voice ID</div>
                <input className="input" placeholder="voice-id" {...register('elevenlabsVoice')} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" {...register('phoneValidationEnabled')} />
                <span className="text-sm">Phone Validation Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" {...register('use8InsteadOfPlus7')} />
                <span className="text-sm">Use 8 instead of +7</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="label">Use IP Trunk</div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" {...register('useIpTrunk')} />
                  <span className="text-sm">Enabled</span>
                </div>
              </div>
              <div>
                <div className="label">STUN Server</div>
                <input className="input" placeholder="stun:stun.l.google.com:19302" {...register('stunServer')} />
              </div>
              <div />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="label">Port Range Start</div>
                <input className="input" type="number" placeholder="50000" {...register('portRangeStart')} />
              </div>
              <div>
                <div className="label">Port Range End</div>
                <input className="input" type="number" placeholder="55000" {...register('portRangeEnd')} />
              </div>
              <div />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="label">Scheduler URL</div>
                <input className="input" placeholder="http://scheduler" {...register('schedulerUrl')} />
              </div>
              <div>
                <div className="label">Backend URL</div>
                <input className="input" placeholder="http://backend" {...register('backendUrl')} />
              </div>
            </div>

            {/* Yandex настройки */}
            {synthesisService === 'yandex' && (
              <div className="space-y-3 border-t pt-4">
                <div className="text-sm font-medium text-black">Yandex Subaccount</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="label">Folder ID</div>
                    <input className="input" placeholder="folder-id" {...register('yandexFolderId')} />
                  </div>
                  <div>
                    <div className="label">Service Account ID</div>
                    <input className="input" placeholder="service-account-id" {...register('yandexServiceAccountId')} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="label">Service Account Key ID</div>
                    <input className="input" placeholder="key-id" {...register('yandexServiceAccountKeyId')} />
                  </div>
                  <div>
                    <div className="label">PEM Key</div>
                    <textarea className="input" rows={3} placeholder="-----BEGIN PRIVATE KEY-----..." {...register('yandexPemKey')} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button className="btn" type="submit">Сохранить конфигурацию</button>
    </form>
  );
}