'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Clock,
  User,
  Star,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface ProLayoutProps {
  children: ReactNode;
}

export default function ProLayout({ children }: ProLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    {
      label: 'Tableau de Bord',
      href: '/pro/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Rendez-vous',
      href: '/pro/appointments',
      icon: Calendar,
    },
    {
      label: 'Documents',
      href: '/pro/documents',
      icon: FileText,
    },
    {
      label: 'Horaires',
      href: '/pro/schedule',
      icon: Clock,
    },
    {
      label: 'Profil',
      href: '/pro/profile',
      icon: User,
    },
    {
      label: 'Avis',
      href: '/pro/reviews',
      icon: Star,
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-blue-600">GS Pro</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Espace Pro</h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              M
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
