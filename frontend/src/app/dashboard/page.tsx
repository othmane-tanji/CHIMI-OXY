'use client';

import { useEffect, useState, useMemo } from 'react';
import { Users, Building2, Truck, Receipt, Calendar, TrendingUp, BarChart2 } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { formatDate, formatMoney } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Compute SVG chart coordinates dynamically
  const chartsData = useMemo(() => {
    if (!stats || !stats.historiqueMois || !stats.historiqueMois.length) return null;

    const hist = stats.historiqueMois;
    
    // 1. Sales & Purchases Trend calculations
    const maxVal = Math.max(
      ...hist.map((h: any) => h.ventesOxyral),
      ...hist.map((h: any) => h.ventesChimiral),
      ...hist.map((h: any) => h.achats),
      10000 // Fallback minimum scale
    );

    const width = 600;
    const height = 220;
    const pad = 40;
    const plotW = width - 2 * pad;
    const plotH = height - 2 * pad;

    const count = hist.length;
    const div = count > 1 ? count - 1 : 1;

    const oxyPoints = hist.map((h: any, i: number) => ({
      x: pad + (i / div) * plotW,
      y: pad + plotH - (h.ventesOxyral / maxVal) * plotH,
    }));
    const oxyPath = 'M ' + oxyPoints.map((p: any) => `${p.x},${p.y}`).join(' L ');
    const oxyArea = oxyPoints.length > 0
      ? oxyPath + ` L ${oxyPoints[oxyPoints.length - 1].x},${pad + plotH} L ${oxyPoints[0].x},${pad + plotH} Z`
      : '';

    const chimPoints = hist.map((h: any, i: number) => ({
      x: pad + (i / div) * plotW,
      y: pad + plotH - (h.ventesChimiral / maxVal) * plotH,
    }));
    const chimPath = 'M ' + chimPoints.map((p: any) => `${p.x},${p.y}`).join(' L ');
    const chimArea = chimPoints.length > 0
      ? chimPath + ` L ${chimPoints[chimPoints.length - 1].x},${pad + plotH} L ${chimPoints[0].x},${pad + plotH} Z`
      : '';

    const achatPoints = hist.map((h: any, i: number) => ({
      x: pad + (i / div) * plotW,
      y: pad + plotH - (h.achats / maxVal) * plotH,
    }));
    const achatPath = 'M ' + achatPoints.map((p: any) => `${p.x},${p.y}`).join(' L ');

    // 2. Leave Volume Chart calculations
    const maxConges = Math.max(...hist.map((h: any) => h.conges), 5);
    const leaveW = 320;
    const leaveH = 180;
    const leavePad = 30;
    const leavePlotW = leaveW - 2 * leavePad;
    const leavePlotH = leaveH - 2 * leavePad;

    const bars = hist.map((h: any, i: number) => {
      const barH = (h.conges / maxConges) * leavePlotH;
      const barW = 20;
      const x = leavePad + (i / div) * leavePlotW - barW / 2;
      const y = leavePad + leavePlotH - barH;
      return { x, y, w: barW, h: barH, count: h.conges, label: h.nom.split(' ')[0] };
    });

    return {
      maxVal,
      width,
      height,
      pad,
      plotW,
      plotH,
      oxyPoints,
      oxyPath,
      oxyArea,
      chimPoints,
      chimPath,
      chimArea,
      achatPoints,
      achatPath,
      maxConges,
      bars,
      leaveW,
      leaveH,
      leavePad,
    };
  }, [stats]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Chargement...</div>;
  }

  // Calculate percentages for employee breakdown
  const totalEmployes = (stats?.nbEmployesOxyral ?? 0) + (stats?.nbEmployesChimiral ?? 0);
  const pctOxy = totalEmployes > 0 ? Math.round((stats.nbEmployesOxyral / totalEmployes) * 100) : 50;
  const pctChim = totalEmployes > 0 ? Math.round((stats.nbEmployesChimiral / totalEmployes) * 100) : 50;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de l'activité Oxyral & Chimiral"
      />

      {/* Grid of stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Employés" value={stats?.nbEmployes ?? 0} icon={Users} />
        <StatCard
          title="Clients"
          value={stats?.nbClients ?? 0}
          icon={Building2}
          color="bg-emerald-600"
        />
        <StatCard
          title="Fournisseurs"
          value={stats?.nbFournisseurs ?? 0}
          icon={Truck}
          color="bg-amber-600"
        />
        <StatCard
          title="Factures du mois"
          value={stats?.facturesMois ?? 0}
          icon={Receipt}
          color="bg-purple-600"
        />
        <StatCard
          title="Congés en cours"
          value={stats?.congesEnCours ?? 0}
          icon={Calendar}
          color="bg-rose-600"
        />
      </div>

      {/* Rich Charts Section */}
      {chartsData && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main sales trends chart */}
          <div className="card lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-brand-600" size={20} />
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                  Évolution de l'Activité Commerciale (MAD)
                </h3>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                  <span className="h-2.5 w-2.5 rounded bg-blue-500" /> Ventes OXYRAL
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Ventes CHIMIRAL
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  <span className="h-2.5 w-0.5 border-l-2 border-dashed border-amber-500" /> Achats
                </span>
              </div>
            </div>

            <div className="relative pt-2">
              <svg
                viewBox={`0 0 ${chartsData.width} ${chartsData.height}`}
                className="w-full overflow-visible"
              >
                <defs>
                  <linearGradient id="oxyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="chimGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line
                  x1={chartsData.pad}
                  y1={chartsData.pad}
                  x2={chartsData.width - chartsData.pad}
                  y2={chartsData.pad}
                  className="stroke-gray-100 dark:stroke-gray-800"
                  strokeWidth="1"
                />
                <line
                  x1={chartsData.pad}
                  y1={chartsData.pad + chartsData.plotH / 2}
                  x2={chartsData.width - chartsData.pad}
                  y2={chartsData.pad + chartsData.plotH / 2}
                  className="stroke-gray-100 dark:stroke-gray-800"
                  strokeWidth="1"
                />
                <line
                  x1={chartsData.pad}
                  y1={chartsData.pad + chartsData.plotH}
                  x2={chartsData.width - chartsData.pad}
                  y2={chartsData.pad + chartsData.plotH}
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeWidth="1.5"
                />

                {/* Y-Axis Labels */}
                <text
                  x={chartsData.pad - 8}
                  y={chartsData.pad + 4}
                  textAnchor="end"
                  className="fill-gray-400 dark:fill-gray-500 text-[9px] font-medium"
                >
                  {formatMoney(chartsData.maxVal)}
                </text>
                <text
                  x={chartsData.pad - 8}
                  y={chartsData.pad + chartsData.plotH / 2 + 4}
                  textAnchor="end"
                  className="fill-gray-400 dark:fill-gray-500 text-[9px] font-medium"
                >
                  {formatMoney(chartsData.maxVal / 2)}
                </text>
                <text
                  x={chartsData.pad - 8}
                  y={chartsData.pad + chartsData.plotH + 4}
                  textAnchor="end"
                  className="fill-gray-400 dark:fill-gray-500 text-[9px] font-medium"
                >
                  0
                </text>

                {/* Areas & Lines */}
                <path d={chartsData.oxyArea} fill="url(#oxyGrad)" />
                <path d={chartsData.chimArea} fill="url(#chimGrad)" />

                <path
                  d={chartsData.oxyPath}
                  fill="none"
                  className="stroke-blue-500"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={chartsData.chimPath}
                  fill="none"
                  className="stroke-emerald-500"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={chartsData.achatPath}
                  fill="none"
                  className="stroke-amber-500"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  strokeLinecap="round"
                />

                {/* Data Points circles */}
                {chartsData.oxyPoints.map((p: any, idx: number) => (
                  <circle
                    key={`o-${idx}`}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    className="fill-white stroke-blue-500"
                    strokeWidth="2"
                  />
                ))}
                {chartsData.chimPoints.map((p: any, idx: number) => (
                  <circle
                    key={`c-${idx}`}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    className="fill-white stroke-emerald-500"
                    strokeWidth="2"
                  />
                ))}

                {/* X-Axis Labels */}
                {stats.historiqueMois.map((h: any, i: number) => (
                  <text
                    key={`lbl-${i}`}
                    x={chartsData.pad + (i / 5) * chartsData.plotW}
                    y={chartsData.height - chartsData.pad + 16}
                    textAnchor="middle"
                    className="fill-gray-500 dark:fill-gray-400 text-[9px] font-semibold"
                  >
                    {h.nom}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Leave Volume chart */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 dark:border-gray-800">
              <BarChart2 className="text-brand-600" size={20} />
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                Volume des Congés (Jours pris)
              </h3>
            </div>

            <div className="relative flex justify-center pt-2">
              <svg
                viewBox={`0 0 ${chartsData.leaveW} ${chartsData.leaveH}`}
                className="w-full max-w-[280px] overflow-visible"
              >
                {/* Grid Lines */}
                <line
                  x1={chartsData.leavePad}
                  y1={chartsData.leavePad + (chartsData.leaveH - 2 * chartsData.leavePad)}
                  x2={chartsData.leaveW - chartsData.leavePad}
                  y2={chartsData.leavePad + (chartsData.leaveH - 2 * chartsData.leavePad)}
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeWidth="1.5"
                />

                {/* Columns */}
                {chartsData.bars.map((bar: any, idx: number) => (
                  <g key={`bar-${idx}`} className="group cursor-pointer">
                    <rect
                      x={bar.x}
                      y={bar.y}
                      width={bar.w}
                      height={bar.h}
                      rx="3"
                      className="fill-rose-500/80 hover:fill-rose-500 transition duration-150"
                    />
                    {/* Tooltip value */}
                    <text
                      x={bar.x + bar.w / 2}
                      y={bar.y - 6}
                      textAnchor="middle"
                      className="fill-rose-600 dark:fill-rose-400 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
                      {bar.count} j
                    </text>
                    {/* X Label */}
                    <text
                      x={bar.x + bar.w / 2}
                      y={chartsData.leaveH - chartsData.leavePad + 14}
                      textAnchor="middle"
                      className="fill-gray-500 dark:fill-gray-400 text-[9px] font-medium"
                    >
                      {bar.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Employees breakdown & Leaves en cours double grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Employees breakdown comparison */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Répartition des Employés par Société
          </h2>
          <div className="space-y-4 pt-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-blue-600 dark:text-blue-400">OXYRAL ({stats?.nbEmployesOxyral ?? 0})</span>
              <span className="text-emerald-600 dark:text-emerald-400">CHIMIRAL ({stats?.nbEmployesChimiral ?? 0})</span>
            </div>
            
            {/* Progress bar */}
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-150 dark:bg-gray-800">
              <div
                style={{ width: `${pctOxy}%` }}
                className="bg-blue-500 transition-all duration-500"
              />
              <div
                style={{ width: `${pctChim}%` }}
                className="bg-emerald-500 transition-all duration-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center text-xs text-gray-500 dark:text-gray-400">
              <div className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800/40">
                <p className="font-semibold text-lg text-blue-600 dark:text-blue-400">{pctOxy}%</p>
                <p>Oxyral S.A.R.L</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800/40">
                <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">{pctChim}%</p>
                <p>Chimiral S.A.R.L</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaves en cours list */}
        {stats?.congesEnCoursListe?.length > 0 && (
          <div className="card">
            <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">Congés en cours</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="table-th">Employé</th>
                    <th className="table-th">Société</th>
                    <th className="table-th">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.congesEnCoursListe.map((c: any) => (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="table-td font-medium">{c.employe}</td>
                      <td className="table-td">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.societe === 'OXYRAL'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}
                        >
                          {c.societe}
                        </span>
                      </td>
                      <td className="table-td">{formatDate(c.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
