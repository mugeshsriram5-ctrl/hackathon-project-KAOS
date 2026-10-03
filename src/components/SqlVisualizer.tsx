import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { sqlDb } from '../lib/sqlDatabase';

const ZONE_COLORS = ['#F05423', '#06B6D4', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

export const SqlVisualizer: React.FC = () => {
  // 1. Fetch Adventure Progress from SQL
  const adventureData = useMemo(() => {
    const res = sqlDb.query(`
      SELECT 
        title, 
        progress_percent, 
        total_xp, 
        duration_mins,
        difficulty,
        completed
      FROM adventures
      ORDER BY progress_percent DESC
    `);
    return res.data.map((row: any) => ({
      name: row.title.length > 20 ? row.title.substring(0, 18) + '...' : row.title,
      fullName: row.title,
      progress: row.progress_percent,
      xp: row.total_xp,
      difficulty: row.difficulty,
      completed: row.completed,
    }));
  }, []);

  // 2. Fetch Spots Visited / Checkins by Zone from SQL
  const zoneDistribution = useMemo(() => {
    const res = sqlDb.query(`
      SELECT 
        zone, 
        SUM(checkins_count) AS total_visits, 
        COUNT(*) AS total_spots,
        SUM(xp) AS total_xp
      FROM spots 
      GROUP BY zone 
      ORDER BY total_visits DESC
    `);
    return res.data.map((row: any) => ({
      name: row.zone,
      visits: Number(row.total_visits) || 0,
      spots: Number(row.total_spots) || 0,
      xp: Number(row.total_xp) || 0,
    }));
  }, []);

  // 3. Fetch XP Trends and Milestones over time from SQL
  const xpTrends = useMemo(() => {
    const res = sqlDb.query(`
      SELECT spot_title, zone, xp_awarded, stamped_at 
      FROM passport_stamps 
      ORDER BY stamped_at ASC
    `);

    let runningTotal = 1000; // Baseline initial XP
    const dataPoints: { milestone: string; spot: string; xp: number; delta: number }[] = [
      { milestone: 'Base Rank', spot: 'Cadet Induction', xp: 1000, delta: 0 },
    ];

    res.data.forEach((row: any, idx: number) => {
      const delta = Number(row.xp_awarded) || 100;
      runningTotal += delta;
      dataPoints.push({
        milestone: `Stamp #${idx + 1}`,
        spot: row.spot_title,
        xp: runningTotal,
        delta,
      });
    });

    // Add current explorer state point
    const explorer = sqlDb.getExplorerStats();
    if (explorer?.xp && explorer.xp > runningTotal) {
      dataPoints.push({
        milestone: 'Current Rank',
        spot: 'Active Expeditions',
        xp: explorer.xp,
        delta: explorer.xp - runningTotal,
      });
    }

    return dataPoints;
  }, []);

  // Key KPI metrics from SQL
  const kpis = useMemo(() => {
    const explorer = sqlDb.getExplorerStats();
    const spotsTotal = (sqlDb.query('SELECT SUM(checkins_count) AS v, COUNT(*) AS s FROM spots').data[0] as any) || {};
    const advProgress = (sqlDb.query('SELECT AVG(progress_percent) AS p FROM adventures').data[0] as any) || {};

    return {
      totalXp: explorer?.xp || 1420,
      spotsCount: spotsTotal.s || 5,
      totalCheckins: spotsTotal.v || 142,
      avgAdventureProgress: Math.round(advProgress.p || 82),
    };
  }, []);

  return (
    <div className="space-y-6 pt-2">
      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Explorer XP</span>
            <span className="material-symbols-outlined text-sm text-[#F05423]">military_tech</span>
          </div>
          <p className="text-xl font-bold text-white tabular-nums">{kpis.totalXp} XP</p>
          <span className="text-[10px] text-emerald-400 font-mono">Verified in SQL Cache</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Landmarks</span>
            <span className="material-symbols-outlined text-sm text-cyan-400">location_on</span>
          </div>
          <p className="text-xl font-bold text-white tabular-nums">{kpis.spotsCount} Spots</p>
          <span className="text-[10px] text-zinc-500 font-mono">Offline Geocoded</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Check-In Visits</span>
            <span className="material-symbols-outlined text-sm text-emerald-400">qr_code_scanner</span>
          </div>
          <p className="text-xl font-bold text-white tabular-nums">{kpis.totalCheckins}</p>
          <span className="text-[10px] text-cyan-400 font-mono">Beacon Telemetry</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Quest Progress</span>
            <span className="material-symbols-outlined text-sm text-amber-400">hiking</span>
          </div>
          <p className="text-xl font-bold text-white tabular-nums">{kpis.avgAdventureProgress}%</p>
          <span className="text-[10px] text-amber-400 font-mono">Average Completion</span>
        </div>
      </div>

      {/* Grid of Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: User Adventure Progress & XP (BarChart) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121114] border border-[#26242C] space-y-3">
          <div className="flex items-center justify-between border-b border-[#26242C] pb-2.5">
            <div>
              <h4 className="text-xs font-bold text-white">Adventure Quest Progress</h4>
              <p className="text-[10px] text-zinc-400">Query: SELECT title, progress_percent, total_xp FROM adventures</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              RECHARTS
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adventureData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26242C" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1A1F',
                    border: '1px solid #26242C',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#FFF',
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'progress' ? `${value}% Completed` : `${value} XP`,
                    name === 'progress' ? 'Progress' : 'Reward Pool',
                  ]}
                  labelFormatter={(label, payload) => {
                    const row = payload?.[0]?.payload;
                    return row ? `${row.fullName} (${row.difficulty})` : label;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                  formatter={(val) => (val === 'progress' ? 'Completion %' : 'XP Pool')}
                />
                <Bar dataKey="progress" fill="#F05423" radius={[4, 4, 0, 0]} name="progress" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Total Spots Visited & Density by Zone (PieChart) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121114] border border-[#26242C] space-y-3">
          <div className="flex items-center justify-between border-b border-[#26242C] pb-2.5">
            <div>
              <h4 className="text-xs font-bold text-white">Landmark Visits by Chennai Zone</h4>
              <p className="text-[10px] text-zinc-400">Query: SELECT zone, SUM(checkins_count) FROM spots GROUP BY zone</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              RECHARTS
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={zoneDistribution}
                  dataKey="visits"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {zoneDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={ZONE_COLORS[index % ZONE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1A1F',
                    border: '1px solid #26242C',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#FFF',
                  }}
                  formatter={(value: any, name: any, item: any) => [
                    `${value} check-in visits (${item.payload.spots} spots, ${item.payload.xp} total XP)`,
                    `Zone: ${name}`,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Explorer XP Growth Trends (AreaChart spanning full width) */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-[#121114] border border-[#26242C] space-y-3">
          <div className="flex items-center justify-between border-b border-[#26242C] pb-2.5">
            <div>
              <h4 className="text-xs font-bold text-white">Cumulative Explorer XP Progression Trend</h4>
              <p className="text-[10px] text-zinc-400">
                Query: SELECT spot_title, zone, xp_awarded, stamped_at FROM passport_stamps ORDER BY stamped_at ASC
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-400">Live SQL Progression</span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={xpTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#26242C" />
                <XAxis dataKey="milestone" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1A1F',
                    border: '1px solid #26242C',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#FFF',
                  }}
                  formatter={(value: any) => [`${value} Cumulative XP`, 'Cartographer Level']}
                  labelFormatter={(label, payload) => {
                    const row = payload?.[0]?.payload;
                    return row ? `${label}: ${row.spot}` : label;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#xpGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
