'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, Clock, Users, Globe, Phone, Mail, Calendar, MessageCircle, Heart } from 'lucide-react';

export default function DoctorDetailPage() {
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Mock data
  const doctor = {
    id: '1',
    name: 'Dr. Ahmed Diallo',
    specialty: 'Cardiologue',
    rating: 4.8,
    reviews: 127,
    distance: 2.3,
    location: 'Kindia, Conakry',
    image: '👨‍⚕️',
    available: true,
    experience: 12,
    languages: ['Français', 'Anglais'],
    consultationFee: 50000,
    consultationType: 'both',
    phone: '+224 622 123 456',
    email: 'ahmed.diallo@guineesante.gn',
    bio: 'Dr. Ahmed Diallo est un cardiologue expérimenté avec plus de 12 ans de pratique. Il se spécialise dans le diagnostic et le traitement des maladies cardiovasculaires.',
    education: [
      'Diplôme de Médecine - Université de Conakry (2012)',
      'Spécialisation en Cardiologie - Université de Dakar (2015)',
      'Formation avancée en Échocardiographie - Paris (2018)',
    ],
    certifications: [
      'Certification Cardiologie - Ordre des Médecins de Guinée',
      'Certification BLS/ACLS',
      'Certification en Échocardiographie',
    ],
    services: [
      'Consultation générale',
      'Échocardiographie',
      'Holter ECG',
      'Stress test',
      'Suivi post-opératoire',
    ],
    availability: [
      { day: 'Lundi', hours: '09:00 - 17:00' },
      { day: 'Mardi', hours: '09:00 - 17:00' },
      { day: 'Mercredi', hours: '09:00 - 17:00' },
      { day: 'Jeudi', hours: '09:00 - 17:00' },
      { day: 'Vendredi', hours: '09:00 - 13:00' },
      { day: 'Samedi', hours: 'Sur rendez-vous' },
    ],
    reviews: [
      {
        id: 1,
        author: 'Mamadou K.',
        rating: 5,
        date: '2024-04-10',
        text: 'Excellent médecin, très professionnel et à l\'écoute. Je recommande vivement !',
      },
      {
        id: 2,
        author: 'Aïssatou B.',
        rating: 4,
        date: '2024-04-05',
        text: 'Très bon diagnostic. Un peu d\'attente mais le service est de qualité.',
      },
      {
        id: 3,
        author: 'Ibrahim S.',
        rating: 5,
        date: '2024-03-28',
        text: 'Professionnel et courtois. Explique bien les résultats.',
      },
    ],
  };

  const availableDates = [
    { date: '2024-04-16', day: 'Aujourd\'hui' },
    { date: '2024-04-17', day: 'Demain' },
    { date: '2024-04-18', day: 'Jeudi' },
    { date: '2024-04-19', day: 'Vendredi' },
  ];

  const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/doctors" className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-block">
            ← Retour
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Doctor Info */}
          <div className="lg:col-span-2">
            {/* Doctor Card */}
            <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
              <div className="flex items-start gap-6 mb-6">
                <div className="text-7xl">{doctor.image}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{doctor.name}</h1>
                      <p className="text-xl text-blue-600 font-semibold">{doctor.specialty}</p>
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
                      <span className="font-bold text-gray-900">{doctor.rating}</span>
                      <span className="text-gray-600">({doctor.reviews} avis)</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      doctor.available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {doctor.available ? '✓ Disponible' : 'Non disponible'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{doctor.location} ({doctor.distance} km)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{doctor.experience} ans d'expérience</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">À propos</h2>
                <p className="text-gray-600 leading-relaxed">{doctor.bio}</p>
              </div>
            </div>

            {/* Education & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Education */}
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Formation</h3>
                <ul className="space-y-3">
                  {doctor.education.map((edu, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-blue-600 font-bold mt-1">✓</span>
                      <span className="text-gray-600">{edu}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Certifications</h3>
                <ul className="space-y-3">
                  {doctor.certifications.map((cert, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-green-600 font-bold mt-1">✓</span>
                      <span className="text-gray-600">{cert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Services Offerts</h3>
              <div className="grid grid-cols-2 gap-3">
                {doctor.services.map((service, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-600">✓</span>
                    <span className="text-gray-700">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Horaires</h3>
              <div className="grid grid-cols-2 gap-4">
                {doctor.availability.map((avail, idx) => (
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">Avis des Patients</h3>
              <div className="space-y-4">
                {doctor.reviews.map((review) => (
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

          {/* Right Column - Booking */}
          <div>
            {/* Contact Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informations de Contact</h3>

              {/* Phone */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <a href={`tel:${doctor.phone}`} className="text-blue-600 hover:text-blue-700 font-semibold">
                  {doctor.phone}
                </a>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-4">
                <Mail className="w-5 h-5 text-blue-600" />
                <a href={`mailto:${doctor.email}`} className="text-blue-600 hover:text-blue-700 font-semibold">
                  {doctor.email}
                </a>
              </div>

              {/* Consultation Fee */}
              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Tarif de Consultation</p>
                <p className="text-2xl font-bold text-gray-900">{doctor.consultationFee.toLocaleString()} FG</p>
              </div>

              {/* Booking Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">Prendre un Rendez-vous</h4>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Sélectionner une date</option>
                    {availableDates.map(d => (
                      <option key={d.date} value={d.date}>
                        {d.day} - {d.date}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heure</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Sélectionner une heure</option>
                    {availableTimes.map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Booking Button */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all">
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Confirmer le Rendez-vous
                </button>

                {/* Message Button */}
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all">
                  <MessageCircle className="w-5 h-5 inline mr-2" />
                  Envoyer un Message
                </button>
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h4 className="font-bold text-gray-900 mb-3">
                <Globe className="w-5 h-5 inline mr-2" />
                Langues
              </h4>
              <div className="flex flex-wrap gap-2">
                {doctor.languages.map(lang => (
                  <span key={lang} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
