'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, X, Sun, Moon, Clock, FileSpreadsheet } from 'lucide-react';
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
  const [formTypeJour, setFormTypeJour] = useState('JOURNEE'); // 'JOURNEE' | 'MATIN' | 'APRES_MIDI'
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
      congesApi.getSoldes(+tableMois, +tableAnnee),
    ]);
    setConges(congesData);
    setSoldes(soldesData.employes);
    setSoldesPeriode({ mois: soldesData.mois, annee: soldesData.annee });

    if (tableEmploye) {
      const [soldeData, resume] = await Promise.all([
        congesApi.getSolde(+tableEmploye, +tableAnnee),
        congesApi.getResumeMensuel(+tableEmploye, +tableAnnee),
      ]);
      setSolde(soldeData);
      setResumeMensuel(resume);
    } else {
      setSolde(null);
      setResumeMensuel(null);
    }
  }, [tableEmploye, tableMois, tableAnnee]);

  useEffect(() => {
    employesApi.getAll().then(setEmployes);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormEmployeChange = async (id: string) => {
    setFormEmploye(id);
    setFormSolde(id ? await congesApi.getSolde(+id, +tableAnnee) : null);
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
        typeJour: formTypeJour,
        motif: formMotif || undefined,
      });
      setModal(false);
      setFormEmploye('');
      setFormSolde(null);
      setFormTypeJour('JOURNEE');
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

  const [excelModal, setExcelModal] = useState<{
    open: boolean;
    isGlobal: boolean;
    employeId?: number;
    nom?: string;
    prenom?: string;
    moisOptional?: number;
    isAllYears?: boolean;
  }>({ open: false, isGlobal: false });
  const [exportEmail, setExportEmail] = useState('tangi.fat@gmail.com');
  const [sendEmailCopy, setSendEmailCopy] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);

  const triggerExcelExport = (
    isGlobal: boolean,
    employeId?: number,
    nom?: string,
    prenom?: string,
    moisOptional?: number,
    isAllYears?: boolean,
  ) => {
    setExcelModal({
      open: true,
      isGlobal,
      employeId,
      nom,
      prenom,
      moisOptional,
      isAllYears,
    });
  };

  const confirmExcelExport = async () => {
    setExportingExcel(true);
    try {
      if (excelModal.isGlobal) {
        const filename = `releve-conges-tous-les-employes-${tableAnnee}.xlsx`;
        await congesApi.downloadGlobalExcel(filename, +tableAnnee, sendEmailCopy, exportEmail);
      } else if (excelModal.employeId && excelModal.nom && excelModal.prenom) {
        const nomClean = `${excelModal.prenom}-${excelModal.nom}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const moisNoms = [
          'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
          'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
        ];
        const moisSuffix = !excelModal.isAllYears && excelModal.moisOptional ? `-${moisNoms[excelModal.moisOptional - 1]}` : '';
        const anneeSuffix = excelModal.isAllYears ? '-toutes-les-annees' : `-${tableAnnee}`;
        const filename = `releve-conges-${nomClean}${moisSuffix}${anneeSuffix}.xlsx`;

        await congesApi.downloadExcel(
          excelModal.employeId,
          filename,
          excelModal.isAllYears ? 0 : +tableAnnee,
          excelModal.isAllYears ? undefined : excelModal.moisOptional,
          sendEmailCopy,
          exportEmail,
        );
      }
      setExcelModal({ open: false, isGlobal: false });
    } catch (err: any) {
      alert('Erreur lors du téléchargement / envoi Excel : ' + err.message);
    } finally {
      setExportingExcel(false);
    }
  };

  const moisFiltre = resumeMensuel?.mois?.find(
    (m: any) => m.mois === +tableMois,
  );

  const employeFiltreLabel = tableEmploye
    ? employes.find((e) => String(e.id) === tableEmploye)
    : null;

  const multiplicateurType = formTypeJour === 'JOURNEE' ? 1 : 0.5;
  const totalJoursForm = datesSelectionnees.length * multiplicateurType;

  const nomMoisFiltreLabel = MOIS.find((m) => m.value === +tableMois)?.label;

  return (
    <div>
      <PageHeader
        title="Gestion des congés & Absences"
        description="Gestion des absences (journées complètes ou demi-journées : matinée / après-midi)"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => triggerExcelExport(true)}
              className="btn-secondary flex items-center gap-1.5 border-blue-600 text-blue-700 bg-blue-50/50 hover:bg-blue-100 dark:border-blue-500 dark:text-blue-400 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 font-semibold"
              title="Télécharger UN SEUL fichier Excel avec CHAQUE employé sur sa propre feuille d'onglet"
            >
              <FileSpreadsheet size={16} className="text-blue-600 dark:text-blue-400" /> Export Master Excel (Tous les employés)
            </button>
            {tableEmploye && employeFiltreLabel && (
              <>
                <button
                  onClick={() => triggerExcelExport(false, +tableEmploye, employeFiltreLabel.nom, employeFiltreLabel.prenom, +tableMois)}
                  className="btn-secondary flex items-center gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                  title="Télécharger l'Excel pour le mois sélectionné"
                >
                  <FileSpreadsheet size={16} className="text-emerald-600" /> Excel ({nomMoisFiltreLabel})
                </button>
                <button
                  onClick={() => triggerExcelExport(false, +tableEmploye, employeFiltreLabel.nom, employeFiltreLabel.prenom, undefined, true)}
                  className="btn-secondary flex items-center gap-1.5 border-purple-600 text-purple-700 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-400 dark:hover:bg-purple-950/40"
                  title="Télécharger l'Excel historique de TOUTES les années"
                >
                  <FileSpreadsheet size={16} className="text-purple-600" /> Excel (Toutes les années)
                </button>
              </>
            )}
            <button
              onClick={() => {
                setModal(true);
                setError('');
                setDatesSelectionnees([]);
                setFormTypeJour('JOURNEE');
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Ajouter des absences
            </button>
          </div>
        }
      />

      {/* Soldes de tous les employés */}
      {soldesPeriode && (
        <p className="mb-3 text-sm text-gray-500">
          Soldes pour{' '}
          <strong>
            {MOIS.find((m) => m.value === soldesPeriode.mois)?.label}{' '}
            {soldesPeriode.annee}
          </strong>
          {' '}— cliquez sur un employé ou sur un mois ci-dessous pour télécharger son relevé
        </p>
      )}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {soldes.map((s) => (
          <div
            key={s.employeId}
            onClick={() => setTableEmploye(String(s.employeId))}
            className={`card cursor-pointer text-left transition hover:border-brand-500 ${
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
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-3 text-xs text-gray-500">
                <span>Droit : {s.soldeInitial}j</span>
                <span>Pris ce mois : {s.joursPrisMois || 0}j</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerExcelExport(false, s.employeId, s.nom, s.prenom, +tableMois);
                  }}
                  title={`Télécharger Excel pour ${nomMoisFiltreLabel}`}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded dark:bg-emerald-950/40 dark:text-emerald-400"
                >
                  <FileSpreadsheet size={13} /> {nomMoisFiltreLabel?.substring(0, 3)}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerExcelExport(false, s.employeId, s.nom, s.prenom, undefined, true);
                  }}
                  title="Télécharger l'Excel de TOUTES les années"
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded dark:bg-purple-950/40 dark:text-purple-400"
                >
                  <FileSpreadsheet size={13} /> Toutes années
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé employé sélectionné */}
      {solde && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold">
                Solde — {solde.employe.prenom} {solde.employe.nom}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => triggerExcelExport(false, solde.employe.id, solde.employe.nom, solde.employe.prenom, +tableMois)}
                  className="btn-secondary text-xs flex items-center gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400"
                  title={`Télécharger Excel du mois de ${nomMoisFiltreLabel}`}
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" /> Excel ({nomMoisFiltreLabel})
                </button>
                <button
                  onClick={() => triggerExcelExport(false, solde.employe.id, solde.employe.nom, solde.employe.prenom)}
                  className="btn-secondary text-xs flex items-center gap-1.5 text-gray-600 hover:bg-gray-100"
                  title={`Télécharger l'Excel complet de l'année ${tableAnnee}`}
                >
                  {tableAnnee}
                </button>
                <button
                  onClick={() => triggerExcelExport(false, solde.employe.id, solde.employe.nom, solde.employe.prenom, undefined, true)}
                  className="btn-secondary text-xs flex items-center gap-1.5 border-purple-600 text-purple-700 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-400"
                  title="Télécharger l'Excel historique de TOUTES les années"
                >
                  <FileSpreadsheet size={14} className="text-purple-600" /> Toutes les années
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Droit annuel</p>
                <p className="text-xl font-bold text-brand-600">
                  {solde.soldeInitial}j
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Consommés ({tableAnnee})</p>
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
              <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-50 p-3 text-sm dark:bg-brand-900/20">
                <div>
                  <span className="text-gray-500">Mois sélectionné ({nomMoisFiltreLabel}) : </span>
                  <strong>{moisFiltre.joursAbsents} jour(s) absent(s)</strong>
                </div>
                <button
                  onClick={() => triggerExcelExport(false, solde.employe.id, solde.employe.nom, solde.employe.prenom, +tableMois)}
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <FileSpreadsheet size={13} /> Télécharger cet Excel
                </button>
              </div>
            )}
          </div>

          {resumeMensuel && (
            <div className="card overflow-x-auto">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">
                  Récapitulatif mensuel {tableAnnee}
                </h3>
                <span className="text-xs text-gray-500">
                  Cliquez sur un mois pour le filtrer
                </span>
              </div>
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
                      onClick={() => setTableMois(String(m.mois))}
                      className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer transition hover:bg-brand-50 dark:hover:bg-brand-900/30 ${
                        m.mois === +tableMois ? 'bg-brand-100/70 font-bold dark:bg-brand-900/40 border-l-4 border-l-brand-600' : ''
                      }`}
                    >
                      <td className="table-td flex items-center justify-between">
                        <span>{m.moisLabel}</span>
                        {m.mois === +tableMois && (
                          <span className="text-[10px] uppercase font-bold text-brand-700 bg-brand-200 px-1.5 py-0.5 rounded dark:bg-brand-800 dark:text-brand-200">
                            Sélectionné
                          </span>
                        )}
                      </td>
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
              {conges.length} enregistrement(s)
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
              <th className="table-th">Durée / Moment</th>
              <th className="table-th">Motif</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {conges.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-td text-center text-gray-500">
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
                  <td className="table-td">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.typeJour === 'MATIN'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : c.typeJour === 'APRES_MIDI'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}
                    >
                      {c.typeJour === 'MATIN' ? (
                        <>
                          <Sun size={12} /> Matinée (0.5j)
                        </>
                      ) : c.typeJour === 'APRES_MIDI' ? (
                        <>
                          <Moon size={12} /> Après-midi (0.5j)
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> Journée entière (1.0j)
                        </>
                      )}
                    </span>
                  </td>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Employé</label>
            <select
              className="input"
              value={formEmploye}
              onChange={(e) => handleFormEmployeChange(e.target.value)}
              required
            >
              <option value="">Sélectionner un employé...</option>
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
            <label className="label">Type / Durée de l'absence</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormTypeJour('JOURNEE')}
                className={`rounded-lg border p-2.5 text-center text-xs font-medium transition ${
                  formTypeJour === 'JOURNEE'
                    ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 font-semibold ring-2 ring-brand-500/20'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <Clock size={16} className="mx-auto mb-1 text-brand-600" />
                Journée entière (1j)
              </button>
              <button
                type="button"
                onClick={() => setFormTypeJour('MATIN')}
                className={`rounded-lg border p-2.5 text-center text-xs font-medium transition ${
                  formTypeJour === 'MATIN'
                    ? 'border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-semibold ring-2 ring-amber-500/20'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <Sun size={16} className="mx-auto mb-1 text-amber-600" />
                Matinée (0.5j)
              </button>
              <button
                type="button"
                onClick={() => setFormTypeJour('APRES_MIDI')}
                className={`rounded-lg border p-2.5 text-center text-xs font-medium transition ${
                  formTypeJour === 'APRES_MIDI'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-semibold ring-2 ring-purple-500/20'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <Moon size={16} className="mx-auto mb-1 text-purple-600" />
                Après-midi (0.5j)
              </button>
            </div>
          </div>

          <div>
            <label className="label">Choisir une ou plusieurs dates</label>
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
              Sélectionnez chaque date d'absence (dimanches exclus)
            </p>
          </div>

          {datesSelectionnees.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {datesSelectionnees.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300"
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
              </div>
              <p className="text-xs font-semibold text-brand-600">
                Décompte total : {totalJoursForm} jour(s) ({datesSelectionnees.length} date(s) × {multiplicateurType}j)
              </p>
            </div>
          )}

          <div>
            <label className="label">Motif (optionnel)</label>
            <input
              className="input"
              placeholder="Ex. Congé personnel, RDV médical..."
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
              Enregistrer ({totalJoursForm} jour{totalJoursForm > 1 ? 's' : ''})
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal d'exportation Excel et de sauvegarde par email */}
      <Modal
        open={excelModal.open}
        onClose={() => setExcelModal({ open: false, isGlobal: false })}
        title="Exportation Excel & Sauvegarde Email"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 p-3.5 dark:bg-emerald-950/40 text-sm">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">
              📊 Exportation Excel prête !
            </p>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              {excelModal.isGlobal
                ? `Rapport consolidé Master Excel pour tous les employés (${tableAnnee})`
                : `Relevé pour ${excelModal.prenom} ${excelModal.nom} (${excelModal.isAllYears ? 'Historique complet' : tableAnnee})`}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                checked={sendEmailCopy}
                onChange={(e) => setSendEmailCopy(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Envoyer une copie de sauvegarde par Email
            </label>

            {sendEmailCopy && (
              <div>
                <label className="label text-xs">Adresse email destinataire de la sauvegarde</label>
                <input
                  type="email"
                  className="input text-sm"
                  value={exportEmail}
                  onChange={(e) => setExportEmail(e.target.value)}
                  placeholder="tangi.fat@gmail.com"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Une copie du fichier `.xlsx` sera transmise à cet email pour archivage et sauvegarde.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setExcelModal({ open: false, isGlobal: false })}
              className="btn-secondary text-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmExcelExport}
              disabled={exportingExcel}
              className="btn-primary text-sm flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileSpreadsheet size={16} />
              {exportingExcel
                ? 'Exportation & Envoi...'
                : sendEmailCopy
                ? 'Télécharger & Envoyer par Email'
                : 'Télécharger l\'Excel'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
