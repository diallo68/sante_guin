'use client';

import { useState } from 'react';
import { Star, User, Calendar, MessageSquare, Filter } from 'lucide-react';

interface Review {
  id: string;
  patientName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export default function ReviewsPage() {
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      patientName: 'Mamadou Diallo',
      rating: 5,
      date: '2024-04-15',
      comment: 'Excellent médecin, très professionnel et à l\'écoute. Je recommande vivement!',
      verified: true,
    },
    {
      id: '2',
      patientName: 'Aissatou Bah',
      rating: 5,
      date: '2024-04-14',
      comment: 'Service impeccable, consultation rapide et efficace.',
      verified: true,
    },
    {
      id: '3',
      patientName: 'Ibrahima Sow',
      rating: 4,
      date: '2024-04-13',
      comment: 'Bon médecin, mais un peu d\'attente avant la consultation.',
      verified: true,
    },
    {
      id: '4',
      patientName: 'Fatoumata Diallo',
      rating: 5,
      date: '2024-04-12',
      comment: 'Très satisfait du traitement et des conseils reçus.',
      verified: true,
    },
  ]);

  const [filterRating, setFilterRating] = useState('all');

  const filteredReviews = reviews.filter((review) => {
    if (filterRating === 'all') return true;
    return review.rating === parseInt(filterRating);
  });

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const totalReviews = reviews.length;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Avis et Notation</h1>
        <p className="text-gray-600 mt-2">Consultez les avis de vos patients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Note Moyenne</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-4xl font-bold text-gray-800">{averageRating}</span>
            <div>
              {renderStars(Math.round(parseFloat(averageRating)))}
              <p className="text-xs text-gray-600 mt-1">sur 5</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total d\'Avis</p>
          <p className="text-4xl font-bold text-gray-800 mt-3">{totalReviews}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Taux de Satisfaction</p>
          <p className="text-4xl font-bold text-green-600 mt-3">96%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les avis</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{review.patientName}</p>
                  {review.verified && (
                    <p className="text-xs text-green-600 font-medium">✓ Avis vérifié</p>
                  )}
                </div>
              </div>
              {renderStars(review.rating)}
            </div>

            <p className="text-gray-700 mb-3">{review.comment}</p>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(review.date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
