'use client';

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { facturesApi, clientsApi, fournisseursApi } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { formatDate, formatMoney } from '@/lib/utils';

type Tab = 'achat' | 'vente';

export default function FacturesPage() {
  const [tab, setTab] = useState<Tab>('achat');
  const [factures, setFactures] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [form, setForm] = useState<any>({
    partenaireId: '', numeroFacture: '', dateFacture: '', montant: '',
  });

  const load = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (dateDebut) params.dateDebut = dateDebut;
    if (dateFin) params.dateFin = dateFin;
    if (tab === 'achat') facturesApi.getAchat(params).then(setFactures);
    else facturesApi.getVente(params).then(setFactures);
  };

  useEffect(() => { load(); }, [tab]);
  useEffect(() => {
    clientsApi.getAll().then(setClients);
    fournisseursApi.getAll().then(setFournisseurs);
  }, []);

  const openCreate = () => {
    setForm({ partenaireId: '', numeroFacture: '', dateFacture: '', montant: '' });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (f: any) => {
    setForm({
      partenaireId: String(tab === 'achat' ? f.fournisseurId : f.clientId),
      numeroFacture: f.numeroFacture,
      dateFacture: f.dateFacture.split('T')[0],
      montant: String(f.montant),
    });
    setEditId(f.id);
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      numeroFacture: form.numeroFacture,
      dateFacture: form.dateFacture,
      montant: +form.montant,
    };
    if (tab === 'achat') {
      if (editId) await facturesApi.updateAchat(editId, data);
      else await facturesApi.createAchat({ ...data, fournisseurId: +form.partenaireId });
    } else {
      if (editId) await facturesApi.updateVente(editId, data);
      else await facturesApi.createVente({ ...data, clientId: +form.partenaireId });
    }
    setModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette facture ?')) return;
    if (tab === 'achat') await facturesApi.removeAchat(id);
    else await facturesApi.removeVente(id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Factures"
        description="Gestion des factures d'achat et de vente"
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Ajouter
          </button>
        }
      />

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('achat')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'achat' ? 'bg-brand-600 text-white' : 'btn-secondary'}`}>
          Factures d'achat
        </button>
        <button onClick={() => setTab('vente')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'vente' ? 'bg-brand-600 text-white' : 'btn-secondary'}`}>
          Factures de vente
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <input type="date" className="input max-w-[160px]" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        <input type="date" className="input max-w-[160px]" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        <button onClick={load} className="btn-primary">Filtrer</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="table-th">N° Facture</th>
              <th className="table-th">{tab === 'achat' ? 'Fournisseur' : 'Client'}</th>
              <th className="table-th">Date</th>
              <th className="table-th">Montant</th>
              <th className="table-th">PDF</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="table-td font-medium">{f.numeroFacture}</td>
                <td className="table-td">{tab === 'achat' ? f.fournisseur.nomFournisseur : f.client.nomClient}</td>
                <td className="table-td">{formatDate(f.dateFacture)}</td>
                <td className="table-td font-semibold">{formatMoney(f.montant)}</td>
                <td className="table-td">{f.pdfPath ? '✓' : '-'}</td>
                <td className="table-td">
                  <button onClick={() => openEdit(f)} className="btn-secondary mr-2 text-xs">Modifier</button>
                  <button onClick={() => handleDelete(f.id)} className="btn-danger text-xs">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Modifier facture' : `Nouvelle facture ${tab}`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!editId && (
            <div>
              <label className="label">{tab === 'achat' ? 'Fournisseur' : 'Client'}</label>
              <select className="input" value={form.partenaireId} onChange={(e) => setForm({ ...form, partenaireId: e.target.value })} required>
                <option value="">Sélectionner...</option>
                {(tab === 'achat' ? fournisseurs : clients).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {tab === 'achat' ? p.nomFournisseur : p.nomClient}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div><label className="label">N° Facture</label><input className="input" value={form.numeroFacture} onChange={(e) => setForm({ ...form, numeroFacture: e.target.value })} required /></div>
          <div><label className="label">Date</label><input type="date" className="input" value={form.dateFacture} onChange={(e) => setForm({ ...form, dateFacture: e.target.value })} required /></div>
          <div><label className="label">Montant (MAD)</label><input type="number" step="0.01" className="input" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} required /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">{editId ? 'Modifier' : 'Créer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
