'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Receipt,
  Banknote,
  Building2,
  Truck,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  FileCheck,
  Database,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employes', label: 'Employés', icon: Users },
  { href: '/conges', label: 'Congés', icon: Calendar },
  { href: '/bulletins', label: 'Bulletins de paie', icon: FileText },
  { href: '/factures', label: 'Factures', icon: Receipt },
  { href: '/bons-de-livraison', label: 'Bons de livraison', icon: FileCheck },
  { href: '/devis', label: 'Devis', icon: FileText },
  { href: '/traites', label: 'Traites & Chèques', icon: Banknote },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/fournisseurs', label: 'Fournisseurs', icon: Truck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const NavContent = () => (
    <>
      <div className="mb-8 px-4">
        <h1 className="text-xl font-bold text-brand-600 dark:text-brand-500">
          Beta ERP
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Oxyral & Chimiral
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-gray-200 p-3 dark:border-gray-800">
        <button
          onClick={async () => {
            try {
              const { backupApi } = await import('@/lib/api');
              await backupApi.downloadBackup();
            } catch (err: any) {
              alert('Erreur lors du téléchargement de la sauvegarde : ' + err.message);
            }
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          title="Télécharger une copie de sauvegarde de la base de données"
        >
          <Database size={16} />
          Sauvegarder BDD
        </button>
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sticky Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-bold text-brand-600 dark:text-brand-500">Beta ERP</span>
        </div>
        <button
          onClick={toggleTheme}
          className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:static lg:shadow-none lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
        <NavContent />
      </aside>
    </>
  );
}
