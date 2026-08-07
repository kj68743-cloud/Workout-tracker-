import { useRef, useState } from 'react';
import { api, API_BASE } from '../api.js';
import { downloadFile, backupToCsv } from '../utils/exportFormat.js';

export default function SettingsScreen({ onReplayOnboarding }) {
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);

  async function handleExportJson() {
    setStatus(null);
    try {
      const data = await api.exportData();
      downloadFile(
        `five-day-split-backup-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(data, null, 2),
        'application/json'
      );
      setStatus({ type: 'ok', text: 'JSON backup downloaded.' });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
  }

  async function handleExportCsv() {
    setStatus(null);
    try {
      const data = await api.exportData();
      downloadFile(
        `five-day-split-backup-${new Date().toISOString().slice(0, 10)}.csv`,
        backupToCsv(data),
        'text/csv'
      );
      setStatus({ type: 'ok', text: 'CSV backup downloaded.' });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm('Importing will replace all logged sets, cardio, streak history, and body metrics on this device with the contents of the file. Continue?')) {
      return;
    }
    setStatus(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await api.importData(data);
      setStatus({ type: 'ok', text: 'Backup restored. Reloading…' });
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setStatus({ type: 'error', text: 'Import failed: ' + err.message });
    }
  }

  return (
    <>
      <header className="app-header">
        <div>
          <h1>More</h1>
          <div className="subtitle">Backup, restore &amp; app info</div>
        </div>
      </header>

      <div className="settings-section">
        <h3>Export your data</h3>
        <p>Download everything you've logged — sets, cardio, weights, streak history, and body metrics.</p>
        <div className="btn-row">
          <button className="btn-secondary" onClick={handleExportJson}>
            Export JSON
          </button>
          <button className="btn-secondary" onClick={handleExportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Restore from backup</h3>
        <p>Import a previously exported JSON file. This replaces the logged data currently on this device.</p>
        <button className="btn-secondary" onClick={handleImportClick}>
          Import JSON backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </div>

      {status && (
        <div
          className="settings-section"
          style={{ color: status.type === 'error' ? 'var(--danger)' : 'var(--complete-text)' }}
        >
          {status.text}
        </div>
      )}

      <div className="settings-section">
        <h3>About</h3>
        <p>Five-Day Split Tracker for Komal. Your data lives on the tracker's server, so it follows you across devices — not just this browser.</p>
        <button className="btn-secondary" onClick={onReplayOnboarding}>
          Show welcome guide again
        </button>
      </div>

      <div className="settings-section">
        <h3>Connection</h3>
        <p style={{ wordBreak: 'break-all' }}>API: {API_BASE}</p>
      </div>
    </>
  );
}
