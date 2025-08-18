"use client";
import { useEffect, useState } from 'react';
import { Tabs } from '@/components/Tabs';
import { ConfigForm } from '@/components/ConfigForm';
import { SoftphoneControl } from '@/components/SoftphoneControl';
import { SoftphoneEndpoints } from '@/components/SoftphoneEndpoints';

export default function Page() {
  const [active, setActive] = useState('configs');
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [softphoneUrl, setSoftphoneUrl] = useState('http://localhost:8080');
  const [secret, setSecret] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch('/api/admin/configs');
    const data = await res.json();
    setConfigs(data);
    const cfgRes = await fetch('/api/app_config');
    const cfg = await cfgRes.json();
    setSoftphoneUrl(cfg.softphoneUrl);
  };

  useEffect(() => { load(); }, []);

  // Poll logs when Logs tab is active
  useEffect(() => {
    if (active !== 'logs') return;
    let cancelled = false;
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        const data = await res.json();
        if (!cancelled) setLogs(data);
      } catch (e) {
        // ignore
      }
    };
    fetchLogs();
    const t = setInterval(fetchLogs, 2000);
    return () => { cancelled = true; clearInterval(t); };
  }, [active]);

  const remove = async (id: string) => {
    await fetch(`/api/admin/configs?configId=${id}`, { method: 'DELETE' });
    load();
  };

  const saveAppCfg = async () => {
    await fetch('/api/app_config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ softphoneUrl, softphoneSecret: secret }) });
    setSecret('');
  };

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="grow">
            <div className="label">Softphone Base URL</div>
            <input className="input" value={softphoneUrl} onChange={(e) => setSoftphoneUrl(e.target.value)} placeholder="http://SOFTPHONE_IP:PORT" />
          </div>
          <div className="grow">
            <div className="label">Secret (query)</div>
            <input className="input" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="optional secret" />
          </div>
          <button className="btn" onClick={saveAppCfg}>Save</button>
        </div>
      </div>

      <Tabs
        tabs={[{ id: 'configs', label: 'Configs' }, { id: 'control', label: 'Softphone Control' }, { id: 'special', label: 'Special Endpoints' }, { id: 'logs', label: 'Logs' }]}
        active={active}
        onChange={setActive}
      />

      {active === 'configs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="text-base font-semibold text-black mb-3">{editingId ? 'Edit Config' : 'Add / Update Config'}</div>
            <ConfigForm onSaved={() => { load(); setEditingId(null); }} initialId={editingId ?? undefined} initialConfig={editingId ? (configs as any)[editingId] : undefined} />
          </div>
          <div className="card">
            <div className="text-base font-semibold text-black mb-3">Existing Configs</div>
            <div className="space-y-4">
              {Object.keys(configs).length === 0 && <div className="text-black">No configs yet</div>}
              {Object.entries(configs).map(([id, cfg]) => {
                const config = cfg as any;
                const hostInfo = config.hostUri?.hostUri || 
                  (config.hostUri?.domainHost ? `${config.hostUri.domainHost}:${config.hostUri.domainPort}` : 'Not set');
                const proxyInfo = config.proxyUri?.proxyUri || 
                  (config.proxyUri?.proxy ? `${config.proxyUri.proxy.host}:${config.proxyUri.proxy.port}` : 'Not set');
                
                return (
                  <div key={id} className="border border-gray-200 hover:border-gray-300 rounded-lg p-4 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex-1">
                         <div className="text-sm font-mono text-black font-medium">{id}</div>
                         <div className="text-xs text-gray-600">Config ID</div>
                       </div>
                       <div className="flex items-center gap-2">
                         {editingId === id ? (
                           <button className="btn-outline text-sm" onClick={() => setEditingId(null)}>Cancel</button>
                         ) : (
                           <button className="btn-outline text-sm" onClick={() => setEditingId(id)}>Edit</button>
                         )}
                         <button className="btn-danger text-sm" onClick={() => remove(id)}>Delete</button>
                       </div>
                     </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Обязательные поля */}
                      <div className="space-y-2">
                        <div className="font-medium text-black">Обязательные поля:</div>
                        <div>
                          <span className="text-gray-600">Authentication ID:</span>
                          <span className="ml-2 text-black font-mono">{config.authenticationId}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Password:</span>
                          <span className="ml-2 text-black">***</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Host URI:</span>
                          <span className="ml-2 text-black font-mono">{hostInfo}</span>
                        </div>
                      </div>
                      
                      {/* Опциональные поля */}
                      <div className="space-y-2">
                        <div className="font-medium text-black">Опциональные поля:</div>
                        {config.callerId && (
                          <div>
                            <span className="text-gray-600">Caller ID:</span>
                            <span className="ml-2 text-black font-mono">{config.callerId}</span>
                          </div>
                        )}
                        {config.authenticationUri && (
                          <div>
                            <span className="text-gray-600">Auth URI:</span>
                            <span className="ml-2 text-black font-mono text-xs">{config.authenticationUri}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Proxy URI:</span>
                          <span className="ml-2 text-black font-mono text-xs">{proxyInfo}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Register Refresh:</span>
                          <span className="ml-2 text-black">{config.registerRefresh || 300}s</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Настройки */}
                    {config.settings && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="font-medium text-black text-sm mb-2">Настройки:</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {config.settings.language && (
                            <div>
                              <span className="text-gray-600">Language:</span>
                              <span className="ml-1 text-black">{config.settings.language}</span>
                            </div>
                          )}
                          {config.settings.synthesisService && (
                            <div>
                              <span className="text-gray-600">TTS:</span>
                              <span className="ml-1 text-black">{config.settings.synthesisService}</span>
                            </div>
                          )}
                          {config.settings.vad && (
                            <div>
                              <span className="text-gray-600">VAD:</span>
                              <span className="ml-1 text-black">{config.settings.vad}</span>
                            </div>
                          )}
                          {config.settings.maxConcurrentCalls && (
                            <div>
                              <span className="text-gray-600">Max Calls:</span>
                              <span className="ml-1 text-black">{config.settings.maxConcurrentCalls}</span>
                            </div>
                          )}
                          {config.settings.cps && (
                            <div>
                              <span className="text-gray-600">CPS:</span>
                              <span className="ml-1 text-black">{config.settings.cps}</span>
                            </div>
                          )}
                          {typeof config.settings.phoneValidationEnabled === 'boolean' && (
                            <div>
                              <span className="text-gray-600">Phone Validation:</span>
                              <span className="ml-1 text-black">{config.settings.phoneValidationEnabled ? 'Yes' : 'No'}</span>
                            </div>
                          )}
                          {config.settings.portRange && (
                            <div>
                              <span className="text-gray-600">Port Range:</span>
                              <span className="ml-1 text-black font-mono">{config.settings.portRange.start}-{config.settings.portRange.end}</span>
                            </div>
                          )}
                          {config.settings.stunServer && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600">STUN:</span>
                              <span className="ml-1 text-black font-mono">{config.settings.stunServer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {active === 'control' && (
        <div className="card">
          <SoftphoneControl />
        </div>
      )}

      {active === 'special' && (
        <div className="card">
          <SoftphoneEndpoints />
        </div>
      )}

      {active === 'logs' && (
        <div className="card">
          <div className="text-base font-semibold text-black mb-3">Softphone Logs</div>
          <div className="space-y-2 max-h-[400px] overflow-auto text-sm">
            {logs.length === 0 && <div className="text-black">No logs yet</div>}
            {logs.map((l, idx) => {
              const ev = l.event;
              let summary = 'Unknown';
              if (ev?.DialStarted) summary = 'DialStarted';
              if (ev?.DialEnded) {
                const r = ev.DialEnded.result;
                summary = `DialEnded: ${typeof r === 'string' ? r : r?.Failure ? `Failure ${r.Failure.code}` : 'Unknown'}`;
              }
              return (
                <div key={idx} className="border border-gray-200 rounded p-3">
                  <div className="text-black font-mono text-xs">{l.timestamp}</div>
                  <div className="text-black">task_id: {l.task_id}</div>
                  <div className="text-black">{summary}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
