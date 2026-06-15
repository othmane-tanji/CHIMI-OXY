'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, FileDown, Trash2 } from 'lucide-react';
import { facturesApi, clientsApi, fournisseursApi } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { formatDate, formatMoney } from '@/lib/utils';
import {
  DEFAULTS_VENTE,
  DEFAULTS_VENTE_CHIMIRAL,
  calculerLigne,
  calculerTotaux,
  emptyLigne,
  formatMontantFacture,
  parseNum,
  type FactureLigneForm,
} from '@/lib/facture.utils';

type Tab = 'achat' | 'vente-oxyral' | 'vente-chimiral';

const emptyVenteForm = (isChimiral = false) => {
  const defaults = isChimiral ? DEFAULTS_VENTE_CHIMIRAL : DEFAULTS_VENTE;
  return {
    numeroFacture: '',
    dateFacture: new Date().toISOString().split('T')[0],
    telephone: defaults.telephone,
    mail: defaults.mail,
    clientId: '',
    clientNom: '',
    clientAdresse: '',
    clientIce: '',
    codeClient: defaults.codeClient,
    bonCommande: '',
    numeroAttach: '',
    conditionPaiement: 'CHÈQUE',
    lignes: [emptyLigne()],
    sequenceConfig: '',
  };
};

export default function FacturesPage() {
  const [tab, setTab] = useState<Tab>('vente-oxyral');
  const [factures, setFactures] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [error, setError] = useState('');
  const [montantLettres, setMontantLettres] = useState('');
  const [formAchat, setFormAchat] = useState({
    partenaireId: '',
    numeroFacture: '',
    dateFacture: '',
    montant: '',
  });
  const [formVente, setFormVente] = useState(() => emptyVenteForm(false));
  const [lastFactureNum, setLastFactureNum] = useState('');

  const isVente = tab.startsWith('vente');

  const totaux = useMemo(
    () => calculerTotaux(formVente.lignes),
    [formVente.lignes],
  );

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (dateDebut) params.dateDebut = dateDebut;
    if (dateFin) params.dateFin = dateFin;
    if (tab === 'achat') {
      facturesApi.getAchat(params).then(setFactures);
    } else {
      const societe = tab === 'vente-chimiral' ? 'CHIMIRAL' : 'OXYRAL';
      facturesApi.getVente({ ...params, societe }).then(setFactures);
    }
  }, [tab, search, dateDebut, dateFin]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    clientsApi.getAll().then(setClients);
    fournisseursApi.getAll().then(setFournisseurs);
  }, []);

  useEffect(() => {
    if (formVente.numeroFacture && formVente.numeroFacture !== lastFactureNum) {
      setLastFactureNum(formVente.numeroFacture);
      const parts = formVente.numeroFacture.split('/');
      if (parts.length === 2) {
        const YYYY = parts[0];
        const XXX = parts[1];
        if (YYYY.length === 4 && !isNaN(parseInt(YYYY, 10)) && !isNaN(parseInt(XXX, 10))) {
          const yy = YYYY.substring(2);
          setFormVente((f) => ({
            ...f,
            numeroAttach: `${yy}/${XXX}`,
          }));
        }
      }
    }
  }, [formVente.numeroFacture, lastFactureNum]);

  useEffect(() => {
    if (!modal || !isVente) return;
    const lignesValides = formVente.lignes.filter(
      (l) => l.designation && parseNum(l.quantite) > 0,
    );
    if (!lignesValides.length) {
      setMontantLettres('');
      return;
    }
    const timer = setTimeout(() => {
      facturesApi
        .calculPreview(
          lignesValides.map((l) => ({
            designation: l.designation,
            quantite: parseNum(l.quantite),
            prixUnitaire: parseNum(l.prixUnitaire),
          })),
        )
        .then((r) => setMontantLettres(r.montantEnLettres))
        .catch(() => setMontantLettres(''));
    }, 300);
    return () => clearTimeout(timer);
  }, [formVente.lignes, modal, isVente]);

  const loadProchainNumero = async (date?: string) => {
    const annee = date ? new Date(date).getFullYear() : new Date().getFullYear();
    const societe = tab === 'vente-chimiral' ? 'CHIMIRAL' : 'OXYRAL';
    const data = await facturesApi.getProchainNumero(annee, societe);
    setFormVente((f) => ({
      ...f,
      numeroFacture: data.numeroFacture,
      sequenceConfig: String(data.sequence),
    }));
  };

  const openCreate = async () => {
    setError('');
    setEditId(null);
    if (tab === 'achat') {
      setFormAchat({ partenaireId: '', numeroFacture: '', dateFacture: '', montant: '' });
    } else {
      const isChimiral = tab === 'vente-chimiral';
      const initial = emptyVenteForm(isChimiral);
      setFormVente(initial);
      await loadProchainNumero(initial.dateFacture);
    }
    setModal(true);
  };

  const openEdit = async (f: any) => {
    setError('');
    setEditId(f.id);
    if (tab === 'achat') {
      setFormAchat({
        partenaireId: String(f.fournisseurId),
        numeroFacture: f.numeroFacture,
        dateFacture: f.dateFacture.split('T')[0],
        montant: String(f.montant),
      });
    } else {
      const full = await facturesApi.getVenteOne(f.id);
      setFormVente({
        numeroFacture: full.numeroFacture,
        dateFacture: full.dateFacture.split('T')[0],
        telephone: full.telephone,
        mail: full.mail,
        clientId: full.clientId ? String(full.clientId) : '',
        clientNom: full.clientNom,
        clientAdresse: full.clientAdresse,
        clientIce: full.clientIce || '',
        codeClient: full.codeClient,
        bonCommande: full.bonCommande || '',
        numeroAttach: full.numeroAttach || '',
        conditionPaiement: full.conditionPaiement || 'CHÈQUE',
        lignes: full.lignes?.length
          ? full.lignes.map((l: any) => ({
              designation: l.designation,
              quantite: String(l.quantite),
              prixUnitaire: String(l.prixUnitaire),
            }))
          : [emptyLigne()],
        sequenceConfig: full.numeroFacture.split('/')[1] || '',
      });
      setMontantLettres(full.montantEnLettres || '');
    }
    setModal(true);
  };

  const handleClientSelect = (id: string) => {
    const client = clients.find((c) => String(c.id) === id);
    setFormVente((f) => ({
      ...f,
      clientId: id,
      clientNom: client?.nomClient || f.clientNom,
      clientAdresse: client
        ? [client.adresse, client.ville].filter(Boolean).join(' — ')
        : f.clientAdresse,
      clientIce: client?.ice || f.clientIce,
    }));
  };

  const updateLigne = (index: number, field: keyof FactureLigneForm, value: string) => {
    setFormVente((f) => {
      const lignes = [...f.lignes];
      lignes[index] = { ...lignes[index], [field]: value };
      return { ...f, lignes };
    });
  };

  const addLigne = () => {
    setFormVente((f) => ({ ...f, lignes: [...f.lignes, emptyLigne()] }));
  };

  const removeLigne = (index: number) => {
    setFormVente((f) => ({
      ...f,
      lignes: f.lignes.length > 1 ? f.lignes.filter((_, i) => i !== index) : f.lignes,
    }));
  };

  const handleSubmitAchat = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      numeroFacture: formAchat.numeroFacture,
      dateFacture: formAchat.dateFacture,
      montant: +formAchat.montant,
    };
    if (editId) await facturesApi.updateAchat(editId, data);
    else await facturesApi.createAchat({ ...data, fournisseurId: +formAchat.partenaireId });
    setModal(false);
    load();
  };

  const handleSubmitVente = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const lignes = formVente.lignes
        .filter((l) => l.designation.trim())
        .map((l) => ({
          designation: l.designation,
          quantite: parseNum(l.quantite),
          prixUnitaire: parseNum(l.prixUnitaire),
        }));
      if (!lignes.length) {
        setError('Ajoutez au moins une ligne de prestation.');
        return;
      }
      const societe = tab === 'vente-chimiral' ? 'CHIMIRAL' : 'OXYRAL';
      const payload = {
        numeroFacture: formVente.numeroFacture || undefined,
        dateFacture: formVente.dateFacture,
        telephone: formVente.telephone,
        mail: formVente.mail,
        clientId: formVente.clientId ? +formVente.clientId : undefined,
        clientNom: formVente.clientNom,
        clientAdresse: formVente.clientAdresse,
        clientIce: formVente.clientIce || undefined,
        codeClient: formVente.codeClient,
        bonCommande: formVente.bonCommande || undefined,
        numeroAttach: formVente.numeroAttach || undefined,
        conditionPaiement: formVente.conditionPaiement || undefined,
        lignes,
        societe,
      };
      let saved;
      if (editId) saved = await facturesApi.updateVente(editId, payload);
      else saved = await facturesApi.createVente(payload);

      setModal(false);
      load();
      if (saved?.id) {
        await facturesApi.downloadVentePdf(
          saved.id,
          `facture-${saved.numeroFacture.replace(/\//g, '-')}.pdf`,
        );
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownload = async (f: any) => {
    await facturesApi.downloadVentePdf(
      f.id,
      `facture-${f.numeroFacture.replace(/\//g, '-')}.pdf`,
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette facture ?')) return;
    if (tab === 'achat') await facturesApi.removeAchat(id);
    else await facturesApi.removeVente(id);
    load();
  };

  const openDetail = async (f: any) => {
    if (isVente) {
      setDetailModal(await facturesApi.getVenteOne(f.id));
    }
  };

  return (
    <div>
      <PageHeader
        title="Factures"
        description={
          isVente
            ? `Facturation ${tab === 'vente-chimiral' ? 'CHIMIRAL' : 'OXYRAL'} — template PDF professionnel`
            : 'Gestion des factures d\'achat'
        }
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> {isVente ? 'Nouvelle facture' : 'Ajouter'}
          </button>
        }
      />

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab('achat')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'achat' ? 'bg-brand-600 text-white' : 'btn-secondary'}`}
        >
          Factures d'achat
        </button>
        <button
          onClick={() => setTab('vente-oxyral')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'vente-oxyral' ? 'bg-brand-600 text-white' : 'btn-secondary'}`}
        >
          Factures de vente OXYRAL
        </button>
        <button
          onClick={() => setTab('vente-chimiral')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'vente-chimiral' ? 'bg-brand-600 text-white' : 'btn-secondary'}`}
        >
          Factures de vente CHIMIRAL
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
              <th className="table-th">{isVente ? 'Client' : 'Fournisseur'}</th>
              <th className="table-th">Date</th>
              <th className="table-th">{isVente ? 'Total TTC' : 'Montant'}</th>
              <th className="table-th">PDF</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="table-td font-medium">{f.numeroFacture}</td>
                <td className="table-td">
                  {tab === 'achat'
                    ? f.fournisseur?.nomFournisseur
                    : f.clientNom || f.client?.nomClient}
                </td>
                <td className="table-td">{formatDate(f.dateFacture)}</td>
                <td className="table-td font-semibold">
                  {formatMoney(isVente ? f.totalTtc || f.montant : f.montant)}
                </td>
                <td className="table-td">
                  {f.pdfPath ? (
                    isVente ? (
                      <button
                        onClick={() => handleDownload(f)}
                        className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                      >
                        <FileDown size={14} /> PDF
                      </button>
                    ) : (
                      '✓'
                    )
                  ) : (
                    '-'
                  )}
                </td>
                <td className="table-td">
                  {isVente && (
                    <button onClick={() => openDetail(f)} className="btn-secondary mr-2 text-xs">
                      Voir
                    </button>
                  )}
                  <button onClick={() => openEdit(f)} className="btn-secondary mr-2 text-xs">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="btn-danger text-xs">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal achat (simple) */}
      <Modal
        open={modal && tab === 'achat'}
        onClose={() => setModal(false)}
        title={editId ? 'Modifier facture achat' : 'Nouvelle facture achat'}
      >
        <form onSubmit={handleSubmitAchat} className="space-y-3">
          {!editId && (
            <div>
              <label className="label">Fournisseur</label>
              <select
                className="input"
                value={formAchat.partenaireId}
                onChange={(e) => setFormAchat({ ...formAchat, partenaireId: e.target.value })}
                required
              >
                <option value="">Sélectionner...</option>
                {fournisseurs.map((p) => (
                  <option key={p.id} value={p.id}>{p.nomFournisseur}</option>
                ))}
              </select>
            </div>
          )}
          <div><label className="label">N° Facture</label><input className="input" value={formAchat.numeroFacture} onChange={(e) => setFormAchat({ ...formAchat, numeroFacture: e.target.value })} required /></div>
          <div><label className="label">Date</label><input type="date" className="input" value={formAchat.dateFacture} onChange={(e) => setFormAchat({ ...formAchat, dateFacture: e.target.value })} required /></div>
          <div><label className="label">Montant (MAD)</label><input type="number" step="0.01" className="input" value={formAchat.montant} onChange={(e) => setFormAchat({ ...formAchat, montant: e.target.value })} required /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">{editId ? 'Modifier' : 'Créer'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal vente OXYRAL & CHIMIRAL */}
      <Modal
        open={modal && isVente}
        onClose={() => setModal(false)}
        title={editId ? (tab === 'vente-chimiral' ? 'Modifier facture CHIMIRAL' : 'Modifier facture OXYRAL') : (tab === 'vente-chimiral' ? 'Nouvelle facture CHIMIRAL' : 'Nouvelle facture OXYRAL')}
        wide
      >
        <form onSubmit={handleSubmitVente} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={formVente.dateFacture}
                onChange={(e) => {
                  setFormVente({ ...formVente, dateFacture: e.target.value });
                  if (!editId) loadProchainNumero(e.target.value);
                }}
                required
              />
            </div>
            <div>
              <label className="label">N° Facture (YYYY/XXX)</label>
              <input
                className="input"
                value={formVente.numeroFacture}
                onChange={(e) => setFormVente({ ...formVente, numeroFacture: e.target.value })}
                required
                readOnly={!editId}
              />
            </div>
            {!editId && (
              <div>
                <label className="label">Séquence (XXX) — configurable</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={formVente.sequenceConfig}
                  onChange={(e) => {
                    const seq = e.target.value;
                    const annee = new Date(formVente.dateFacture).getFullYear();
                    setFormVente({
                      ...formVente,
                      sequenceConfig: seq,
                      numeroFacture: seq ? `${annee}/${String(parseInt(seq, 10)).padStart(3, '0')}` : formVente.numeroFacture,
                    });
                  }}
                />
              </div>
            )}
          </div>

          <div className="rounded-lg border p-3 dark:border-gray-700">
            <h4 className="mb-2 font-semibold text-brand-600">{tab === 'vente-chimiral' ? 'Fournisseur (CHIMIRAL)' : 'Fournisseur (OXYRAL)'}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Téléphone</label>
                <input className="input" placeholder={tab === 'vente-chimiral' ? 'Ex. 05 22 33 29 05' : 'Ex. 0662 176 292'} value={formVente.telephone} onChange={(e) => setFormVente({ ...formVente, telephone: e.target.value })} />
              </div>
              <div>
                <label className="label">Mail</label>
                <input className="input" placeholder={tab === 'vente-chimiral' ? 'Ex. chimiral@oxyral.ma' : 'Ex. contact@oxyral.ma'} value={formVente.mail} onChange={(e) => setFormVente({ ...formVente, mail: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3 dark:border-gray-700">
            <h4 className="mb-2 font-semibold text-brand-600">Client</h4>
            <div className="mb-3">
              <label className="label">Pré-remplir depuis la liste</label>
              <select className="input" value={formVente.clientId} onChange={(e) => handleClientSelect(e.target.value)}>
                <option value="">Saisie manuelle...</option>
                {clients.filter((c) => c.societe === (tab === 'vente-chimiral' ? 'CHIMIRAL' : 'OXYRAL')).map((c) => (
                  <option key={c.id} value={c.id}>{c.nomClient}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="label">Nom du client (gras sur PDF)</label>
                <input className="input font-semibold" value={formVente.clientNom} onChange={(e) => setFormVente({ ...formVente, clientNom: e.target.value })} required />
              </div>
              <div>
                <label className="label">Adresse et ville (gras sur PDF)</label>
                <input className="input font-semibold" placeholder="Rue, quartier — CASABLANCA" value={formVente.clientAdresse} onChange={(e) => setFormVente({ ...formVente, clientAdresse: e.target.value })} required />
                <p className="mt-1 text-xs text-gray-500">La ville en MAJUSCULES à la fin sera affichée sur une ligne séparée (ex. tit mellil CASABLANCA).</p>
              </div>
              <div>
                <label className="label">ICE</label>
                <input className="input" value={formVente.clientIce} onChange={(e) => setFormVente({ ...formVente, clientIce: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Code Client</label>
              <input className="input" value={formVente.codeClient} onChange={(e) => setFormVente({ ...formVente, codeClient: e.target.value })} />
            </div>
            <div>
              <label className="label">Bon Commande</label>
              <input className="input" value={formVente.bonCommande} onChange={(e) => setFormVente({ ...formVente, bonCommande: e.target.value })} />
            </div>
            <div>
              <label className="label">N° Attach.</label>
              <input className="input" value={formVente.numeroAttach} onChange={(e) => setFormVente({ ...formVente, numeroAttach: e.target.value })} />
            </div>
            <div>
              <label className="label">Condition de Paiement</label>
              <select
                className="input"
                value={formVente.conditionPaiement}
                onChange={(e) => setFormVente({ ...formVente, conditionPaiement: e.target.value })}
              >
                <option value="CHÈQUE">CHÈQUE</option>
                <option value="ESPÈCES">ESPÈCES</option>
                <option value="EFFETS">EFFETS</option>
                <option value="VIREMENT">VIREMENT</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-semibold">Prestations / services</h4>
              <button type="button" onClick={addLigne} className="btn-secondary text-xs">
                + Ligne
              </button>
            </div>
            <div className="space-y-2">
              {formVente.lignes.map((ligne, i) => (
                <div key={i} className="grid gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label className="label text-xs">Désignation</label>
                    <textarea
                      className="input min-h-[60px]"
                      value={ligne.designation}
                      onChange={(e) => updateLigne(i, 'designation', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label text-xs">{tab === 'vente-chimiral' ? 'Qté' : 'Qté m²'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(i, 'quantite', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label text-xs">P.U HT</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      value={ligne.prixUnitaire}
                      onChange={(e) => updateLigne(i, 'prixUnitaire', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label text-xs">Montant HT</label>
                    <input
                      className="input bg-gray-100 dark:bg-gray-900"
                      value={formatMontantFacture(calculerLigne(ligne.quantite, ligne.prixUnitaire))}
                      readOnly
                    />
                  </div>
                  <div className="flex items-end sm:col-span-1">
                    <button type="button" onClick={() => removeLigne(i)} className="btn-danger p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg bg-brand-50 p-4 dark:bg-brand-900/20 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Total HT</p>
              <p className="text-xl font-bold">{formatMontantFacture(totaux.totalHt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">TVA (20 %)</p>
              <p className="text-xl font-bold">{formatMontantFacture(totaux.totalTva)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total TTC en DHS</p>
              <p className="text-xl font-bold text-brand-600">{formatMontantFacture(totaux.totalTtc)}</p>
            </div>
          </div>

          {montantLettres && (
            <div className="rounded-lg border border-dashed p-3 text-sm dark:border-gray-700">
              <span className="text-gray-500">Arrêté en lettres : </span>
              <strong>{montantLettres}</strong>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">
              {editId ? 'Enregistrer & regénérer PDF' : 'Créer & télécharger PDF'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Détail facture vente */}
      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={`Facture ${detailModal?.numeroFacture || ''}`}
        wide
      >
        {detailModal && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p><span className="text-gray-500">Date :</span> {formatDate(detailModal.dateFacture)}</p>
              <p><span className="text-gray-500">Client :</span> <strong>{detailModal.clientNom}</strong></p>
              <p className="sm:col-span-2"><span className="text-gray-500">Adresse :</span> <strong>{detailModal.clientAdresse}</strong></p>
              {detailModal.clientIce && <p><span className="text-gray-500">ICE :</span> {detailModal.clientIce}</p>}
              <p><span className="text-gray-500">Code client :</span> {detailModal.codeClient}</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="table-th text-left">Désignation</th>
                  <th className="table-th">Qté</th>
                  <th className="table-th">P.U HT</th>
                  <th className="table-th">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                {detailModal.lignes?.map((l: any) => (
                  <tr key={l.id} className="border-b">
                    <td className="table-td">{l.designation}</td>
                    <td className="table-td text-center">{formatMontantFacture(Number(l.quantite))}</td>
                    <td className="table-td text-right">{formatMontantFacture(Number(l.prixUnitaire))}</td>
                    <td className="table-td text-right">{formatMontantFacture(Number(l.montantHt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap gap-6">
              <p>Total HT : <strong>{formatMontantFacture(Number(detailModal.totalHt))}</strong></p>
              <p>TVA : <strong>{formatMontantFacture(Number(detailModal.totalTva))}</strong></p>
              <p>Total TTC : <strong className="text-brand-600">{formatMontantFacture(Number(detailModal.totalTtc))}</strong></p>
            </div>
            {detailModal.montantEnLettres && (
              <p className="italic">{detailModal.montantEnLettres}</p>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => handleDownload(detailModal)}
                className="btn-primary flex items-center gap-2"
              >
                <FileDown size={16} /> Télécharger PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
