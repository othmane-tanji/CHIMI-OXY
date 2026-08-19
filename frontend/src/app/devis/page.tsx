'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, FileDown, Trash2, Pencil } from 'lucide-react';
import { devisApi } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { formatDate, formatMoney } from '@/lib/utils';

interface DevisLigneForm {
  designation: string;
  nbSeaux: string;
  qtySeauKg: string;
  prixUnitaire: string;
}

const emptyLigne = (): DevisLigneForm => ({
  designation: '',
  nbSeaux: '',
  qtySeauKg: '',
  prixUnitaire: '',
});

export default function DevisPage() {
  const [devisList, setDevisList] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    numeroDevisMiddle: '',
    clientNom: '',
    objet: '',
    lignes: [emptyLigne()],
  });

  const loadDevis = () => {
    devisApi.getAll()
      .then(setDevisList)
      .catch((err) => console.error('Erreur chargement devis:', err));
  };

  useEffect(() => {
    loadDevis();
  }, []);

  const handleAddLigne = () => {
    setForm({
      ...form,
      lignes: [...form.lignes, emptyLigne()],
    });
  };

  const handleRemoveLigne = (index: number) => {
    const next = [...form.lignes];
    next.splice(index, 1);
    setForm({ ...form, lignes: next.length > 0 ? next : [emptyLigne()] });
  };

  const handleLigneChange = (index: number, field: keyof DevisLigneForm, val: string) => {
    const next = [...form.lignes];
    next[index] = {
      ...next[index],
      [field]: val,
    };
    setForm({ ...form, lignes: next });
  };

  const handleEdit = (devis: any) => {
    setEditingId(devis.id);
    setForm({
      numeroDevisMiddle: devis.numeroDevisMiddle,
      clientNom: devis.clientNom,
      objet: devis.objet,
      lignes: devis.lignes.map((l: any) => ({
        designation: l.designation,
        nbSeaux: String(l.nbSeaux),
        qtySeauKg: String(l.qtySeauKg),
        prixUnitaire: String(l.prixUnitaire),
      })),
    });
    setModal(true);
  };

  const handleCloseModal = () => {
    setModal(false);
    setEditingId(null);
    setError('');
    setForm({
      numeroDevisMiddle: '',
      clientNom: '',
      objet: '',
      lignes: [emptyLigne()],
    });
  };

  // Real-time calculated totals
  const totaux = useMemo(() => {
    let totalHt = 0;
    form.lignes.forEach((l) => {
      const nbSeaux = parseFloat(l.nbSeaux) || 0;
      const qtySeauKg = parseFloat(l.qtySeauKg) || 0;
      const pu = parseFloat(l.prixUnitaire) || 0;
      totalHt += (nbSeaux * qtySeauKg) * pu;
    });
    const totalTva = totalHt * 0.20;
    const totalTtc = totalHt + totalTva;
    return { totalHt, totalTva, totalTtc };
  }, [form.lignes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Form validation
    if (!form.numeroDevisMiddle.trim()) {
      setError('Le numéro de devis (milieu XXX) est obligatoire.');
      setLoading(false);
      return;
    }
    if (!form.clientNom.trim()) {
      setError('Le nom du client est obligatoire.');
      setLoading(false);
      return;
    }
    if (!form.objet.trim()) {
      setError("L'objet du devis est obligatoire.");
      setLoading(false);
      return;
    }
    
    const preparedLignes = form.lignes.map((l) => ({
      designation: l.designation,
      nbSeaux: parseFloat(l.nbSeaux) || 0,
      qtySeauKg: parseFloat(l.qtySeauKg) || 0,
      prixUnitaire: parseFloat(l.prixUnitaire) || 0,
    }));

    if (preparedLignes.some((l) => !l.designation.trim())) {
      setError('Toutes les lignes doivent avoir une désignation.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        numeroDevisMiddle: form.numeroDevisMiddle,
        clientNom: form.clientNom,
        objet: form.objet,
        lignes: preparedLignes,
      };

      if (editingId) {
        await devisApi.update(editingId, payload);
      } else {
        await devisApi.create(payload);
      }

      setModal(false);
      setEditingId(null);
      setForm({
        numeroDevisMiddle: '',
        clientNom: '',
        objet: '',
        lignes: [emptyLigne()],
      });
      loadDevis();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création/modification du devis.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce devis ?')) return;
    try {
      await devisApi.remove(id);
      loadDevis();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    }
  };

  const filtered = useMemo(() => {
    return devisList.filter(
      (d) =>
        d.numeroDevis.toLowerCase().includes(search.toLowerCase()) ||
        d.clientNom.toLowerCase().includes(search.toLowerCase()) ||
        d.objet.toLowerCase().includes(search.toLowerCase()),
    );
  }, [devisList, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Devis"
        description="Créez et gerez les devis d'offres de prix au format Word .docx"
        action={
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 shadow-md"
          >
            <Plus size={18} />
            Nouveau Devis
          </button>
        }
      />

      {/* Search Filter */}
      <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par N° Devis, Client ou Objet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* List / Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 dark:bg-gray-800/50 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">N° Devis</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Objet</th>
              <th className="px-4 py-3 text-right">Total HT</th>
              <th className="px-4 py-3 text-right">TVA (20%)</th>
              <th className="px-4 py-3 text-right">Total TTC</th>
              <th className="px-4 py-3 text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Aucun devis trouvé.
                </td>
              </tr>
            ) : (
              filtered.map((devis) => (
                <tr key={devis.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                    {devis.numeroDevis}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                    {devis.clientNom}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {formatDate(devis.dateDevis)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                    {devis.objet}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                    {formatMoney(devis.totalHt)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                    {formatMoney(devis.totalTva)}
                  </td>
                  <td className="px-4 py-3 text-right text-brand-600 dark:text-brand-400 font-semibold">
                    {formatMoney(devis.totalTtc)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <a
                        href={devisApi.getDownloadUrl(devis.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 transition dark:text-brand-400 dark:hover:bg-brand-950"
                        title="Télécharger Word (.docx)"
                      >
                        <FileDown size={18} />
                      </a>
                      <button
                        onClick={() => handleEdit(devis)}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition dark:text-blue-400 dark:hover:bg-blue-950"
                        title="Modifier"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(devis.id)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-950"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Creation/Modification Modal */}
      <Modal open={modal} onClose={handleCloseModal} title={editingId ? "Modifier le Devis" : "Créer un Devis Word"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-h-[65vh] overflow-y-auto space-y-6 pr-2">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  N° Devis (Milieu XXX)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-medium">CH-</span>
                  <input
                    type="text"
                    placeholder="064"
                    required
                    value={form.numeroDevisMiddle}
                    onChange={(e) => setForm({ ...form, numeroDevisMiddle: e.target.value })}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-gray-500 font-medium">-26</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  Nom Société Client
                </label>
                <input
                  type="text"
                  placeholder="Ex: SINOSPARKS 2000"
                  required
                  value={form.clientNom}
                  onChange={(e) => setForm({ ...form, clientNom: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                Objet
              </label>
              <input
                type="text"
                placeholder="Ex: FLINKOTE"
                required
                value={form.objet}
                onChange={(e) => setForm({ ...form, objet: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Lines Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Lignes du Devis</h3>
                <button
                  type="button"
                  onClick={handleAddLigne}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  + Ajouter une ligne
                </button>
              </div>

              <div className="space-y-3">
                {form.lignes.map((ligne, idx) => {
                  const nbSeaux = parseFloat(ligne.nbSeaux) || 0;
                  const qtySeauKg = parseFloat(ligne.qtySeauKg) || 0;
                  const pu = parseFloat(ligne.prixUnitaire) || 0;
                  
                  const qtyKg = nbSeaux * qtySeauKg;
                  const montantLigne = qtyKg * pu;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-3 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2 bg-gray-50/30 dark:bg-gray-800/10"
                    >
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Désignation</label>
                          <input
                            type="text"
                            placeholder="Désignation"
                            required
                            value={ligne.designation}
                            onChange={(e) => handleLigneChange(idx, 'designation', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLigne(idx)}
                          className="text-red-500 hover:text-red-700 self-end mb-2"
                          title="Supprimer la ligne"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex gap-3 items-center">
                        <div className="w-24">
                          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nb Seaux</label>
                          <input
                            type="number"
                            placeholder="Nb Seaux"
                            required
                            min="0"
                            step="any"
                            value={ligne.nbSeaux}
                            onChange={(e) => handleLigneChange(idx, 'nbSeaux', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Qté/Seau (Kg)</label>
                          <input
                            type="number"
                            placeholder="Qté/Seau"
                            required
                            min="0"
                            step="any"
                            value={ligne.qtySeauKg}
                            onChange={(e) => handleLigneChange(idx, 'qtySeauKg', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div className="w-28">
                          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Prix U HT</label>
                          <input
                            type="number"
                            placeholder="Prix U HT"
                            required
                            min="0"
                            step="any"
                            value={ligne.prixUnitaire}
                            onChange={(e) => handleLigneChange(idx, 'prixUnitaire', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div className="flex-1 text-right">
                          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Total Ligne HT</label>
                          <div className="pt-2 font-semibold text-gray-900 dark:text-white text-sm">
                            {formatMoney(montantLigne)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex flex-col items-end space-y-2 text-sm">
              <div className="flex justify-between w-64 text-gray-600 dark:text-gray-400">
                <span>Total HT :</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatMoney(totaux.totalHt)}</span>
              </div>
              <div className="flex justify-between w-64 text-gray-600 dark:text-gray-400">
                <span>TVA (20%) :</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatMoney(totaux.totalTva)}</span>
              </div>
              <div className="flex justify-between w-64 border-t border-gray-100 dark:border-gray-800 pt-2 text-base font-bold text-brand-600 dark:text-brand-400">
                <span>Total TTC :</span>
                <span>{formatMoney(totaux.totalTtc)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={handleCloseModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Génération...' : editingId ? 'Enregistrer et Régénérer' : 'Générer le Devis Word'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
