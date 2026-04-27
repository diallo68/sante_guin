'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Stethoscope, Calendar,
  LogOut, Menu, X, ShieldCheck,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [user, setUser] = useState<{ firstName: string; lastName: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user || data.user.role !== 'admin') {
          router.replace('/auth/login');
        } else {
          setUser(data.user);
        }
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  const menu = [
    { label: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Utilisateurs', href: '/admin/users', icon: Users },
    { label: 'Médecins', href: '/admin/doctors', icon: Stethoscope },
    { label: 'Rendez-vous', href: '/admin/appointments', icon: Calendar },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${open ? 'w-60' : 'w-16'} bg-slate-900 text-white flex flex-col transition-all duration-300`}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
          {open && (
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-teal-400" />
              <span className="font-bold text-teal-400">Admin</span>
            </div>
          )}
          <button onClick={() => setOpen(!open)} className="p-1.5 hover:bg-slate-700 rounded-lg">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menu.map(item => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  active ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {open && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {open && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Administration — Guinée Santé</h1>
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-teal-600 font-medium">Administrateur</p>
              </div>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
