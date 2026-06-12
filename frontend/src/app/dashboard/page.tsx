'use client';

import { useEffect, useState } from 'react';
import { Users, Building2, Truck, Receipt, Calendar } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { formatDate } from '@/lib/utils';

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

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Chargement...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de l'activité Oxyral & Chimiral"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      {stats?.congesEnCoursListe?.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Congés en cours</h2>
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
  );
}
