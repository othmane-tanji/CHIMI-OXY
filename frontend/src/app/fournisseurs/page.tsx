'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { fournisseursApi } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nomFournisseur: '', societe: 'OXYRAL' });
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => fournisseursApi.getAll().then(setFournisseurs);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) await fournisseursApi.update(editId, form);
    else await fournisseursApi.create(form);
    setModal(false);
    load();
  };

  return (
    <div>
      <PageHeader title="Fournisseurs" action={
        <button onClick={() => { setForm({ nomFournisseur: '', societe: 'OXYRAL' }); setEditId(null); setModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      } />
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b dark:border-gray-800"><th className="table-th">Nom</th><th className="table-th">Société</th><th className="table-th">Actions</th></tr></thead>
          <tbody>
            {fournisseurs.map((f) => (
              <tr key={f.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="table-td font-medium">{f.nomFournisseur}</td>
                <td className="table-td">{f.societe}</td>
                <td className="table-td">
                  <button onClick={() => { setForm({ nomFournisseur: f.nomFournisseur, societe: f.societe }); setEditId(f.id); setModal(true); }} className="btn-secondary mr-2 text-xs">Modifier</button>
                  <button onClick={async () => { if (confirm('Supprimer ?')) { await fournisseursApi.remove(f.id); load(); } }} className="btn-danger text-xs">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Modifier fournisseur' : 'Nouveau fournisseur'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="label">Nom</label><input className="input" value={form.nomFournisseur} onChange={(e) => setForm({ ...form, nomFournisseur: e.target.value })} required /></div>
          <div><label className="label">Société</label>
            <select className="input" value={form.societe} onChange={(e) => setForm({ ...form, societe: e.target.value })}>
              <option value="OXYRAL">Oxyral</option><option value="CHIMIRAL">Chimiral</option>
            </select>
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="btn-secondary">Annuler</button><button type="submit" className="btn-primary">{editId ? 'Modifier' : 'Créer'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
