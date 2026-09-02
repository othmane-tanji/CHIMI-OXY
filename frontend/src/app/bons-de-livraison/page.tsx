'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, FileDown, Trash2 } from 'lucide-react';
import { facturesApi, clientsApi } from '@/lib/api';
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

type Tab = 'bl-oxyral' | 'bl-chimiral';

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
    conditionPaiement: '60 JRs de la réception de facture',
    modeLivraison: 'Par nos soins',
    lignes: [emptyLigne()],
    sequenceConfig: '',
    chantier: '',
    afficherChantier: false,
    hasBl: true,
  };
};

export default function BonsDeLivraisonPage() {
  const [tab, setTab] = useState<Tab>('bl-oxyral');
  const [factures, setFactures] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [error, setError] = useState('');
  const [montantLettres, setMontantLettres] = useState('');
  const [formVente, setFormVente] = useState(() => emptyVenteForm(false));
  const [lastFactureNum, setLastFactureNum] = useState('');

  const filteredFactures = useMemo(() => {
    // Only display sales invoices that have BL generated
    return factures.filter((f) => f.hasBl);
  }, [factures]);

  const totaux = useMemo(
    () => calculerTotaux(formVente.lignes),
    [formVente.lignes],
  );

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (dateDebut) params.dateDebut = dateDebut;
    if (dateFin) params.dateFin = dateFin;

    const societe = tab === 'bl-chimiral' ? 'CHIMIRAL' : 'OXYRAL';
    facturesApi.getVente({ ...params, societe }).then(setFactures);
  }, [tab, search, dateDebut, dateFin]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    clientsApi.getAll().then(setClients);
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
    if (!modal) return;
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
  }, [formVente.lignes, modal]);

  const loadProchainNumero = async (date?: string) => {
    const annee = date ? new Date(date).getFullYear() : new Date().getFullYear();
    const societe = tab === 'bl-chimiral' ? 'CHIMIRAL' : 'OXYRAL';
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
    const isChimiral = tab === 'bl-chimiral';
    const initial = emptyVenteForm(isChimiral);
    setFormVente(initial);
    await loadProchainNumero(initial.dateFacture);
    setModal(true);
  };

  const openEdit = async (f: any) => {
    setError('');
    setEditId(f.id);
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
      conditionPaiement: full.conditionPaiement || '60 JRs de la réception de facture',
      modeLivraison: full.modeLivraison || 'Par nos soins',
      chantier: full.chantier || '',
      lignes: full.lignes?.length
        ? full.lignes.map((l: any) => ({
            designation: l.designation,
            quantite: String(l.quantite),
            prixUnitaire: String(l.prixUnitaire),
          }))
        : [emptyLigne()],
      sequenceConfig: full.numeroFacture.split('/')[1] || '',
      afficherChantier: full.afficherChantier ?? Boolean(full.chantier),
      hasBl: full.hasBl ?? true,
    });
    setMontantLettres(full.montantEnLettres || '');
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
      const societe = tab === 'bl-chimiral' ? 'CHIMIRAL' : 'OXYRAL';
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
        modeLivraison: formVente.modeLivraison || undefined,
        chantier: formVente.afficherChantier ? formVente.chantier : undefined,
        afficherChantier: formVente.afficherChantier,
        lignes,
        societe,
        hasBl: formVente.hasBl,
      };
      let saved;
      if (editId) saved = await facturesApi.updateVente(editId, payload);
      else saved = await facturesApi.createVente(payload);

      setModal(false);
      load();

      if (saved?.id) {
        const soc = (saved.societe || societe).toLowerCase();
        await facturesApi.downloadVenteBlExcel(
          saved.id,
          `bon-livraison-${soc}-${saved.numeroFacture.replace(/\//g, '-')}.xlsx`,
        );
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownload = async (f: any) => {
    const societeName = (f.societe || 'oxyral').toLowerCase();
    await facturesApi.downloadVenteBlPdf(
      f.id,
      `bon-livraison-${societeName}-${f.numeroFacture.replace(/\//g, '-')}.pdf`,
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce bon de livraison ? (Cela supprimera également la facture associée)')) return;
    await facturesApi.removeVente(id);
    load();
  };

  const openDetail = async (f: any) => {
    setDetailModal(await facturesApi.getVenteOne(f.id));
  };

  return (
    <div>
      <PageHeader
        title="Bons de Livraison"
        description={`Bons de livraison ${tab === 'bl-chimiral' ? 'CHIMIRAL' : 'OXYRAL'} — template PDF professionnel`}
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouveau bon de livraison
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setTab('bl-oxyral')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'bl-oxyral' ? 'bg-brand-600 text-white' : 'btn-secondary'}`}
        >
          Bons de livraison OXYRAL
        </button>
        <button
          onClick={() => setTab('bl-chimiral')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'bl-chimiral' ? 'bg-brand-600 text-white' : 'btn-secondary'}`}
        >
          Bons de livraison CHIMIRAL
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
              <th className="table-th">N° Bon de Livraison</th>
              <th className="table-th">Client</th>
              <th className="table-th">Date</th>
              <th className="table-th">Mode de livraison</th>
              <th className="table-th">Téléchargements</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFactures.map((f) => (
              <tr key={f.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="table-td font-medium">{f.numeroFacture}</td>
                <td className="table-td">
                  {f.clientNom || f.client?.nomClient}
                </td>
                <td className="table-td">{formatDate(f.dateFacture)}</td>
                <td className="table-td font-medium">
                  {f.modeLivraison || f.numeroAttach || 'Par nos soins'}
                </td>
                <td className="table-td">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDownload(f)}
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline text-xs font-medium"
                    >
                      <FileDown size={14} /> PDF
                    </button>
                    <button
                      onClick={() => {
                        const soc = (f.societe || (tab === 'bl-chimiral' ? 'chimiral' : 'oxyral')).toLowerCase();
                        facturesApi.downloadVenteBlExcel(f.id, `bon-livraison-${soc}-${f.numeroFacture.replace(/\//g, '-')}.xlsx`);
                      }}
                      className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      <FileDown size={14} /> BL Excel
                    </button>
                  </div>
                </td>
                <td className="table-td">
                  <button onClick={() => openDetail(f)} className="btn-secondary mr-2 text-xs">
                    Voir
                  </button>
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

      {/* Modal vente OXYRAL & CHIMIRAL */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? (tab === 'bl-chimiral' ? 'Modifier bon de livraison CHIMIRAL' : 'Modifier bon de livraison OXYRAL') : (tab === 'bl-chimiral' ? 'Nouveau bon de livraison CHIMIRAL' : 'Nouveau bon de livraison OXYRAL')}
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
              <label className="label">N° Bon de Livraison (Facture)</label>
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
            <h4 className="mb-2 font-semibold text-brand-600">{tab === 'bl-chimiral' ? 'Fournisseur (CHIMIRAL)' : 'Fournisseur (OXYRAL)'}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Téléphone</label>
                <input className="input" placeholder={tab === 'bl-chimiral' ? 'Ex. 05 22 33 29 05' : 'Ex. 0662 176 292'} value={formVente.telephone} onChange={(e) => setFormVente({ ...formVente, telephone: e.target.value })} />
              </div>
              <div>
                <label className="label">Mail</label>
                <input className="input" placeholder={tab === 'bl-chimiral' ? 'Ex. chimiral@oxyral.ma' : 'Ex. contact@oxyral.ma'} value={formVente.mail} onChange={(e) => setFormVente({ ...formVente, mail: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3 dark:border-gray-700">
            <h4 className="mb-2 font-semibold text-brand-600">Client</h4>
            <div className="mb-3">
              <label className="label">Pré-remplir depuis la liste</label>
              <select className="input" value={formVente.clientId} onChange={(e) => handleClientSelect(e.target.value)}>
                <option value="">Saisie manuelle...</option>
                {clients.filter((c) => c.societe === (tab === 'bl-chimiral' ? 'CHIMIRAL' : 'OXYRAL')).map((c) => (
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
                <input className="input font-semibold" placeholder="Rue, quartier — CASABLANCA" value={formVente.clientAdresse} onChange={(e) => setFormVente({ ...formVente, clientAdresse: e.target.value })} required={!['MARJANE HOLDING S.A.', 'MARJANE HOLDING SA', 'MARJANE HOLDING'].includes(formVente.clientNom?.trim().toUpperCase())} />
                <p className="mt-1 text-xs text-gray-500">La ville en MAJUSCULES à la fin sera affichée sur une ligne séparée (ex. tit mellil CASABLANCA).</p>
              </div>
              <div>
                <label className="label">ICE</label>
                <input className="input" value={formVente.clientIce} onChange={(e) => setFormVente({ ...formVente, clientIce: e.target.value })} />
              </div>
              <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800/40 dark:border-gray-700">
                <label className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formVente.afficherChantier}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormVente((f) => ({
                        ...f,
                        afficherChantier: checked,
                        chantier: checked ? (f.chantier || f.clientNom) : '',
                      }));
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Ajouter un Chantier sur le Bon de Livraison</span>
                </label>

                {formVente.afficherChantier && (
                  <div className="mt-3">
                    <label className="label text-brand-600 font-semibold">Nom / Libellé du Chantier</label>
                    <input
                      className="input font-semibold border-brand-300"
                      placeholder="Ex. MARJANE TANGER CITY CENTER 115..."
                      value={formVente.chantier}
                      onChange={(e) => setFormVente({ ...formVente, chantier: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Code Client</label>
              <input className="input" value={formVente.codeClient} onChange={(e) => setFormVente({ ...formVente, codeClient: e.target.value })} />
            </div>
            <div>
              <label className="label">N° Bon de Commande</label>
              <input className="input" placeholder="Ex. BC-2026-99" value={formVente.bonCommande} onChange={(e) => setFormVente({ ...formVente, bonCommande: e.target.value })} />
            </div>
            <div>
              <label className="label">Mode de livraison</label>
              <input className="input" placeholder="Par nos soins" value={formVente.modeLivraison} onChange={(e) => setFormVente({ ...formVente, modeLivraison: e.target.value })} />
            </div>
            <div>
              <label className="label">Condition de Paiement</label>
              <input
                className="input"
                placeholder="60 JRs de la réception de facture"
                value={formVente.conditionPaiement}
                onChange={(e) => setFormVente({ ...formVente, conditionPaiement: e.target.value })}
              />
            </div>
          </div>

          {/* We keep the checkbox checked by default and hidden since it's the BL page */}
          <input type="hidden" value="true" name="hasBl" />

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
                    <label className="label text-xs">{tab === 'bl-chimiral' ? 'Qté' : 'Qté m²'}</label>
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">
              {editId ? 'Enregistrer & regénérer PDF' : 'Créer & télécharger BL PDF'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Détail bon de livraison */}
      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={`Bon de Livraison associé à la Facture ${detailModal?.numeroFacture || ''}`}
        wide
      >
        {detailModal && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p><span className="text-gray-500">Date :</span> {formatDate(detailModal.dateFacture)}</p>
              <p><span className="text-gray-500">Client :</span> <strong>{detailModal.clientNom}</strong></p>
              <p className="sm:col-span-2"><span className="text-gray-500">Adresse :</span> <strong>{detailModal.clientAdresse}</strong></p>
              {detailModal.clientIce && <p><span className="text-gray-500">ICE :</span> {detailModal.clientIce}</p>}
              {detailModal.chantier && <p><span className="text-gray-500">Chantier :</span> <strong>{detailModal.chantier}</strong></p>}
              <p><span className="text-gray-500">Code client :</span> {detailModal.codeClient}</p>
              <p><span className="text-gray-500">Mode de livraison :</span> <strong>{detailModal.numeroAttach || '-'}</strong></p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="table-th text-left">Désignation</th>
                  <th className="table-th">Qté</th>
                  <th className="table-th">P.U HT</th>
                </tr>
              </thead>
              <tbody>
                {detailModal.lignes?.map((l: any) => (
                  <tr key={l.id} className="border-b">
                    <td className="table-td">{l.designation}</td>
                    <td className="table-td text-center">{formatMontantFacture(Number(l.quantite))}</td>
                    <td className="table-td text-right">{formatMontantFacture(Number(l.prixUnitaire))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  const soc = (detailModal.societe || 'oxyral').toLowerCase();
                  facturesApi.downloadVenteBlExcel(detailModal.id, `bon-livraison-${soc}-${detailModal.numeroFacture.replace(/\//g, '-')}.xlsx`);
                }}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              >
                <FileDown size={16} /> Télécharger BL Excel
              </button>
              <button
                onClick={() => handleDownload(detailModal)}
                className="btn-secondary flex items-center gap-2"
              >
                <FileDown size={16} /> Télécharger BL PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
