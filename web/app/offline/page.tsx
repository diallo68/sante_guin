'use client';

// Bug pré-existant : ce composant a un onClick natif sans 'use client' —
// un Server Component ne peut pas passer de gestionnaire d'événement, même
// à un <button> natif. Provoquait « Event handlers cannot be passed to
// Client Component props » en boucle dans les logs de prod (page servie
// par le service worker en fallback hors-ligne, donc potentiellement
// fréquente) et cassait le bouton "Réessayer la connexion".
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728M9.172 14.828a5 5 0 010-7.072M12 12h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Vous êtes hors ligne</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">
          Pas de connexion internet détectée. Les pages déjà visitées sont disponibles. Vos données seront synchronisées automatiquement dès le retour de la connexion.
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 text-left space-y-3">
          <p className="text-sm font-semibold text-gray-700">Disponible hors ligne :</p>
          {[
            'Consulter vos patients enregistrés',
            'Voir l\'historique des consultations',
            'Accéder aux pages déjà visitées',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              {item}
            </div>
          ))}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl transition"
        >
          Réessayer la connexion
        </button>
      </div>
    </div>
  );
}
