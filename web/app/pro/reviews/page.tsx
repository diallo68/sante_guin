'use client';

import { useState, useEffect } from 'react';
import { Star, User, Calendar, Filter, Loader2, AlertCircle } from 'lucide-react';

interface Review {
  _id: string;
  patientName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRating, setFilterRating] = useState('all');

  useEffect(() => {
    fetch('/api/pro/reviews')
      .then(r => r.json())
      .then(data => {
        if (data.reviews !== undefined) {
          setReviews(data.reviews);
          setRating(data.rating || 0);
          setReviewCount(data.reviewCount || 0);
        } else {
          setError(data.error || 'Erreur lors du chargement');
        }
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reviews.filter(r =>
    filterRating === 'all' || r.rating === parseInt(filterRating)
  );

  const satisfaction = reviewCount > 0
    ? Math.round((reviews.filter(r => r.rating >= 4).length / reviewCount) * 100)
    : 0;

  const renderStars = (n: number) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={16} className={i < n ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Avis et Notation</h1>
        <p className="text-gray-600 mt-2">Consultez les avis de vos patients</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Note Moyenne</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-4xl font-bold text-gray-800">{rating.toFixed(1)}</span>
            <div>
              {renderStars(Math.round(rating))}
              <p className="text-xs text-gray-600 mt-1">sur 5</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total d&apos;Avis</p>
          <p className="text-4xl font-bold text-gray-800 mt-3">{reviewCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Taux de Satisfaction</p>
          <p className="text-4xl font-bold text-green-600 mt-3">{satisfaction}%</p>
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

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucun avis pour le moment</p>
          <p className="text-gray-400 text-sm mt-1">
            Les avis de vos patients apparaîtront ici après leurs consultations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review._id} className="bg-white rounded-lg shadow p-6">
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
      )}
    </div>
  );
}
