'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, FileDown, AlertTriangle } from 'lucide-react';
import { bulletinsApi, employesApi } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { formatMoney, MOIS } from '@/lib/utils';

const anneeCourante = new Date().getFullYear();
const moisCourant = new Date().getMonth() + 1;

const emptyForm = {
  employeId: '',
  mois: String(moisCourant),
  annee: String(anneeCourante),
  salaireBase: '',
  nombreJours: '26',
  primes: '0',
  indemniteTransport: '150',
  ir: '0',
};

export default function BulletinsPage() {
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [employes, setEmployes] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [avertissement, setAvertissement] = useState<string | null>(null);
  const [confirmerAvertissement, setConfirmerAvertissement] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const load = () => bulletinsApi.getAll().then(setBulletins);

  useEffect(() => {
    load();
    employesApi.getAll().then(setEmployes);
  }, []);

  const fetchPreview = useCallback(async () => {
    if (!form.employeId || !form.salaireBase) {
      setPreview(null);
      setAvertissement(null);
      return;
    }
    setLoadingPreview(true);
    try {
      const data = await bulletinsApi.getCalculPreview({
        employeId: +form.employeId,
        mois: +form.mois,
        annee: +form.annee,
        salaireBase: +form.salaireBase,
        nombreJours: +form.nombreJours,
        primes: +form.primes || 0,
        indemniteTransport: +form.indemniteTransport || 150,
        ir: +form.ir || 0,
      });
      setPreview(data);
      setAvertissement(data.avertissement);
      if (!data.avertissement) setConfirmerAvertissement(false);
    } catch {
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, [form.employeId, form.mois, form.annee, form.salaireBase, form.nombreJours, form.primes, form.indemniteTransport, form.ir]);

  useEffect(() => {
    if (!modal || !form.employeId) return;
    let cancelled = false;
    bulletinsApi
      .getCalculPreview({
        employeId: +form.employeId,
        mois: +form.mois,
        annee: +form.annee,
        salaireBase: +form.salaireBase || 1,
        nombreJours: 26,
      })
      .then((data) => {
        if (!cancelled) {
          setForm((f) => ({ ...f, nombreJours: String(data.joursAttendus) }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [form.employeId, form.mois, form.annee, modal]);

  useEffect(() => {
    if (modal) {
      const t = setTimeout(fetchPreview, 300);
      return () => clearTimeout(t);
    }
  }, [modal, fetchPreview]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setPreview(null);
    setAvertissement(null);
    setConfirmerAvertissement(false);
    setModal(true);
  };

  const openEdit = (b: any) => {
    setForm({
      employeId: String(b.employeId),
      mois: String(b.mois),
      annee: String(b.annee),
      salaireBase: String(b.salaireBase),
      nombreJours: String(b.nombreJours),
      primes: String(b.primes),
      indemniteTransport: String(b.indemniteTransport),
      ir: String(b.ir),
    });
    setEditId(b.id);
    setConfirmerAvertissement(false);
    setModal(true);
  };

  const buildPayload = () => ({
    employeId: +form.employeId,
    mois: +form.mois,
    annee: +form.annee,
    salaireBase: +form.salaireBase,
    nombreJours: +form.nombreJours,
    primes: +form.primes || 0,
    indemniteTransport: +form.indemniteTransport || 150,
    ir: +form.ir || 0,
    confirmerAvertissement: confirmerAvertissement || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = buildPayload();
    try {
      if (editId) await bulletinsApi.update(editId, data);
      else await bulletinsApi.create(data);
      setModal(false);
      load();
    } catch (err: any) {
      if (err.details?.avertissement) {
        setAvertissement(err.details.avertissement);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce bulletin ?')) return;
    await bulletinsApi.remove(id);
    load();
  };

  const handleDownload = async (b: any) => {
    try {
      await bulletinsApi.downloadPdf(
        b.id,
        `bulletin-${b.employe.prenom}-${b.employe.nom}-${b.mois}-${b.annee}.pdf`,
      );
      if (!b.pdfPath) load();
    } catch {
      alert('Impossible de télécharger le PDF. Vérifiez que le serveur backend est démarré.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Bulletins de paie"
        description="Calcul auto · 26j base · CNSS 4,48 % · AMO 2,26 % · Ancienneté 5 % / 10 %"
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouveau bulletin
          </button>
        }
      />

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="table-th">Employé</th>
              <th className="table-th">Période</th>
              <th className="table-th">Jours</th>
              <th className="table-th">Brut</th>
              <th className="table-th">Ancienneté</th>
              <th className="table-th">Retenues</th>
              <th className="table-th">Net</th>
              <th className="table-th">PDF</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bulletins.map((b) => (
              <tr key={b.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="table-td font-medium">
                  {b.employe.prenom} {b.employe.nom}
                </td>
                <td className="table-td">
                  {MOIS.find((m) => m.value === b.mois)?.label} {b.annee}
                </td>
                <td className="table-td">{b.nombreJours}j</td>
                <td className="table-td">{formatMoney(b.salaireBrut)}</td>
                <td className="table-td">
                  {Number(b.tauxAnciennete) > 0
                    ? `${b.tauxAnciennete}% (${formatMoney(b.montantAnciennete)})`
                    : '-'}
                </td>
                <td className="table-td">{formatMoney(b.deductions)}</td>
                <td className="table-td font-semibold">{formatMoney(b.salaireNet)}</td>
                <td className="table-td">
                  <button
                    onClick={() => handleDownload(b)}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  >
                    <FileDown size={14} /> Télécharger
                  </button>
                </td>
                <td className="table-td">
                  <button onClick={() => openEdit(b)} className="btn-secondary mr-2 text-xs">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="btn-danger text-xs">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Modifier bulletin' : 'Nouveau bulletin de paie'}
      >
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {!editId && (
            <div>
              <label className="label">Employé</label>
              <select
                className="input"
                value={form.employeId}
                onChange={(e) => setForm({ ...form, employeId: e.target.value, nombreJours: '26' })}
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
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Mois</label>
              <select
                className="input"
                value={form.mois}
                onChange={(e) => setForm({ ...form, mois: e.target.value })}
              >
                {MOIS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Année</label>
              <input
                type="number"
                className="input"
                value={form.annee}
                onChange={(e) => setForm({ ...form, annee: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Salaire de base (26 jours, hors dimanches)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.salaireBase}
              onChange={(e) => setForm({ ...form, salaireBase: e.target.value })}
              placeholder="Ex: 3420.00"
              required
            />
          </div>

          <div>
            <label className="label">Nombre d&apos;appointements (jours travaillés)</label>
            <input
              type="number"
              min={1}
              max={26}
              className="input"
              value={form.nombreJours}
              onChange={(e) => setForm({ ...form, nombreJours: e.target.value })}
              required
            />
            <p className="mt-1 text-xs text-gray-500">Base : 26 jours · Dimanches exclus</p>
          </div>

          {preview && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
              <p>
                Absences ce mois (congés) :{' '}
                <strong>{preview.joursAbsents} jour(s)</strong>
              </p>
              <p>
                Jours attendus : <strong>{preview.joursAttendus}j</strong> (26 −{' '}
                {preview.joursAbsents})
              </p>
              <p>
                Ancienneté : <strong>{preview.anneesAnciennete} an(s)</strong>
                {preview.tauxAnciennete > 0 && ` → +${preview.tauxAnciennete}%`}
              </p>
            </div>
          )}

          {avertissement && (
            <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p>{avertissement}</p>
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={confirmerAvertissement}
                    onChange={(e) => setConfirmerAvertissement(e.target.checked)}
                  />
                  Confirmer malgré l&apos;écart
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Primes (MAD)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.primes}
                onChange={(e) => setForm({ ...form, primes: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Indemnité transport</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.indemniteTransport}
                onChange={(e) => setForm({ ...form, indemniteTransport: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">IR — Impôt sur le revenu (optionnel)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.ir}
              onChange={(e) => setForm({ ...form, ir: e.target.value })}
            />
          </div>

          {preview && (
            <div className="space-y-2 rounded-lg bg-brand-50 p-4 dark:bg-brand-900/20">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Taux journalier</span>
                <span className="text-right">{formatMoney(preview.tauxJournalier)}</span>
                <span className="text-gray-500">Appointements</span>
                <span className="text-right">{formatMoney(preview.montantAppointements)}</span>
                <span className="text-gray-500">Ancienneté ({preview.tauxAnciennete}%)</span>
                <span className="text-right">{formatMoney(preview.montantAnciennete)}</span>
                <span className="text-gray-500">Salaire brut</span>
                <span className="text-right font-medium">{formatMoney(preview.salaireBrut)}</span>
                <span className="text-gray-500">CNSS (4,48 %)</span>
                <span className="text-right text-red-600">− {formatMoney(preview.cnss)}</span>
                <span className="text-gray-500">AMO (2,26 %)</span>
                <span className="text-right text-red-600">− {formatMoney(preview.amo)}</span>
                {preview.ir > 0 && (
                  <>
                    <span className="text-gray-500">IR</span>
                    <span className="text-right text-red-600">− {formatMoney(preview.ir)}</span>
                  </>
                )}
                <span className="text-gray-500">Transport</span>
                <span className="text-right text-emerald-600">
                  + {formatMoney(preview.indemniteTransport)}
                </span>
              </div>
              <div className="border-t border-brand-200 pt-2 text-center dark:border-brand-800">
                <span className="text-sm text-gray-500">Net à payer </span>
                <span className="text-xl font-bold text-brand-600">
                  {formatMoney(preview.salaireNet)}
                </span>
              </div>
            </div>
          )}

          {loadingPreview && (
            <p className="text-center text-xs text-gray-400">Calcul en cours...</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!!avertissement && !confirmerAvertissement}
            >
              {editId ? 'Modifier' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
