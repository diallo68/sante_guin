'use client';

import Link from 'next/link';

const sitePages = [
  {
    category: 'Authentification',
    pages: [
      { name: 'Connexion', href: '/auth/login' },
      { name: 'Inscription', href: '/auth/signup' },
    ],
  },
  {
    category: 'Utilisateur',
    pages: [
      { name: 'Accueil', href: '/' },
      { name: 'Profil', href: '/profile' },
      { name: 'Messages', href: '/messages' },
      { name: 'Médecins', href: '/doctors' },
      { name: 'Pharmacies', href: '/pharmacies' },
    ],
  },
  {
    category: 'Administration',
    pages: [
      { name: 'Tableau de bord Admin', href: '/admin/dashboard' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Accueil
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Plan du site</h1>
          <p className="text-gray-600 mt-2">Navigation complète de l'application Guinée Santé</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sitePages.map((section) => (
            <div key={section.category} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{section.category}</h2>
              <ul className="space-y-2">
                {section.pages.map((page) => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      {page.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">À propos de cette version web</h3>
          <p className="text-blue-800 text-sm">
            Cette version web est une implémentation complète de l'application mobile Guinée Santé.
            Vous pouvez tester toutes les fonctionnalités et suggérer des modifications pour améliorer l'expérience utilisateur.
          </p>
        </div>
      </div>
    </div>
  );
}
