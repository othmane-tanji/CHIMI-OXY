'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { congesApi, employesApi } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { formatDate, MOIS } from '@/lib/utils';

function isDimanche(dateStr: string): boolean {
  return new Date(dateStr).getDay() === 0;
}

export default function CongesPage() {
  const anneeCourante = new Date().getFullYear();
  const moisCourant = new Date().getMonth() + 1;

  const [conges, setConges] = useState<any[]>([]);
  const [employes, setEmployes] = useState<any[]>([]);
  const [soldes, setSoldes] = useState<any[]>([]);
  const [soldesPeriode, setSoldesPeriode] = useState<{ mois: number; annee: number } | null>(null);
  const [resumeMensuel, setResumeMensuel] = useState<any>(null);
  const [solde, setSolde] = useState<any>(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');

  // Filtres du tableau des absences
  const [tableEmploye, setTableEmploye] = useState('');
  const [tableMois, setTableMois] = useState(String(moisCourant));
  const [tableAnnee, setTableAnnee] = useState(String(anneeCourante));

  const [formEmploye, setFormEmploye] = useState('');
  const [formSolde, setFormSolde] = useState<any>(null);
  const [formMotif, setFormMotif] = useState('');
  const [formDate, setFormDate] = useState('');
  const [datesSelectionnees, setDatesSelectionnees] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const tableParams: { employeId?: number; mois?: number; annee?: number } = {
      mois: +tableMois,
      annee: +tableAnnee,
    };
    if (tableEmploye) tableParams.employeId = +tableEmploye;

    const [congesData, soldesData] = await Promise.all([
      congesApi.getAll(tableParams),
      congesApi.getSoldes(moisCourant, anneeCourante),
    ]);
    setConges(congesData);
    setSoldes(soldesData.employes);
    setSoldesPeriode({ mois: soldesData.mois, annee: soldesData.annee });

    if (tableEmploye) {
      const [soldeData, resume] = await Promise.all([
        congesApi.getSolde(+tableEmploye),
        congesApi.getResumeMensuel(+tableEmploye, +tableAnnee),
      ]);
      setSolde(soldeData);
      setResumeMensuel(resume);
    } else {
      setSolde(null);
      setResumeMensuel(null);
    }
  }, [tableEmploye, tableMois, tableAnnee, moisCourant, anneeCourante]);

  useEffect(() => {
    employesApi.getAll().then(setEmployes);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormEmployeChange = async (id: string) => {
    setFormEmploye(id);
    setFormSolde(id ? await congesApi.getSolde(+id) : null);
  };

  const ajouterDate = () => {
    if (!formDate) return;
    if (isDimanche(formDate)) {
      setError('Les dimanches ne sont pas comptabilisés.');
      return;
    }
    if (datesSelectionnees.includes(formDate)) {
      setError('Ce jour est déjà sélectionné.');
      return;
    }
    setDatesSelectionnees([...datesSelectionnees, formDate].sort());
    setFormDate('');
    setError('');
  };

  const retirerDate = (date: string) => {
    setDatesSelectionnees(datesSelectionnees.filter((d) => d !== date));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (datesSelectionnees.length === 0) {
      setError('Sélectionnez au moins un jour d\'absence.');
      return;
    }
    try {
      await congesApi.create({
        employeId: +formEmploye,
        dates: datesSelectionnees,
        motif: formMotif || undefined,
      });
      setModal(false);
      setFormEmploye('');
      setFormSolde(null);
      setFormMotif('');
      setDatesSelectionnees([]);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce jour de congé ?')) return;
    await congesApi.remove(id);
    loadData();
  };

  const moisFiltre = resumeMensuel?.mois?.find(
    (m: any) => m.mois === +tableMois,
  );

  const employeFiltreLabel = tableEmploye
    ? employes.find((e) => String(e.id) === tableEmploye)
    : null;

  return (
    <div>
      <PageHeader
        title="Gestion des congés"
        description="Sélection des jours exacts d'absence · 18j/an (>1 an) · 9j/an (<1 an)"
        action={
          <button
            onClick={() => {
              setModal(true);
              setError('');
              setDatesSelectionnees([]);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Ajouter des jours
          </button>
        }
      />

      {/* Soldes de tous les employés (mois sélectionné) */}
      {soldesPeriode && (
        <p className="mb-3 text-sm text-gray-500">
          Soldes pour{' '}
          <strong>
            {MOIS.find((m) => m.value === soldesPeriode.mois)?.label}{' '}
            {soldesPeriode.annee}
          </strong>
          {' '}— jours pris = absences de ce mois uniquement
        </p>
      )}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {soldes.map((s) => (
          <button
            key={s.employeId}
            onClick={() => setTableEmploye(String(s.employeId))}
            className={`card text-left transition hover:border-brand-500 ${
              tableEmploye === String(s.employeId)
                ? 'border-brand-500 ring-2 ring-brand-500/20'
                : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {s.prenom} {s.nom}
                </p>
                <p className="text-xs text-gray-500">{s.societe}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">
                  {s.soldeRestant}j
                </p>
                <p className="text-xs text-gray-500">disponibles</p>
              </div>
            </div>
            <div className="mt-2 flex gap-3 text-xs text-gray-500">
              <span>Droit : {s.soldeInitial}j</span>
              <span>Pris ce mois : {s.joursConsommes}j</span>
            </div>
          </button>
        ))}
      </div>

      {/* Résumé employé sélectionné (via filtre tableau) */}
      {solde && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-3 font-semibold">
              Solde — {solde.employe.prenom} {solde.employe.nom}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Droit annuel</p>
                <p className="text-xl font-bold text-brand-600">
                  {solde.soldeInitial}j
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Consommés</p>
                <p className="text-xl font-bold text-amber-600">
                  {solde.joursConsommes}j
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Disponibles</p>
                <p className="text-xl font-bold text-emerald-600">
                  {solde.soldeRestant}j
                </p>
              </div>
            </div>
            {moisFiltre && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                <span className="text-gray-500">
                  {MOIS.find((m) => m.value === +tableMois)?.label}{' '}
                  {tableAnnee} :
                </span>{' '}
                <strong>{moisFiltre.joursAbsents} jour(s) absent(s)</strong>
              </div>
            )}
          </div>

          {resumeMensuel && (
            <div className="card overflow-x-auto">
              <h3 className="mb-3 font-semibold">
                Récapitulatif mensuel {tableAnnee}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="table-th">Mois</th>
                    <th className="table-th">Absences</th>
                    <th className="table-th">Solde restant</th>
                  </tr>
                </thead>
                <tbody>
                  {resumeMensuel.mois.map((m: any) => (
                    <tr
                      key={m.mois}
                      className={`border-b border-gray-100 dark:border-gray-800 ${
                        m.mois === +tableMois ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                      }`}
                    >
                      <td className="table-td">{m.moisLabel}</td>
                      <td className="table-td font-medium">
                        {m.joursAbsents > 0 ? `${m.joursAbsents}j` : '-'}
                      </td>
                      <td className="table-td text-emerald-600">
                        {m.soldeRestant}j
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Liste des jours d'absence */}
      <div className="card overflow-x-auto">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-semibold">Jours d'absence enregistrés</h3>
            <p className="mt-1 text-xs text-gray-500">
              {conges.length} jour(s)
              {employeFiltreLabel
                ? ` — ${employeFiltreLabel.prenom} ${employeFiltreLabel.nom}`
                : ' — tous les employés'}
              {' · '}
              {MOIS.find((m) => m.value === +tableMois)?.label} {tableAnnee}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div>
              <label className="label text-xs">Employé</label>
              <select
                className="input min-w-[160px]"
                value={tableEmploye}
                onChange={(e) => setTableEmploye(e.target.value)}
              >
                <option value="">Tous</option>
                {employes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.prenom} {e.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Mois</label>
              <select
                className="input min-w-[130px]"
                value={tableMois}
                onChange={(e) => setTableMois(e.target.value)}
              >
                {MOIS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Année</label>
              <input
                type="number"
                className="input w-[100px]"
                value={tableAnnee}
                onChange={(e) => setTableAnnee(e.target.value)}
              />
            </div>
            {(tableEmploye || tableMois !== String(moisCourant) || tableAnnee !== String(anneeCourante)) && (
              <div>
                <label className="label text-xs">&nbsp;</label>
                <button
                  type="button"
                  onClick={() => {
                    setTableEmploye('');
                    setTableMois(String(moisCourant));
                    setTableAnnee(String(anneeCourante));
                  }}
                  className="btn-secondary whitespace-nowrap"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="table-th">Employé</th>
              <th className="table-th">Société</th>
              <th className="table-th">Date</th>
              <th className="table-th">Motif</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {conges.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-td text-center text-gray-500">
                  Aucun jour d'absence
                  {employeFiltreLabel
                    ? ` pour ${employeFiltreLabel.prenom} ${employeFiltreLabel.nom}`
                    : ''}{' '}
                  en {MOIS.find((m) => m.value === +tableMois)?.label} {tableAnnee}
                </td>
              </tr>
            ) : (
              conges.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="table-td font-medium">
                    {c.employe.prenom} {c.employe.nom}
                  </td>
                  <td className="table-td">{c.employe.societe}</td>
                  <td className="table-td">{formatDate(c.date)}</td>
                  <td className="table-td">{c.motif || '-'}</td>
                  <td className="table-td">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="btn-danger text-xs"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal ajout */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Ajouter des jours d'absence"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Employé</label>
            <select
              className="input"
              value={formEmploye}
              onChange={(e) => handleFormEmployeChange(e.target.value)}
              required
            >
              <option value="">Sélectionner...</option>
              {employes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.prenom} {e.nom} ({e.societe})
                </option>
              ))}
            </select>
          </div>

          {formSolde && formEmploye && (
            <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-900/20">
              <span className="text-sm text-gray-600">Solde disponible : </span>
              <span className="text-lg font-bold text-emerald-600">
                {formSolde.soldeRestant} jour(s)
              </span>
            </div>
          )}

          <div>
            <label className="label">Choisir un jour exact</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="input"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
              <button
                type="button"
                onClick={ajouterDate}
                className="btn-secondary whitespace-nowrap"
              >
                Ajouter
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Cliquez sur chaque jour d'absence (les dimanches sont exclus)
            </p>
          </div>

          {datesSelectionnees.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {datesSelectionnees.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-700 dark:bg-brand-900 dark:text-brand-300"
                >
                  {formatDate(d)}
                  <button
                    type="button"
                    onClick={() => retirerDate(d)}
                    className="hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <span className="self-center text-sm text-gray-500">
                = {datesSelectionnees.length} jour(s)
              </span>
            </div>
          )}

          <div>
            <label className="label">Motif</label>
            <input
              className="input"
              value={formMotif}
              onChange={(e) => setFormMotif(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Enregistrer ({datesSelectionnees.length} jour
              {datesSelectionnees.length > 1 ? 's' : ''})
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
