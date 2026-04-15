'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Heart, Calendar, Pill, User, MessageSquare, LogOut, Settings, ArrowRight, Star, MapPin, Clock } from 'lucide-react';

interface ProSubscriber {
  id: string;
  name: string;
  type: 'doctor' | 'pharmacy';
  specialty?: string;
  address: string;
  rating: number;
  reviews: number;
  icon: string;
  color: string;
  hours?: string;
  services?: string[];
}

const proSubscribers: ProSubscriber[] = [
  {
    id: '1',
    name: 'Cabinet Dr. Diallo',
    type: 'doctor',
    specialty: 'Cardiologie',
    address: 'Kindia, Conakry',
    rating: 4.8,
    reviews: 124,
    icon: '🏥',
    color: '#0066CC',
    hours: '08:00 - 18:00',
  },
  {
    id: '2',
    name: 'Pharmacie Centrale',
    type: 'pharmacy',
    address: 'Plateau, Conakry',
    rating: 4.6,
    reviews: 98,
    icon: '💊',
    color: '#00AA44',
    hours: '08:00 - 22:00',
    services: ['Livraison', 'Consultation'],
  },
  {
    id: '3',
    name: 'Clinique Santé Plus',
    type: 'doctor',
    specialty: 'Médecine générale',
    address: 'Almamya, Conakry',
    rating: 4.9,
    reviews: 156,
    icon: '🏥',
    color: '#FF6B6B',
    hours: '08:00 - 20:00',
  },
  {
    id: '4',
    name: 'Pharmacie du Marché',
    type: 'pharmacy',
    address: 'Dixinn, Conakry',
    rating: 4.5,
    reviews: 76,
    icon: '💊',
    color: '#FFB84D',
    hours: '07:00 - 21:00',
    services: ['Livraison', 'Ordonnances'],
  },
];

const upcomingAppointments = [
  {
    id: '1',
    doctorName: 'Dr. Ahmed Diallo',
    date: '2026-04-20',
    time: '14:00',
    specialty: 'Cardiologue',
  },
  {
    id: '2',
    doctorName: 'Dr. Fatou Sow',
    date: '2026-04-25',
    time: '10:30',
    specialty: 'Généraliste',
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <span className="text-xl font-bold text-gray-900">Guinée Santé</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#doctors" className="text-gray-600 hover:text-gray-900">Médecins</Link>
              <Link href="#pharmacies" className="text-gray-600 hover:text-gray-900">Pharmacies</Link>
              <Link href="#pro" className="text-gray-600 hover:text-gray-900 font-semibold text-orange-600">Option Pro</Link>
              {isLoggedIn ? (
                <div className="flex items-center gap-4">
                  <button className="text-gray-600 hover:text-gray-900">
                    <MessageSquare size={20} />
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    <User size={20} />
                  </button>
                  <button
                    onClick={() => setIsLoggedIn(false)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Connexion
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link href="#doctors" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Médecins</Link>
              <Link href="#pharmacies" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Pharmacies</Link>
              <Link href="#pro" className="block px-4 py-2 text-orange-600 hover:bg-orange-50 rounded font-semibold">Option Pro</Link>
              {isLoggedIn ? (
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-left"
                >
                  Déconnexion
                </button>
              ) : (
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Connexion
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section with Pro Banner */}
        <section className="py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Text */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Votre santé, <span className="text-blue-600">simplifiée</span>
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Trouvez les meilleurs médecins et pharmacies de Conakry, prenez rendez-vous en ligne et gérez votre dossier médical en toute sécurité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/doctors"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                >
                  Trouver un médecin <ArrowRight size={20} />
                </Link>
                <Link
                  href="/pharmacies"
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold flex items-center justify-center gap-2"
                >
                  Trouver une pharmacie <ArrowRight size={20} />
                </Link>
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="text-6xl">🏥</div>
            </div>
          </div>
        </section>

        {/* Pro Subscription Banner - FEATURED */}
        <section id="pro" className="py-12 mb-12">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12">
              {/* Left: Content */}
              <div className="flex flex-col justify-center">
                <div className="text-5xl mb-4">✨</div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Développez votre activité avec l'Option Pro
                </h2>
                <p className="text-lg opacity-95 mb-6">
                  Médecins, cabinets et pharmacies : accédez à des outils avancés pour gérer vos patients, documents, ordonnances et bien plus.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    <span>Gestion complète des documents et ordonnances</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <span>Calendrier de rendez-vous intégré</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    <span>Messagerie sécurisée avec les patients</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <span>Tableau de bord avec statistiques</span>
                  </li>
                </ul>
                <button className="w-full sm:w-auto bg-white text-orange-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition text-lg">
                  Créer Votre Espace Pro
                </button>
              </div>

              {/* Right: Pricing */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6">Plans d'abonnement</h3>
                
                <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 border border-white border-opacity-20">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg">Mensuel</h4>
                    <span className="text-2xl font-bold">29 900 FG</span>
                  </div>
                  <p className="text-sm opacity-90">Sans engagement</p>
                </div>

                <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 border border-white border-opacity-20">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg">3 Mois</h4>
                    <span className="text-2xl font-bold">79 900 FG</span>
                  </div>
                  <p className="text-sm opacity-90">Sans engagement</p>
                </div>

                <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4 border-2 border-white">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg">Annuel</h4>
                    <span className="text-2xl font-bold">299 900 FG</span>
                  </div>
                  <p className="text-sm opacity-90">Meilleure offre • Économisez 25%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Pro Subscribers */}
        <section id="doctors" className="py-12 mb-12">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              🏥 Nos Cabinets & Pharmacies Partenaires
            </h2>
            <p className="text-gray-600 text-lg">
              Découvrez nos professionnels de santé abonnés à l'option Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proSubscribers.map((subscriber) => (
              <div
                key={subscriber.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition overflow-hidden border-t-4"
                style={{ borderTopColor: subscriber.color }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{subscriber.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{subscriber.name}</h3>
                        {subscriber.specialty && (
                          <p className="text-sm text-gray-600">{subscriber.specialty}</p>
                        )}
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      Pro
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.floor(subscriber.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">{subscriber.rating}</span>
                    <span className="text-sm text-gray-600">({subscriber.reviews} avis)</span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} />
                      <span className="text-sm">{subscriber.address}</span>
                    </div>
                    {subscriber.hours && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        <span className="text-sm">{subscriber.hours}</span>
                      </div>
                    )}
                  </div>

                  {/* Services */}
                  {subscriber.services && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {subscriber.services.map(service => (
                        <span key={service} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          {service}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <button className="w-full py-2 rounded-lg font-semibold transition" style={{
                    backgroundColor: subscriber.color,
                    color: 'white'
                  }}>
                    {subscriber.type === 'doctor' ? 'Prendre rendez-vous' : 'Envoyer ordonnance'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-lg"
            >
              Voir tous nos partenaires Pro <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* Upcoming Appointments */}
        <section className="py-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Rendez-vous à venir</h2>
          <div className="space-y-4">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border-l-4 border-blue-600">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{apt.doctorName}</h3>
                    <p className="text-gray-600 mb-3">{apt.specialty}</p>
                    <div className="flex gap-6 text-sm text-gray-600">
                      <span>📅 {new Date(apt.date).toLocaleDateString('fr-FR')}</span>
                      <span>🕐 {apt.time}</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Health Tips */}
        <section className="py-12 mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-8 md:p-12">
            <h3 className="text-2xl font-bold mb-3">💡 Conseil santé du jour</h3>
            <p className="text-lg opacity-95">
              Consultez régulièrement un médecin pour maintenir une bonne santé et prévenir les maladies. Une visite annuelle de contrôle est recommandée, même si vous vous sentez bien.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">À propos</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Qui sommes-nous</Link></li>
                <li><Link href="#" className="hover:text-white">Nos services</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Centre d'aide</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Conditions</Link></li>
                <li><Link href="#" className="hover:text-white">Confidentialité</Link></li>
                <li><Link href="#" className="hover:text-white">Cookies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Nous suivre</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Facebook</Link></li>
                <li><Link href="#" className="hover:text-white">Twitter</Link></li>
                <li><Link href="#" className="hover:text-white">Instagram</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 Guinée Santé. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
