import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — MonDocteur',
  description: 'Politique de confidentialité et protection des données personnelles de MonDocteur',
};

const LAST_UPDATED = '5 mai 2026';

export default function PrivacyPage() {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-teal-200 text-sm font-semibold uppercase tracking-wider">Données &amp; Vie privée</p>
              <h1 className="text-3xl font-black">Politique de confidentialité</h1>
            </div>
          </div>
          <p className="text-teal-100 text-sm">Dernière mise à jour : {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-10">

          {/* Intro */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              MonDocteur (&quot;nous&quot;, &quot;notre&quot;, &quot;nos&quot;) exploite le site web{' '}
              <a href="https://mondocteur.org" className="text-teal-600 font-semibold hover:underline">mondocteur.org</a>{' '}
              et l&apos;application mobile MonDocteur. Cette page vous informe de nos pratiques en matière de collecte,
              d&apos;utilisation et de divulgation des données personnelles lorsque vous utilisez notre service,
              ainsi que des choix dont vous disposez concernant ces données.
            </p>
          </section>

          <Section title="1. Informations que nous collectons">
            <p className="text-gray-600 mb-3">Nous collectons plusieurs types d&apos;informations dans le cadre de la fourniture et de l&apos;amélioration de notre service :</p>
            <SubSection title="Données d'identité">
              <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                <li>Prénom et nom de famille</li>
                <li>Adresse email et/ou numéro de téléphone</li>
                <li>Date de naissance (optionnel)</li>
                <li>Sexe (optionnel)</li>
                <li>Ville et adresse (optionnel)</li>
              </ul>
            </SubSection>
            <SubSection title="Données de santé (patients)">
              <p className="text-gray-600 text-sm">
                Dans le cadre de la relation avec votre médecin, nous pouvons stocker des informations médicales
                telles que le groupe sanguin, les notes médicales et les documents partagés (ordonnances, résultats d&apos;analyses).
                Ces données sont strictement confidentielles et accessibles uniquement à vous et aux professionnels de santé autorisés.
              </p>
            </SubSection>
            <SubSection title="Données d'utilisation">
              <p className="text-gray-600 text-sm">
                Nous collectons automatiquement des informations sur la façon dont vous accédez et utilisez le service
                (pages visitées, actions effectuées, horodatage).
              </p>
            </SubSection>
          </Section>

          <Section title="2. Comment nous utilisons vos informations">
            <p className="text-gray-600 mb-3">Nous utilisons les données collectées pour :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
              <li>Fournir, maintenir et améliorer notre service</li>
              <li>Gérer votre compte et l&apos;authentification</li>
              <li>Permettre la prise de rendez-vous médicaux</li>
              <li>Faciliter la communication entre patients et professionnels de santé</li>
              <li>Envoyer des notifications et confirmations de rendez-vous</li>
              <li>Assurer la sécurité et prévenir les fraudes</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </Section>

          <Section title="3. Partage des données">
            <p className="text-gray-600 mb-3">
              Nous ne vendons, n&apos;échangeons ni ne louons vos données personnelles à des tiers.
              Vos données peuvent être partagées uniquement dans les cas suivants :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
              <li><strong>Professionnels de santé :</strong> les médecins, pharmaciens et laboratoristes avec lesquels vous interagissez ont accès aux informations nécessaires à votre suivi médical.</li>
              <li><strong>Prestataires techniques :</strong> nous utilisons MongoDB Atlas (hébergement base de données), Brevo (emails transactionnels) et Groq (assistant IA à destination des professionnels de santé, qui peut recevoir le texte et les documents soumis lors d&apos;une consultation de l&apos;assistant) soumis à des obligations de confidentialité strictes.</li>
              <li><strong>Obligations légales :</strong> si la loi l&apos;exige ou pour protéger nos droits.</li>
            </ul>
          </Section>

          <Section title="4. Sécurité des données">
            <p className="text-gray-600">
              La sécurité de vos données est notre priorité. Nous mettons en œuvre des mesures techniques et
              organisationnelles appropriées : chiffrement des mots de passe (bcrypt), tokens JWT sécurisés,
              connexions HTTPS, et accès restreint aux données sensibles. Cependant, aucune méthode de transmission
              sur Internet ou de stockage électronique n&apos;est sécurisée à 100%.
            </p>
          </Section>

          <Section title="5. Conservation des données">
            <p className="text-gray-600">
              Vos données sont conservées aussi longtemps que votre compte est actif ou que nécessaire pour vous
              fournir nos services. Vous pouvez demander la suppression de votre compte et de vos données à tout
              moment en nous contactant.
            </p>
          </Section>

          <Section title="6. Vos droits">
            <p className="text-gray-600 mb-3">Vous disposez des droits suivants concernant vos données personnelles :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
              <li><strong>Accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Rectification :</strong> corriger des données inexactes</li>
              <li><strong>Suppression :</strong> demander la suppression de vos données</li>
              <li><strong>Opposition :</strong> vous opposer au traitement de vos données</li>
              <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré</li>
            </ul>
            <p className="text-gray-600 mt-3 text-sm">
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:privacy@mondocteur.org" className="text-teal-600 hover:underline font-semibold">
                privacy@mondocteur.org
              </a>
            </p>
          </Section>

          <Section title="7. Cookies">
            <p className="text-gray-600">
              Notre application web utilise des cookies essentiels au fonctionnement du service (authentification, session).
              L&apos;application mobile utilise le stockage sécurisé local (Expo SecureStore) pour conserver votre session.
              Nous n&apos;utilisons pas de cookies publicitaires ou de traçage tiers.
            </p>
          </Section>

          <Section title="8. Données des mineurs">
            <p className="text-gray-600">
              Notre service n&apos;est pas destiné aux personnes de moins de 16 ans. Nous ne collectons pas
              sciemment de données personnelles auprès d&apos;enfants de moins de 16 ans. Si vous constatez
              qu&apos;un enfant nous a fourni des données personnelles, contactez-nous immédiatement.
            </p>
          </Section>

          <Section title="9. Modifications de cette politique">
            <p className="text-gray-600">
              Nous pouvons mettre à jour cette politique de confidentialité périodiquement. Nous vous informerons
              de tout changement significatif en publiant la nouvelle politique sur cette page et en mettant à jour
              la date de &quot;dernière mise à jour&quot;. Il vous est conseillé de consulter cette page régulièrement.
            </p>
          </Section>

          <Section title="10. Nous contacter">
            <p className="text-gray-600 mb-4">
              Si vous avez des questions concernant cette politique de confidentialité, contactez-nous :
            </p>
            <div className="bg-teal-50 rounded-xl p-5 space-y-2 text-sm">
              <p className="font-bold text-teal-800 text-base">MonDocteur</p>
              <p className="text-gray-600">📧 <a href="mailto:privacy@mondocteur.org" className="text-teal-600 hover:underline">privacy@mondocteur.org</a></p>
              <p className="text-gray-600">🌐 <a href="https://mondocteur.org" className="text-teal-600 hover:underline">mondocteur.org</a></p>
              <p className="text-gray-600">📍 Conakry, République de Guinée</p>
            </div>
          </Section>

        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-teal-600 transition-colors">Accueil</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-teal-600 transition-colors">Conditions d&apos;utilisation</Link>
          <span>·</span>
          <a href="mailto:privacy@mondocteur.org" className="hover:text-teal-600 transition-colors">Contact</a>
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-gray-700 mb-2">{title}</h3>
      {children}
    </div>
  );
}
