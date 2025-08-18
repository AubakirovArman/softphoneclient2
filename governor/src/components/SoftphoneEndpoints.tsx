"use client";
import { useState, useEffect } from 'react';
import { SoftphoneConfig } from '@/lib/types';
import { softphoneGet, softphonePost, softphoneDelete } from '@/lib/softphoneClient';

export function SoftphoneEndpoints() {
  const [configs, setConfigs] = useState<Record<string, SoftphoneConfig>>({});
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  // Audio management states
  const [audioFiles, setAudioFiles] = useState<string[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [downloadFileName, setDownloadFileName] = useState('');
  
  // Reload SIPs filter
  const [reloadFilter, setReloadFilter] = useState('');

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const res = await fetch('/configs');
        const data = await res.json();
        setConfigs(data);
      } catch (e) {
        console.error('Failed to load configs', e);
      }
    };
    loadConfigs();
  }, []);

  const setLoadingState = (action: string, state: boolean) => {
    setLoading(prev => ({ ...prev, [action]: state }));
  };

  const setResult = (action: string, result: any) => {
    setResults(prev => ({ ...prev, [action]: result }));
  };

  const handleError = (action: string, error: any) => {
    console.error(`${action} error:`, error);
    setResult(action, { error: error.message || String(error) });
  };

  // Status check
  const checkStatus = async () => {
    if (!selectedConfigId) {
      alert('Выберите конфиг');
      return;
    }
    
    setLoadingState('status', true);
    try {
      const res = await softphoneGet('/status', { config_id: selectedConfigId });
      const text = await res.text();
      setResult('status', { status: res.status, body: text });
    } catch (error) {
      handleError('status', error);
    } finally {
      setLoadingState('status', false);
    }
  };

  // Clear queue
  const clearQueue = async () => {
    if (!selectedConfigId) {
      alert('Выберите конфиг');
      return;
    }
    
    setLoadingState('clearQueue', true);
    try {
      const res = await softphoneGet('/clear_queue', { config_id: selectedConfigId });
      const text = await res.text();
      setResult('clearQueue', { status: res.status, body: text });
    } catch (error) {
      handleError('clearQueue', error);
    } finally {
      setLoadingState('clearQueue', false);
    }
  };

  // List audio files
  const listAudio = async () => {
    if (!selectedConfigId) {
      alert('Выберите конфиг');
      return;
    }
    
    setLoadingState('listAudio', true);
    try {
      const res = await softphoneGet('/list_audio', { config_id: selectedConfigId });
      const files = await res.json();
      setAudioFiles(files);
      setResult('listAudio', { status: res.status, files });
    } catch (error) {
      handleError('listAudio', error);
      setAudioFiles([]);
    } finally {
      setLoadingState('listAudio', false);
    }
  };

  // Upload audio file
  const uploadAudio = async () => {
    if (!selectedConfigId) {
      alert('Выберите конфиг');
      return;
    }
    if (!uploadFile) {
      alert('Выберите файл для загрузки');
      return;
    }
    
    const fileName = uploadFileName || uploadFile.name;
    setLoadingState('uploadAudio', true);
    try {
      const res = await softphonePost('/audio', { config_id: selectedConfigId, file_name: fileName }, uploadFile);
      const text = await res.text();
      setResult('uploadAudio', { status: res.status, body: text });
      // Refresh audio list
      listAudio();
    } catch (error) {
      handleError('uploadAudio', error);
    } finally {
      setLoadingState('uploadAudio', false);
    }
  };

  // Delete all audio for config
  const deleteAudio = async () => {
    if (!selectedConfigId) {
      alert('Выберите конфиг');
      return;
    }
    
    if (!confirm('Удалить все аудиофайлы для этого конфига?')) return;
    
    setLoadingState('deleteAudio', true);
    try {
      const res = await softphoneDelete('/audio', { config_id: selectedConfigId });
      const result = await res.json();
      setResult('deleteAudio', { status: res.status, deleted: result.deleted });
      // Refresh audio list
      listAudio();
    } catch (error) {
      handleError('deleteAudio', error);
    } finally {
      setLoadingState('deleteAudio', false);
    }
  };

  // Download audio file
  const downloadAudio = async () => {
    if (!selectedConfigId || !downloadFileName) {
      alert('Выберите конфиг и имя файла');
      return;
    }
    
    setLoadingState('downloadAudio', true);
    try {
      const res = await softphoneGet('/get_audio', { config_id: selectedConfigId, file_name: downloadFileName });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setResult('downloadAudio', { status: res.status, downloaded: downloadFileName });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (error) {
      handleError('downloadAudio', error);
    } finally {
      setLoadingState('downloadAudio', false);
    }
  };

  // Reload SIPs
  const reloadSips = async () => {
    setLoadingState('reloadSips', true);
    try {
      const params: Record<string, string> = reloadFilter ? { filter: reloadFilter } : {};
      const res = await softphonePost('/reload_sips', params);
      const text = await res.text();
      setResult('reloadSips', { status: res.status, body: text });
    } catch (error) {
      handleError('reloadSips', error);
    } finally {
      setLoadingState('reloadSips', false);
    }
  };

  // Get current calls
  const getCurrentCalls = async () => {
    setLoadingState('currentCalls', true);
    try {
      const res = await softphoneGet('/current_calls');
      const calls = await res.json();
      setResult('currentCalls', { status: res.status, calls });
    } catch (error) {
      handleError('currentCalls', error);
    } finally {
      setLoadingState('currentCalls', false);
    }
  };

  const renderResult = (action: string) => {
    const result = results[action];
    if (!result) return null;
    
    return (
      <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
        <div className="font-medium">
          Результат {action}: {result.error ? '❌' : '✅'}
        </div>
        {result.error && (
          <div className="text-red-600 mt-1">Ошибка: {result.error}</div>
        )}
        {result.status && (
          <div className="text-gray-600">HTTP {result.status}</div>
        )}
        {result.body && (
          <pre className="mt-1 text-xs whitespace-pre-wrap">{result.body}</pre>
        )}
        {result.files && (
          <div className="mt-1">
            <div className="font-medium">Файлы:</div>
            <ul className="list-disc list-inside">
              {result.files.map((file: string, idx: number) => (
                <li key={idx} className="text-xs">{file}</li>
              ))}
            </ul>
          </div>
        )}
        {result.calls && (
          <div className="mt-1">
            <div className="font-medium">Текущие звонки:</div>
            <pre className="text-xs">{JSON.stringify(result.calls, null, 2)}</pre>
          </div>
        )}
        {typeof result.deleted === 'number' && (
          <div className="mt-1">Удалено файлов: {result.deleted}</div>
        )}
        {result.downloaded && (
          <div className="mt-1">Скачан файл: {result.downloaded}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Config Selection */}
      <div className="card">
        <div className="text-base font-semibold text-black mb-3">Выбор конфига</div>
        <select 
          className="input w-full" 
          value={selectedConfigId} 
          onChange={(e) => setSelectedConfigId(e.target.value)}
        >
          <option value="">Выберите конфиг</option>
          {Object.keys(configs).map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      {/* Status & Control */}
      <div className="card">
        <div className="text-base font-semibold text-black mb-3">Статус и управление</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <button 
              className="btn w-full" 
              onClick={checkStatus}
              disabled={loading.status || !selectedConfigId}
            >
              {loading.status ? 'Проверяю...' : 'Проверить статус'}
            </button>
            {renderResult('status')}
          </div>
          
          <div>
            <button 
              className="btn-outline w-full" 
              onClick={clearQueue}
              disabled={loading.clearQueue || !selectedConfigId}
            >
              {loading.clearQueue ? 'Очищаю...' : 'Очистить очередь'}
            </button>
            {renderResult('clearQueue')}
          </div>
          
          <div>
            <button 
              className="btn w-full" 
              onClick={getCurrentCalls}
              disabled={loading.currentCalls}
            >
              {loading.currentCalls ? 'Получаю...' : 'Текущие звонки'}
            </button>
            {renderResult('currentCalls')}
          </div>
        </div>
      </div>

      {/* Audio Management */}
      <div className="card">
        <div className="text-base font-semibold text-black mb-3">Управление аудиофайлами</div>
        
        {/* List audio files */}
        <div className="mb-4">
          <button 
            className="btn" 
            onClick={listAudio}
            disabled={loading.listAudio || !selectedConfigId}
          >
            {loading.listAudio ? 'Загружаю...' : 'Список файлов'}
          </button>
          {renderResult('listAudio')}
        </div>

        {/* Upload audio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Файл для загрузки
            </label>
            <input
              type="file"
              accept=".wav,audio/wav"
              className="input"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя файла (опционально)
            </label>
            <input
              type="text"
              className="input"
              placeholder="hello.wav"
              value={uploadFileName}
              onChange={(e) => setUploadFileName(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              className="btn w-full" 
              onClick={uploadAudio}
              disabled={loading.uploadAudio || !selectedConfigId || !uploadFile}
            >
              {loading.uploadAudio ? 'Загружаю...' : 'Загрузить'}
            </button>
          </div>
        </div>
        {renderResult('uploadAudio')}

        {/* Download audio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя файла для скачивания
            </label>
            <input
              type="text"
              className="input"
              placeholder="hello.wav"
              value={downloadFileName}
              onChange={(e) => setDownloadFileName(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              className="btn-outline w-full" 
              onClick={downloadAudio}
              disabled={loading.downloadAudio || !selectedConfigId || !downloadFileName}
            >
              {loading.downloadAudio ? 'Скачиваю...' : 'Скачать файл'}
            </button>
          </div>
        </div>
        {renderResult('downloadAudio')}

        {/* Delete all audio */}
        <div>
          <button 
            className="btn-danger" 
            onClick={deleteAudio}
            disabled={loading.deleteAudio || !selectedConfigId}
          >
            {loading.deleteAudio ? 'Удаляю...' : 'Удалить все аудио'}
          </button>
          {renderResult('deleteAudio')}
        </div>
      </div>

      {/* SIP Management */}
      <div className="card">
        <div className="text-base font-semibold text-black mb-3">Управление SIP</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фильтр для перезагрузки (опционально)
            </label>
            <input
              type="text"
              className="input"
              placeholder="1111"
              value={reloadFilter}
              onChange={(e) => setReloadFilter(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              className="btn w-full" 
              onClick={reloadSips}
              disabled={loading.reloadSips}
            >
              {loading.reloadSips ? 'Перезагружаю...' : 'Перезагрузить SIP'}
            </button>
          </div>
        </div>
        {renderResult('reloadSips')}
      </div>
    </div>
  );
}