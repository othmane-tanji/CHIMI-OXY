const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Non autorisé');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erreur serveur' }));
    const raw = err.message;
    const msg =
      typeof raw === 'string'
        ? raw
        : raw?.avertissement || raw?.message || 'Erreur serveur';
    const error = new Error(msg) as Error & { details?: Record<string, unknown> };
    if (typeof raw === 'object' && raw) error.details = raw;
    throw error;
  }

  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ access_token: string; user: { id: number; email: string; nom: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),
};

export const dashboardApi = {
  getStats: () => api<any>('/dashboard/stats'),
};

export const employesApi = {
  getAll: (societe?: string) =>
    api<any[]>(`/employes${societe ? `?societe=${societe}` : ''}`),
  create: (data: any) => api('/employes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    api(`/employes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => api(`/employes/${id}`, { method: 'DELETE' }),
};

export const clientsApi = {
  getAll: () => api<any[]>('/clients'),
  create: (data: any) => api('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    api(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => api(`/clients/${id}`, { method: 'DELETE' }),
};

export const fournisseursApi = {
  getAll: () => api<any[]>('/fournisseurs'),
  create: (data: any) =>
    api('/fournisseurs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    api(`/fournisseurs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => api(`/fournisseurs/${id}`, { method: 'DELETE' }),
};

export const congesApi = {
  getAll: (params?: { employeId?: number; mois?: number; annee?: number }) => {
    const q = new URLSearchParams();
    if (params?.employeId) q.set('employeId', String(params.employeId));
    if (params?.mois) q.set('mois', String(params.mois));
    if (params?.annee) q.set('annee', String(params.annee));
    const query = q.toString();
    return api<any[]>(`/conges${query ? `?${query}` : ''}`);
  },
  getSoldes: (mois: number, annee: number) =>
    api<any>(`/conges/soldes?mois=${mois}&annee=${annee}`),
  getSolde: (employeId: number) => api<any>(`/conges/solde/${employeId}`),
  getResumeMensuel: (employeId: number, annee: number) =>
    api<any>(`/conges/resume-mensuel/${employeId}?annee=${annee}`),
  create: (data: any) => api('/conges', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: number) => api(`/conges/${id}`, { method: 'DELETE' }),
};

export const bulletinsApi = {
  getAll: () => api<any[]>('/bulletins'),
  getCalculPreview: (params: Record<string, string | number>) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
    );
    return api<any>(`/bulletins/calcul-preview?${q}`);
  },
  create: (data: any) => api('/bulletins', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    api(`/bulletins/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => api(`/bulletins/${id}`, { method: 'DELETE' }),
  downloadPdf: async (id: number, filename: string) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/bulletins/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Téléchargement PDF impossible');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const facturesApi = {
  getAchat: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any[]>(`/factures/achat${q}`);
  },
  getVente: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any[]>(`/factures/vente${q}`);
  },
  getVenteOne: (id: number) => api<any>(`/factures/vente/${id}`),
  getProchainNumero: (annee?: number, societe?: string) => {
    const params: Record<string, string> = {};
    if (annee) params.annee = String(annee);
    if (societe) params.societe = societe;
    const q = '?' + new URLSearchParams(params).toString();
    return api<{ numeroFacture: string; sequence: number; annee: number }>(
      `/factures/vente/prochain-numero${q}`,
    );
  },
  setSequence: (annee: number, sequence: number, societe?: string) => {
    const q = societe ? `?societe=${societe}` : '';
    return api(`/factures/vente/config/${annee}${q}`, {
      method: 'PUT',
      body: JSON.stringify({ sequence }),
    });
  },
  calculPreview: (lignes: { designation: string; quantite: number; prixUnitaire: number }[]) =>
    api<any>('/factures/vente/calcul', {
      method: 'POST',
      body: JSON.stringify({ lignes }),
    }),
  createAchat: (data: any) =>
    api<any>('/factures/achat', { method: 'POST', body: JSON.stringify(data) }),
  createVente: (data: any) =>
    api<any>('/factures/vente', { method: 'POST', body: JSON.stringify(data) }),
  updateAchat: (id: number, data: any) =>
    api<any>(`/factures/achat/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateVente: (id: number, data: any) =>
    api<any>(`/factures/vente/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeAchat: (id: number) => api(`/factures/achat/${id}`, { method: 'DELETE' }),
  removeVente: (id: number) => api(`/factures/vente/${id}`, { method: 'DELETE' }),
  downloadVentePdf: async (id: number, filename: string) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/factures/vente/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Téléchargement PDF impossible');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const traitesApi = {
  getEncaissements: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any[]>(`/traites/encaissement${q}`);
  },
  getDecaissements: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any[]>(`/traites/decaissement${q}`);
  },
  createEncaissement: (data: any) =>
    api('/traites/encaissement', { method: 'POST', body: JSON.stringify(data) }),
  createDecaissement: (data: any) =>
    api('/traites/decaissement', { method: 'POST', body: JSON.stringify(data) }),
  updateEncaissement: (id: number, data: any) =>
    api(`/traites/encaissement/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateDecaissement: (id: number, data: any) =>
    api(`/traites/decaissement/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeEncaissement: (id: number) =>
    api(`/traites/encaissement/${id}`, { method: 'DELETE' }),
  removeDecaissement: (id: number) =>
    api(`/traites/decaissement/${id}`, { method: 'DELETE' }),
};
