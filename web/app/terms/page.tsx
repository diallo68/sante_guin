import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Conditions d'utilisation — MonDocteur",
  description: "Conditions générales d'utilisation de MonDocteur",
};

const LAST_UPDATED = '5 mai 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-teal-100 hover:text-white text-sm mb-8 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l&apos;accueil
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-teal-200 text-sm font-semibold uppercase tracking-wider">Légal</p>
              <h1 className="text-3xl font-black">Conditions d&apos;utilisation</h1>
            </div>
          </div>
          <p className="text-teal-100 text-sm">Dernière mise à jour : {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-10">

          <section>
            <p className="text-gray-600 leading-relaxed">
              En accédant à MonDocteur (site web{' '}
              <a href="https://mondocteur.org" className="text-teal-600 font-semibold hover:underline">mondocteur.org</a>{' '}
              et application mobile), vous acceptez d&apos;être lié par ces conditions d&apos;utilisation.
              Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </section>

          <Section title="1. Description du service">
            <p className="text-gray-600">
              MonDocteur est une plateforme de santé numérique permettant aux patients de trouver des professionnels
              de santé (médecins, pharmacies, laboratoires), de prendre des rendez-vous médicaux, d&apos;échanger des
              messages et de partager des documents médicaux en Guinée.
            </p>
          </Section>

          <Section title="2. Utilisation du service">
            <p className="text-gray-600 mb-3">Vous vous engagez à :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
              <li>Fournir des informations exactes lors de l&apos;inscription</li>
              <li>Maintenir la confidentialité de vos identifiants de connexion</li>
              <li>Utiliser le service uniquement à des fins légales et légitimes</li>
              <li>Ne pas tenter d&apos;accéder aux comptes d&apos;autres utilisateurs</li>
              <li>Ne pas publier de contenu faux, trompeur ou nuisible</li>
              <li>Respecter la vie privée des autres utilisateurs</li>
            </ul>
          </Section>

          <Section title="3. Avertissement médical important">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 font-semibold mb-2">⚠️ MonDocteur n&apos;est pas un service médical d&apos;urgence</p>
              <p className="text-amber-700 text-sm leading-relaxed">
                Les informations et fonctionnalités fournies sur MonDocteur (y compris l&apos;assistant IA HAM)
                sont à titre informatif uniquement et ne constituent pas un avis médical professionnel,
                un diagnostic ou un traitement. En cas d&apos;urgence médicale, contactez immédiatement
                les services d&apos;urgence locaux.
              </p>
            </div>
          </Section>

          <Section title="4. Comptes professionnels">
            <p className="text-gray-600">
              Les professionnels de santé (médecins, pharmaciens, laboratoristes) qui s&apos;inscrivent sur MonDocteur
              attestent être légalement autorisés à exercer leur profession en République de Guinée. MonDocteur se
              réserve le droit de vérifier ces informations et de suspendre tout compte dont les informations
              s&apos;avèrent fausses.
            </p>
          </Section>

          <Section title="5. Propriété intellectuelle">
            <p className="text-gray-600">
              Le service MonDocteur, incluant son contenu, ses fonctionnalités et son design, est la propriété
              exclusive de MonDocteur et est protégé par les lois applicables sur la propriété intellectuelle.
              Vous ne pouvez pas reproduire, distribuer ou créer des œuvres dérivées sans notre consentement écrit.
            </p>
          </Section>

          <Section title="6. Limitation de responsabilité">
            <p className="text-gray-600">
              MonDocteur est fourni &quot;tel quel&quot; sans garantie d&apos;aucune sorte. Nous ne garantissons pas
              l&apos;exactitude des informations des professionnels de santé ni la disponibilité continue du service.
              Notre responsabilité est limitée dans toute la mesure permise par la loi applicable.
            </p>
          </Section>

          <Section title="7. Suspension et résiliation">
            <p className="text-gray-600">
              Nous nous réservons le droit de suspendre ou de résilier votre accès au service à tout moment,
              sans préavis, en cas de violation de ces conditions ou pour toute autre raison légitime.
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l&apos;application.
            </p>
          </Section>

          <Section title="8. Modifications des conditions">
            <p className="text-gray-600">
              Nous pouvons modifier ces conditions à tout moment. Les modifications entrent en vigueur dès leur
              publication. L&apos;utilisation continue du service après publication des modifications constitue
              votre acceptation des nouvelles conditions.
            </p>
          </Section>

          <Section title="9. Droit applicable">
            <p className="text-gray-600">
              Ces conditions sont régies par le droit de la République de Guinée. Tout litige sera soumis
              à la juridiction compétente de Conakry, Guinée.
            </p>
          </Section>

          <Section title="10. Contact">
            <div className="bg-teal-50 rounded-xl p-5 space-y-2 text-sm">
              <p className="font-bold text-teal-800 text-base">MonDocteur</p>
              <p className="text-gray-600">📧 <a href="mailto:contact@mondocteur.org" className="text-teal-600 hover:underline">contact@mondocteur.org</a></p>
              <p className="text-gray-600">🌐 <a href="https://mondocteur.org" className="text-teal-600 hover:underline">mondocteur.org</a></p>
              <p className="text-gray-600">📍 Conakry, République de Guinée</p>
            </div>
          </Section>

        </div>

        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-teal-600 transition-colors">Accueil</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-teal-600 transition-colors">Politique de confidentialité</Link>
          <span>·</span>
          <a href="mailto:contact@mondocteur.org" className="hover:text-teal-600 transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
