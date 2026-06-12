'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { employesApi } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { formatDate } from '@/lib/utils';

const emptyForm = {
  nom: '',
  prenom: '',
  cin: '',
  telephone: '',
  adresse: '',
  dateNaissance: '',
  fonction: 'EMPLOYE',
  situationFamiliale: '',
  nombreEnfants: '0',
  cnss: '',
  cimr: '',
  dateEmbauche: '',
  societe: 'OXYRAL',
};

export default function EmployesPage() {
  const [employes, setEmployes] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [filter, setFilter] = useState('');

  const load = () => employesApi.getAll(filter || undefined).then(setEmployes);
  useEffect(() => { load(); }, [filter]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal(true);
  };

  const openEdit = (e: any) => {
    setForm({
      nom: e.nom,
      prenom: e.prenom,
      cin: e.cin,
      telephone: e.telephone || '',
      adresse: e.adresse || '',
      dateNaissance: e.dateNaissance?.split('T')[0] || '',
      fonction: e.fonction || 'EMPLOYE',
      situationFamiliale: e.situationFamiliale || '',
      nombreEnfants: String(e.nombreEnfants || 0),
      cnss: e.cnss || '',
      cimr: e.cimr || '',
      dateEmbauche: e.dateEmbauche.split('T')[0],
      societe: e.societe,
    });
    setEditId(e.id);
    setModal(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const payload = {
      ...form,
      nombreEnfants: +form.nombreEnfants || 0,
      dateNaissance: form.dateNaissance || undefined,
    };
    if (editId) await employesApi.update(editId, payload);
    else await employesApi.create(payload);
    setModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet employé ?')) return;
    await employesApi.remove(id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Employés"
        description="Gestion des employés Oxyral et Chimiral"
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Ajouter
          </button>
        }
      />

      <div className="mb-4">
        <select className="input max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Toutes les sociétés</option>
          <option value="OXYRAL">Oxyral</option>
          <option value="CHIMIRAL">Chimiral</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="table-th">Nom</th>
              <th className="table-th">CIN</th>
              <th className="table-th">Téléphone</th>
              <th className="table-th">Embauche</th>
              <th className="table-th">Société</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employes.map((e) => (
              <tr key={e.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="table-td font-medium">{e.prenom} {e.nom}</td>
                <td className="table-td">{e.cin}</td>
                <td className="table-td">{e.telephone || '-'}</td>
                <td className="table-td">{formatDate(e.dateEmbauche)}</td>
                <td className="table-td">{e.societe}</td>
                <td className="table-td">
                  <button onClick={() => openEdit(e)} className="btn-secondary mr-2 text-xs">Modifier</button>
                  <button onClick={() => handleDelete(e.id)} className="btn-danger text-xs">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Modifier employé' : 'Nouvel employé'}>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Prénom</label><input className="input" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required /></div>
            <div><label className="label">Nom</label><input className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></div>
          </div>
          <div><label className="label">CIN</label><input className="input" value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value })} required /></div>
          <div><label className="label">Adresse</label><input className="input" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date de naissance</label><input type="date" className="input" value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} /></div>
            <div><label className="label">Fonction</label><input className="input" value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Situation familiale</label><input className="input" placeholder="Marie(e)" value={form.situationFamiliale} onChange={(e) => setForm({ ...form, situationFamiliale: e.target.value })} /></div>
            <div><label className="label">Nombre d'enfants</label><input type="number" min="0" className="input" value={form.nombreEnfants} onChange={(e) => setForm({ ...form, nombreEnfants: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">N° C.N.S.S.</label><input className="input" value={form.cnss} onChange={(e) => setForm({ ...form, cnss: e.target.value })} /></div>
            <div><label className="label">N° CIMR</label><input className="input" value={form.cimr} onChange={(e) => setForm({ ...form, cimr: e.target.value })} /></div>
          </div>
          <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
          <div><label className="label">Date d'embauche</label><input type="date" className="input" value={form.dateEmbauche} onChange={(e) => setForm({ ...form, dateEmbauche: e.target.value })} required /></div>
          <div><label className="label">Société</label>
            <select className="input" value={form.societe} onChange={(e) => setForm({ ...form, societe: e.target.value })}>
              <option value="OXYRAL">Oxyral</option>
              <option value="CHIMIRAL">Chimiral</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">{editId ? 'Modifier' : 'Créer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
