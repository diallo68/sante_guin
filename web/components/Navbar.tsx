'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, X, User, LogOut, Calendar, ChevronDown, MessageSquare, ShieldCheck, Search } from 'lucide-react';
import { logout } from '@/lib/clientLogout';

interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/doctors?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = () => {
      // Messages non lus
      fetch('/api/conversations/unread')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUnread(data.count); })
        .catch(() => {});

      // Demandes Pro en attente (admin uniquement)
      if (user.role === 'admin') {
        fetch('/api/admin/subscription-requests?status=pending')
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) setPendingRequests(data.requests?.length || 0); })
          .catch(() => {});
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setDropdownOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/logo.png" alt="Mondocteur" width={36} height={36} className="object-contain" />
            <span className="text-xl font-bold text-gray-900">Mondocteur</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex flex-1 items-center gap-4">
            {/* Barre de recherche — flex-1 */}
            <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 bg-gray-100 hover:bg-gray-200 transition rounded-xl px-3 py-2">
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Médecin, spécialité..."
                className="flex-1 outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400"
              />
            </form>

            <Link href="/doctors" className="text-gray-600 hover:text-gray-900 font-medium text-sm whitespace-nowrap">
              Médecins
            </Link>
            <Link href="/pharmacies" className="text-gray-600 hover:text-gray-900 font-medium text-sm whitespace-nowrap">
              Pharmacies
            </Link>
            <Link href="/laboratories" className="text-gray-600 hover:text-gray-900 font-medium text-sm whitespace-nowrap">
              Laboratoires
            </Link>
            {user && (user.role === 'doctor' || user.role === 'pharmacist' || user.role === 'laboratorist') && (
              <Link href="/pro/cabinet" className="text-teal-700 hover:text-teal-900 font-semibold text-sm whitespace-nowrap">
                {user.role === 'pharmacist' ? 'Ma Pharmacie' : user.role === 'laboratorist' ? 'Mon Laboratoire' : 'Mon Cabinet'}
              </Link>
            )}

            {loading ? (
              <div className="w-24 h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    {(unread + pendingRequests) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {(unread + pendingRequests) > 99 ? '99+' : unread + pendingRequests}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">{user.firstName}</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-teal-700 hover:bg-teal-50 font-semibold"
                      >
                        <ShieldCheck size={16} />
                        Tableau de bord Admin
                      </Link>
                    )}
                    {(user.role === 'doctor' || user.role === 'pharmacist') && (
                      <Link
                        href="/pro/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Calendar size={16} />
                        Espace Pro
                      </Link>
                    )}
                    <Link
                      href={user.role === 'doctor' || user.role === 'pharmacist' ? '/pro/messages' : '/messages'}
                      onClick={() => { setDropdownOpen(false); setUnread(0); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <div className="relative">
                        <MessageSquare size={16} />
                        {unread > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      Messages
                      {unread > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">{unread}</span>}
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={16} />
                      Mon Profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold transition">
                  Connexion
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3">
          {/* Recherche mobile */}
          <form onSubmit={e => { handleSearch(e); setMenuOpen(false); }} className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Médecin, spécialité..."
              className="flex-1 outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400"
            />
          </form>
          <Link href="/doctors" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium">
            Médecins
          </Link>
          <Link href="/pharmacies" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium">
            Pharmacies
          </Link>
          <Link href="/laboratories" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium">
            Laboratoires
          </Link>
          {user && (user.role === 'doctor' || user.role === 'pharmacist' || user.role === 'laboratorist') && (
            <Link href="/pro/cabinet" onClick={() => setMenuOpen(false)} className="block py-2 text-teal-700 font-semibold">
              {user.role === 'pharmacist' ? 'Ma Pharmacie' : user.role === 'laboratorist' ? 'Mon Laboratoire' : 'Mon Cabinet'}
            </Link>
          )}
          <div className="border-t border-gray-200 pt-3">
            {user ? (
              <>
                <p className="text-sm font-semibold text-gray-900 mb-2">{user.firstName} {user.lastName}</p>
                {user.role === 'admin' && (
                  <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 text-teal-700 font-semibold">
                    Tableau de bord Admin
                  </Link>
                )}
                {(user.role === 'doctor' || user.role === 'pharmacist') && (
                  <Link href="/pro/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 text-blue-600 font-medium">
                    Espace Pro
                  </Link>
                )}
                <Link
                  href={user.role === 'doctor' || user.role === 'pharmacist' ? '/pro/messages' : '/messages'}
                  onClick={() => { setMenuOpen(false); setUnread(0); }}
                  className="flex items-center gap-2 py-2 text-gray-700 font-medium"
                >
                  Messages
                  {unread > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">{unread}</span>}
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium">
                  Mon Profil
                </Link>
                <button onClick={handleLogout} className="block py-2 text-red-600 font-medium">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="block py-2 text-teal-600 font-semibold">
                  Connexion
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
