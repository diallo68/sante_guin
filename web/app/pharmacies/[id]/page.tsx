'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, Clock, Phone, Mail, Package, Truck, Heart, MessageCircle, ShoppingCart } from 'lucide-react';

export default function PharmacyDetailPage() {
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Mock data
  const pharmacy = {
    id: '1',
    name: 'Pharmacie Centrale',
    rating: 4.7,
    reviews: 145,
    distance: 1.2,
    location: 'Kindia, Conakry',
    image: '💊',
    isOpen: true,
    openingHours: '08:00 - 22:00',
    phone: '+224 622 123 456',
    email: 'contact@pharmaciecentrale.gn',
    experience: 15,
    bio: 'Pharmacie Centrale est votre partenaire santé de confiance depuis 15 ans. Nous offrons une large gamme de médicaments, produits de santé et services pharmaceutiques.',
    services: [
      'Livraison à domicile',
      'Consultation pharmaceutique',
      'Test rapide (COVID, Malaria, etc.)',
      'Vaccination',
      'Gestion des ordonnances',
      'Conseil en santé',
    ],
    deliveryInfo: {
      available: true,
      timeMin: 30,
      timeMax: 45,
      fee: 5000,
    },
    availability: [
      { day: 'Lundi', hours: '08:00 - 22:00' },
      { day: 'Mardi', hours: '08:00 - 22:00' },
      { day: 'Mercredi', hours: '08:00 - 22:00' },
      { day: 'Jeudi', hours: '08:00 - 22:00' },
      { day: 'Vendredi', hours: '08:00 - 22:00' },
      { day: 'Samedi', hours: '09:00 - 20:00' },
      { day: 'Dimanche', hours: '10:00 - 18:00' },
    ],
    certifications: [
      'Agrément Ministère de la Santé',
      'Certification ISO 9001',
      'Pharmacie Agréée',
    ],
    reviews: [
      {
        id: 1,
        author: 'Mariam D.',
        rating: 5,
        date: '2024-04-10',
        text: 'Excellente pharmacie ! Livraison rapide et produits de qualité. Je recommande !',
      },
      {
        id: 2,
        author: 'Ousmane T.',
        rating: 4,
        date: '2024-04-05',
        text: 'Bonne sélection de médicaments. Le personnel est courtois et compétent.',
      },
      {
        id: 3,
        author: 'Fatoumata K.',
        rating: 5,
        date: '2024-03-28',
        text: 'Très satisfaite. Livraison à l\'heure et produits conformes à la commande.',
      },
    ],
  };

  const popularMedicines = [
    { name: 'Paracétamol 500mg', price: 2500, stock: 45 },
    { name: 'Amoxicilline 500mg', price: 5000, stock: 23 },
    { name: 'Ibuprofen 400mg', price: 3000, stock: 67 },
    { name: 'Vitamine C 1000mg', price: 4000, stock: 89 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/pharmacies" className="text-green-600 hover:text-green-700 font-semibold mb-4 inline-block">
            ← Retour
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Pharmacy Info */}
          <div className="lg:col-span-2">
            {/* Pharmacy Card */}
            <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
              <div className="flex items-start gap-6 mb-6">
                <div className="text-7xl">{pharmacy.image}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{pharmacy.name}</h1>
                      <p className="text-lg text-green-600 font-semibold">{pharmacy.experience} ans d'expérience</p>
                    </div>
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-all"
                    >
                      <Heart
                        size={28}
                        className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-gray-900">{pharmacy.rating}</span>
                      <span className="text-gray-600">({pharmacy.reviews} avis)</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      pharmacy.isOpen
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {pharmacy.isOpen ? '✓ Ouvert' : 'Fermé'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{pharmacy.location} ({pharmacy.distance} km)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{pharmacy.openingHours}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">À propos</h2>
                <p className="text-gray-600 leading-relaxed">{pharmacy.bio}</p>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Services Offerts</h3>
              <div className="grid grid-cols-2 gap-3">
                {pharmacy.services.map((service, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-700">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            {pharmacy.deliveryInfo.available && (
              <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border-2 border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  <Truck className="w-5 h-5 inline mr-2" />
                  Livraison à Domicile
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Délai</p>
                    <p className="text-2xl font-bold text-green-600">
                      {pharmacy.deliveryInfo.timeMin}-{pharmacy.deliveryInfo.timeMax} min
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Frais</p>
                    <p className="text-2xl font-bold text-green-600">
                      {pharmacy.deliveryInfo.fee.toLocaleString()} FG
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Disponibilité</p>
                    <p className="text-2xl font-bold text-green-600">24h/24</p>
                  </div>
                </div>
              </div>
            )}

            {/* Popular Medicines */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Médicaments Populaires</h3>
              <div className="space-y-3">
                {popularMedicines.map((med, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{med.name}</p>
                      <p className="text-sm text-gray-600">{med.stock} en stock</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{med.price.toLocaleString()} FG</p>
                      <button
                        onClick={() => setCartCount(cartCount + 1)}
                        className="text-green-600 hover:text-green-700 font-semibold text-sm mt-1"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Horaires d'Ouverture</h3>
              <div className="grid grid-cols-2 gap-4">
                {pharmacy.availability.map((avail, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">{avail.day}</p>
                      <p className="text-sm text-gray-600">{avail.hours}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Avis des Clients</h3>
              <div className="space-y-4">
                {pharmacy.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.author}</p>
                        <p className="text-sm text-gray-500">{review.date}</p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Actions */}
          <div>
            {/* Contact Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informations de Contact</h3>

              {/* Phone */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-3">
                <Phone className="w-5 h-5 text-green-600" />
                <a href={`tel:${pharmacy.phone}`} className="text-green-600 hover:text-green-700 font-semibold">
                  {pharmacy.phone}
                </a>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-6">
                <Mail className="w-5 h-5 text-green-600" />
                <a href={`mailto:${pharmacy.email}`} className="text-green-600 hover:text-green-700 font-semibold">
                  {pharmacy.email}
                </a>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Commander ({cartCount})
                </button>

                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Envoyer un Message
                </button>

                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                  <Package className="w-5 h-5" />
                  Suivi de Livraison
                </button>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h4 className="font-bold text-gray-900 mb-3">Certifications</h4>
              <ul className="space-y-2">
                {pharmacy.certifications.map((cert, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-green-600 font-bold">✓</span>
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
