'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { traitesApi, clientsApi, fournisseursApi } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { formatDate, formatMoney } from '@/lib/utils';

type Tab = 'encaissement' | 'decaissement';

export default function TraitesPage() {
  const [tab, setTab] = useState<Tab>('encaissement');
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ partenaireId: '', montant: '', date: '', reference: '' });

  const load = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (dateDebut) params.dateDebut = dateDebut;
    if (dateFin) params.dateFin = dateFin;
    if (tab === 'encaissement') traitesApi.getEncaissements(params).then(setItems);
    else traitesApi.getDecaissements(params).then(setItems);
  };

  useEffect(() => { load(); }, [tab]);
  useEffect(() => {
    clientsApi.getAll().then(setClients);
    fournisseursApi.getAll().then(setFournisseurs);
  }, []);

  const openCreate = () => {
    setForm({ partenaireId: '', montant: '', date: '', reference: '' });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (item: any) => {
    setForm({
      partenaireId: String(tab === 'encaissement' ? item.clientId : item.fournisseurId),
      montant: String(item.montant),
      date: item.date.split('T')[0],
      reference: item.reference,
    });
    setEditId(item.id);
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { montant: +form.montant, date: form.date, reference: form.reference };
    if (tab === 'encaissement') {
      if (editId) await traitesApi.updateEncaissement(editId, data);
      else await traitesApi.createEncaissement({ ...data, clientId: +form.partenaireId });
    } else {
      if (editId) await traitesApi.updateDecaissement(editId, data);
      else await traitesApi.createDecaissement({ ...data, fournisseurId: +form.partenaireId });
    }
    setModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ?')) return;
    if (tab === 'encaissement') await traitesApi.removeEncaissement(id);
    else await traitesApi.removeDecaissement(id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Traites & Chèques"
        description="Encaissements et décaissements"
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Ajouter
          </button>
        }
      />

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('encaissement')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'encaissement' ? 'bg-emerald-600 text-white' : 'btn-secondary'}`}>
          Encaissements
        </button>
        <button onClick={() => setTab('decaissement')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'decaissement' ? 'bg-red-600 text-white' : 'btn-secondary'}`}>
          Décaissements
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <input type="date" className="input max-w-[160px]" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        <input type="date" className="input max-w-[160px]" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        <button onClick={load} className="btn-primary">Filtrer</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="table-th">Référence</th>
              <th className="table-th">{tab === 'encaissement' ? 'Client' : 'Fournisseur'}</th>
              <th className="table-th">Date</th>
              <th className="table-th">Montant</th>
              <th className="table-th">PDF</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="table-td font-medium">{item.reference}</td>
                <td className="table-td">
                  {tab === 'encaissement' ? item.client.nomClient : item.fournisseur.nomFournisseur}
                </td>
                <td className="table-td">{formatDate(item.date)}</td>
                <td className="table-td font-semibold">{formatMoney(item.montant)}</td>
                <td className="table-td">{item.pdfPath ? '✓' : '-'}</td>
                <td className="table-td">
                  <button onClick={() => openEdit(item)} className="btn-secondary mr-2 text-xs">Modifier</button>
                  <button onClick={() => handleDelete(item.id)} className="btn-danger text-xs">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Modifier' : `Nouvel ${tab}`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!editId && (
            <div>
              <label className="label">{tab === 'encaissement' ? 'Client' : 'Fournisseur'}</label>
              <select className="input" value={form.partenaireId} onChange={(e) => setForm({ ...form, partenaireId: e.target.value })} required>
                <option value="">Sélectionner...</option>
                {(tab === 'encaissement' ? clients : fournisseurs).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {tab === 'encaissement' ? p.nomClient : p.nomFournisseur}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div><label className="label">Référence</label><input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required /></div>
          <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
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
