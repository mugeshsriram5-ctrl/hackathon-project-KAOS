import React, { useState, useEffect } from 'react';
import { sqlDb } from '../lib/sqlDatabase';

interface SqlBackupPanelProps {
  onShowToast: (msg: string) => void;
  onRefreshStats: () => void;
}

export const SqlBackupPanel: React.FC<SqlBackupPanelProps> = ({
  onShowToast,
  onRefreshStats,
}) => {
  const [backupJson, setBackupJson] = useState<string>('');
  const [backupMeta, setBackupMeta] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showFullJson, setShowFullJson] = useState(false);

  useEffect(() => {
    loadDatabaseSnapshot();
  }, []);

  const loadDatabaseSnapshot = () => {
    const data = sqlDb.exportDatabaseJson();
    setBackupMeta(data);
    setBackupJson(JSON.stringify(data, null, 2));
  };

  const handleDownload = () => {
    const result = sqlDb.downloadBackupFile();
    onShowToast(`Downloaded ${result.filename} (${(result.sizeBytes / 1024).toFixed(1)} KB, ${result.recordsCount} records) 💾`);
    loadDatabaseSnapshot();
    onRefreshStats();
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(backupJson);
    setCopied(true);
    onShowToast('Database JSON copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const res = sqlDb.restoreDatabaseJson(parsed);
        if (res.success) {
          onShowToast(`Database Restored! ${res.message} 🔄`);
          loadDatabaseSnapshot();
          onRefreshStats();
        } else {
          onShowToast(`Restore Error: ${res.message}`);
        }
      } catch (err: any) {
        onShowToast(`Invalid JSON file: ${err?.message || 'Parse error'}`);
      } finally {
        setIsRestoring(false);
        // Reset file input
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const tableSummary = [
    { name: 'spots', label: 'Heritage Landmarks', count: backupMeta?.tables?.spots?.length || 0, icon: 'location_on' },
    { name: 'adventures', label: 'Walking Quests', count: backupMeta?.tables?.adventures?.length || 0, icon: 'hiking' },
    { name: 'explorer_progress', label: 'Cartographer Stats', count: backupMeta?.tables?.explorer_progress?.length || 0, icon: 'military_tech' },
    { name: 'passport_stamps', label: 'Passport Stamps', count: backupMeta?.tables?.passport_stamps?.length || 0, icon: 'verified' },
    { name: 'secret_perks', label: 'Secret Counter Perks', count: backupMeta?.tables?.secret_perks?.length || 0, icon: 'redeem' },
  ];

  return (
    <div className="space-y-6 pt-2">
      {/* Top Banner & Quick Download Action */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#1C1A1F] to-cyan-950/40 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-xl">cloud_download</span>
            <h4 className="text-sm font-bold text-white tracking-tight">Offline Database Backup & Export</h4>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              JSON ARCHIVE
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Generate an encrypted snapshot of all offline tables to transfer or preserve your explorer progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Download Backup (.json)</span>
          </button>

          <button
            onClick={handleCopyClipboard}
            className="px-3.5 py-2 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-zinc-400">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>
        </div>
      </div>

      {/* Database Metadata & Table Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {tableSummary.map((tab) => (
          <div
            key={tab.name}
            className="p-3 rounded-2xl bg-[#121114] border border-[#26242C] space-y-1"
          >
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="truncate">{tab.label}</span>
              <span className="material-symbols-outlined text-sm text-cyan-400">{tab.icon}</span>
            </div>
            <p className="text-lg font-bold text-white tabular-nums font-mono">
              {tab.count} <span className="text-xs font-normal text-zinc-500">rows</span>
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">table: {tab.name}</p>
          </div>
        ))}
      </div>

      {/* Snapshot Details Card */}
      <div className="p-4 rounded-2xl bg-[#121114] border border-[#26242C] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <span className="text-zinc-500 block text-[10px]">TOTAL RECORDS</span>
          <span className="text-emerald-400 font-bold text-sm">
            {backupMeta?.metadata?.totalRecords || 0} rows
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[10px]">BACKUP PAYLOAD SIZE</span>
          <span className="text-cyan-400 font-bold text-sm">
            {(new Blob([backupJson]).size / 1024).toFixed(1)} KB
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[10px]">STORAGE ENGINE</span>
          <span className="text-zinc-300 font-bold text-sm">AlaSQL Relational</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[10px]">EXPORT TIMESTAMP</span>
          <span className="text-zinc-300 font-bold text-xs truncate block">
            {backupMeta?.exportedAt ? new Date(backupMeta.exportedAt).toLocaleTimeString() : 'Ready'}
          </span>
        </div>
      </div>

      {/* Restore Database from File Box */}
      <div className="p-4 rounded-2xl bg-[#18161D] border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">upload_file</span>
          </div>
          <div>
            <h5 className="text-xs font-bold text-white">Restore Database from Backup File</h5>
            <p className="text-[11px] text-zinc-400">
              Upload a previously downloaded JSON file to restore spots, completed quests, and stamps.
            </p>
          </div>
        </div>

        <div>
          <label className="px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-bold text-xs cursor-pointer flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-base">restore</span>
            <span>{isRestoring ? 'Restoring...' : 'Upload & Restore (.json)'}</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isRestoring}
            />
          </label>
        </div>
      </div>

      {/* Collapsible Live JSON Inspector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 font-bold text-zinc-300">
            <span className="material-symbols-outlined text-sm text-cyan-400">code</span>
            <span>Live Database JSON Schema & Content</span>
          </div>
          <button
            onClick={() => setShowFullJson(!showFullJson)}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer underline"
          >
            {showFullJson ? 'Show compact excerpt' : 'Expand full JSON view'}
          </button>
        </div>

        <div className="border border-[#26242C] rounded-2xl bg-[#121114] p-3.5 max-h-60 overflow-y-auto font-mono text-[11px] text-zinc-300 leading-relaxed scrollbar-thin">
          <pre className="text-emerald-400/90 whitespace-pre-wrap break-all">
            {showFullJson ? backupJson : backupJson.slice(0, 1200) + '\n\n... [Click "Expand full JSON view" to display all table payloads]'}
          </pre>
        </div>
      </div>
    </div>
  );
};
