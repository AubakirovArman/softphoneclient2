"use client";
import { useEffect, useState } from 'react';
import { SoftphoneActions } from '@/components/SoftphoneActions';

interface SoftphoneControlProps {
  configs?: Record<string, any>;
}

export function SoftphoneControl({ configs }: SoftphoneControlProps) {
  const [cfgs, setCfgs] = useState<Record<string, any>>(configs || {});
  const [configId, setConfigId] = useState('');
  const [phone, setPhone] = useState('');

  const load = async () => {
    const res = await fetch('/configs');
    const data = await res.json();
    setCfgs(data);
  };

  useEffect(() => { if (!configs) load(); }, []);
  useEffect(() => { if (configs) setCfgs(configs); }, [configs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="label">Config</div>
          <select className="input" value={configId} onChange={(e) => setConfigId(e.target.value)}>
            <option value="">Select config</option>
            {Object.keys(cfgs).map(id => (<option key={id} value={id}>{id}</option>))}
          </select>
        </div>
        <div>
          <div className="label">Phone</div>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="79991234567" />
        </div>
      </div>

  <SoftphoneActions configId={configId} phone={phone} />
    </div>
  );
}