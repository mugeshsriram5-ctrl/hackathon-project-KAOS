import React, { useState, useEffect } from 'react';
import { sqlDb, SqlQueryResult } from '../lib/sqlDatabase';
import { SqlVisualizer } from './SqlVisualizer';
import { SqlBackupPanel } from './SqlBackupPanel';
import { KaosAppIcon } from './KaosAppIcon';

interface SqlExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

const PRESET_QUERIES = [
  {
    name: 'Zone Summary & XP Pool',
    sql: 'SELECT zone, COUNT(*) AS spots_count, SUM(xp) AS total_xp, AVG(xp) AS average_xp FROM spots GROUP BY zone ORDER BY total_xp DESC',
  },
  {
    name: 'Top Visited Landmarks',
    sql: 'SELECT title, zone, xp, checkins_count, architectural_style FROM spots ORDER BY checkins_count DESC',
  },
  {
    name: 'Available Secret Perks',
    sql: "SELECT place_name, zone, perk_title, secret_code, perk_value FROM secret_perks WHERE status = 'available'",
  },
  {
    name: 'Explorer Passport Ledger',
    sql: 'SELECT * FROM passport_stamps ORDER BY stamped_at DESC',
  },
  {
    name: 'Active Walking Adventures',
    sql: 'SELECT title, zone, duration_mins, distance_km, total_xp, progress_percent FROM adventures',
  },
  {
    name: 'Global Leaderboard Ranks',
    sql: 'SELECT username, title, xp, streak, zone FROM global_explorers ORDER BY xp DESC LIMIT 10',
  },
  {
    name: 'Recent Search Telemetry',
    sql: 'SELECT query, category, target_title, timestamp FROM search_history ORDER BY searched_at DESC LIMIT 10',
  },
];

export const SqlExplorerModal: React.FC<SqlExplorerModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'console' | 'backup'>('visualizer');
  const [queryText, setQueryText] = useState(PRESET_QUERIES[0].sql);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [tableStats, setTableStats] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      sqlDb.init();
      setTableStats(sqlDb.getTableStats());
      handleRunQuery(PRESET_QUERIES[0].sql);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunQuery = (sqlToRun?: string) => {
    const text = sqlToRun || queryText;
    if (!text.trim()) return;
    const res = sqlDb.query(text);
    setResult(res);
    setTableStats(sqlDb.getTableStats());
    if (res.success) {
      onShowToast(`SQL Query executed in ${res.executionTimeMs}ms (${res.rowCount} rows) ⚡`);
    } else {
      onShowToast(`SQL Error: ${res.error}`);
    }
  };

  const handleQuickExport = () => {
    const backupRes = sqlDb.downloadBackupFile();
    onShowToast(`Exported ${backupRes.filename} (${backupRes.recordsCount} records) 💾`);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C1A1F] border border-[#26242C] w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto flex flex-col cursor-default"
      >
        {/* Modal Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#26242C] pb-4">
          <div className="flex items-center gap-3">
            <KaosAppIcon size={38} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  KAOS Deep SQL Intelligence Engine
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  OFFLINE SQL PERSISTENCE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                In-browser relational database, Recharts telemetry & JSON backup export
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {/* Quick 1-Click Backup Export Button */}
            <button
              onClick={handleQuickExport}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Quick download database snapshot as JSON"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-[#121114] border border-[#26242C] rounded-xl">
              <button
                onClick={() => setActiveTab('visualizer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'visualizer'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                <span>Visuals</span>
              </button>

              <button
                onClick={() => setActiveTab('console')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'console'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">terminal</span>
                <span>SQL Terminal</span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'backup'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">backup</span>
                <span>Backup / Export</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#26242C] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TAB 1: Visual Analytics (Recharts) */}
        {activeTab === 'visualizer' && <SqlVisualizer />}

        {/* TAB 2: Backup & Export Database */}
        {activeTab === 'backup' && (
          <SqlBackupPanel
            onShowToast={onShowToast}
            onRefreshStats={() => setTableStats(sqlDb.getTableStats())}
          />
        )}

        {/* TAB 3: SQL Console & Query Runner */}
        {activeTab === 'console' && (
          <div className="space-y-5">
            {/* Live Relational Schema Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {tableStats.map((t) => (
                <div
                  key={t.name}
                  onClick={() => {
                    const s = `SELECT * FROM ${t.name} LIMIT 20`;
                    setQueryText(s);
                    handleRunQuery(s);
                  }}
                  className="p-2.5 rounded-xl bg-[#121114] border border-[#26242C] hover:border-cyan-500/50 cursor-pointer transition-all space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-cyan-400 font-bold">{t.name}</span>
                    <span className="text-zinc-400 font-bold tabular-nums">{t.rows}</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 truncate">{t.desc}</p>
                </div>
              ))}
            </div>

            {/* Query Presets Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Preset SQL Queries</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_QUERIES.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setQueryText(p.sql);
                      handleRunQuery(p.sql);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      queryText === p.sql
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-[#121114] border-[#26242C] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SQL Editor Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>SQL Statement</span>
                <span className="font-mono text-[11px] text-cyan-400">Full ANSI SQL Support</span>
              </div>

              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                rows={3}
                className="w-full bg-[#121114] border border-[#26242C] rounded-2xl p-3.5 font-mono text-xs text-emerald-400 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Type any SQL query: SELECT, INSERT, UPDATE, GROUP BY, ORDER BY..."
              />

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => handleRunQuery()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  <span>Execute SQL</span>
                </button>

                {result && (
                  <span className="text-xs font-mono text-zinc-400">
                    {result.rowCount} rows · {result.executionTimeMs} ms
                  </span>
                )}
              </div>
            </div>

            {/* Results Table */}
            {result && (
              <div className="space-y-2 flex-1 min-h-[160px]">
                {result.error ? (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono">
                    {result.error}
                  </div>
                ) : result.data.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#121114] border border-[#26242C] text-zinc-400 text-xs text-center font-mono">
                    0 rows returned. (Mutation executed successfully or empty set)
                  </div>
                ) : (
                  <div className="border border-[#26242C] rounded-2xl overflow-x-auto max-h-72 bg-[#121114]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-[#1C1A1F] border-b border-[#26242C] text-cyan-400">
                          {(result.columns || []).map((col) => (
                            <th key={col} className="p-3 font-bold uppercase tracking-wider whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#26242C]/50 text-zinc-300">
                        {result.data.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#1C1A1F]/50 transition-colors">
                            {(result.columns || []).map((col) => (
                              <td key={col} className="p-3 whitespace-nowrap">
                                {typeof row[col] === 'boolean'
                                  ? row[col] ? 'TRUE' : 'FALSE'
                                  : typeof row[col] === 'object'
                                  ? JSON.stringify(row[col])
                                  : String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SqlExplorerModal;
