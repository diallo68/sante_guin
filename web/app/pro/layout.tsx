'use client';

import { ReactNode, useState, useEffect, ElementType } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, FileText, Clock, User, Star, LogOut, Menu, X, Building2, Package, FlaskConical, PlusCircle, Settings, Users, MessageSquare, Lock, ShieldAlert, BrainCircuit } from 'lucide-react';
import { logout } from '@/lib/clientLogout';

interface ProLayoutProps {
  children: ReactNode;
}

type AccessState = 'loading' | 'granted' | 'denied';
type DenyReason  = 'not_authenticated' | 'wrong_role' | 'no_profile' | 'none' | 'expired' | 'suspended' | 'server_error' | '';

const DENY_MESSAGES: Record<DenyReason, { title: string; body: string }> = {
  not_authenticated: { title: 'Connexion requise',      body: 'Veuillez vous connecter pour accéder à l\'espace professionnel.' },
  wrong_role:        { title: 'Accès non autorisé',     body: 'Seuls les médecins, pharmacies et laboratoires peuvent accéder à cet espace.' },
  no_profile:        { title: 'Profil introuvable',     body: 'Votre profil professionnel n\'a pas encore été créé. Contactez l\'administration.' },
  none:              { title: 'Abonnement requis',      body: 'Vous n\'avez pas encore souscrit à l\'option Pro. Accédez au tableau de bord, rendez-vous, documents et suivi patients en souscrivant.' },
  expired:           { title: 'Abonnement expiré',      body: 'Votre abonnement Pro a expiré. Renouvelez-le pour accéder à toutes les fonctionnalités.' },
  suspended:         { title: 'Compte suspendu',        body: 'Votre abonnement a été suspendu. Contactez l\'administration pour plus d\'informations.' },
  server_error:      { title: 'Erreur serveur',         body: 'Une erreur est survenue lors de la vérification de votre accès. Réessayez.' },
  '':                { title: 'Accès refusé',           body: 'Vous n\'avez pas accès à cette section.' },
};

export default function ProLayout({ children }: ProLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ firstName: string; lastName: string; role: string } | null>(null);
  const [unread, setUnread] = useState(0);
  const [access, setAccess] = useState<AccessState>('loading');
  const [denyReason, setDenyReason] = useState<DenyReason>('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAccess = () =>
      Promise.all([
        fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
        fetch('/api/pro/access').then(r => r.json().then(d => ({ ok: r.ok, ...d }))),
      ]).then(([meData, accessData]) => {
        setUser(meData?.user || null);
        if (accessData.isPro) {
          setAccess('granted');
          return true;
        } else {
          setAccess('denied');
          setDenyReason((accessData.reason as DenyReason) || '');
          if (accessData.reason === 'not_authenticated') {
            router.push('/auth/login');
          }
          return false;
        }
      }).catch(() => {
        setAccess('denied');
        setDenyReason('server_error');
        return false;
      });

    // Vérification initiale
    checkAccess();

    // Poll toutes les 10s quand accès refusé pour détecter l'activation
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      pollInterval = setInterval(async () => {
        const granted = await checkAccess();
        if (granted && pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }, 10000);
    };

    // On démarre le poll après la vérification initiale si pas encore accordé
    const initTimer = setTimeout(() => {
      if (access !== 'granted') startPolling();
    }, 500);

    const fetchUnread = () => {
      fetch('/api/conversations/unread')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUnread(data.count); })
        .catch(() => {});
    };
    fetchUnread();
    const unreadInterval = setInterval(fetchUnread, 30000);

    return () => {
      clearTimeout(initTimer);
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(unreadInterval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const menuItems: { label: string; href: string; icon: React.ElementType; badge?: number }[] = [
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
    ...(user?.role === 'doctor' ? [{
      label: 'Nos Patients',
      href: '/pro/patients',
      icon: Users,
    }] : []),
    {
      label: 'Messages',
      href: '/pro/messages',
      icon: MessageSquare,
      badge: unread,
    },
    {
      label: 'Votre Collaborateur',
      href: '/pro/ai',
      icon: BrainCircuit,
    },
    {
      label: 'Créer Votre Établissement',
      href: '/pro/cabinet/new',
      icon: PlusCircle,
    },
    {
      label: 'Gérer Votre Établissement',
      href: '/pro/cabinet',
      icon: user?.role === 'pharmacist' ? Package : user?.role === 'laboratorist' ? FlaskConical : Building2,
    },
  ];

  const isActive = (href: string) => pathname === href;

  // ── Chargement ──
  if (access === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Accès refusé ──
  if (access === 'denied') {
    const msg = DENY_MESSAGES[denyReason] ?? DENY_MESSAGES[''];
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {denyReason === 'not_authenticated' || denyReason === 'wrong_role'
              ? <ShieldAlert className="w-10 h-10 text-red-500" />
              : <Lock className="w-10 h-10 text-red-500" />
            }
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">{msg.title}</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">{msg.body}</p>

          {(denyReason === 'none' || denyReason === 'expired') && (
            <Link
              href="/pro-avantages"
              className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-3 px-6 rounded-xl transition-all mb-3"
            >
              🚀 Découvrir l'offre Pro
            </Link>
          )}
          {denyReason === 'not_authenticated' && (
            <Link
              href="/auth/login"
              className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-3 px-6 rounded-xl transition-all mb-3"
            >
              Se connecter
            </Link>
          )}
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-teal-600">MD Pro</h1>
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
            const Icon = item.icon as ElementType<{ size: number }>;
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
                <div className="relative flex-shrink-0">
                  <Icon size={20} />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
                {sidebarOpen && (
                  <span className="flex-1 flex items-center justify-between">
                    {item.label}
                    {item.badge ? <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">{item.badge}</span> : null}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
            </div>
            {user && (
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            )}
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
