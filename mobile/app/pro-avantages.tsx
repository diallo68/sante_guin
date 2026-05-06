import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TEAL = '#0d9488';

const PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    tagline: 'Démarrez sans engagement',
    price: '50 000 FG',
    billing: 'Facturé mensuellement',
    discount: null,
    highlight: false,
    features: [
      { label: 'Agenda en ligne', included: true },
      { label: 'Gestion des rendez-vous', included: true },
      { label: 'Profil médecin visible', included: true },
      { label: 'Notifications SMS patients', included: true },
      { label: 'Dossiers patients numériques', included: false },
      { label: 'Messagerie sécurisée', included: false },
      { label: 'Statistiques avancées', included: false },
      { label: 'Badge Pro vérifié', included: false },
      { label: 'Support prioritaire 7j/7', included: false },
    ],
  },
  {
    id: 'confort',
    name: 'Confort',
    tagline: 'Le choix des praticiens actifs',
    price: '135 000 FG',
    billing: '45 000 FG/mois · −10%',
    discount: '−10%',
    highlight: false,
    features: [
      { label: 'Agenda en ligne', included: true },
      { label: 'Gestion des rendez-vous', included: true },
      { label: 'Profil médecin visible', included: true },
      { label: 'Notifications SMS patients', included: true },
      { label: 'Dossiers patients numériques', included: true },
      { label: 'Messagerie sécurisée', included: true },
      { label: 'Statistiques avancées', included: false },
      { label: 'Badge Pro vérifié', included: false },
      { label: 'Support prioritaire 7j/7', included: false },
    ],
  },
  {
    id: 'excellence',
    name: 'Excellence',
    tagline: 'Tout inclus, le meilleur tarif',
    price: '480 000 FG',
    billing: '40 000 FG/mois · −20%',
    discount: '−20%',
    highlight: true,
    features: [
      { label: 'Agenda en ligne', included: true },
      { label: 'Gestion des rendez-vous', included: true },
      { label: 'Profil médecin visible', included: true },
      { label: 'Notifications SMS patients', included: true },
      { label: 'Dossiers patients numériques', included: true },
      { label: 'Messagerie sécurisée', included: true },
      { label: 'Statistiques avancées', included: true },
      { label: 'Badge Pro vérifié', included: true },
      { label: 'Support prioritaire 7j/7', included: true },
    ],
  },
];

const FEATURES = [
  { icon: 'calendar', title: 'Agenda en ligne', desc: 'Gérez vos créneaux et rendez-vous en temps réel, 24h/24.' },
  { icon: 'document-text', title: 'Dossiers patients', desc: 'Ordonnances, documents et historique médical centralisés.' },
  { icon: 'bar-chart', title: 'Statistiques', desc: 'Tableau de bord : consultations, revenus, fidélisation.' },
  { icon: 'chatbubbles', title: 'Messagerie sécurisée', desc: 'Communiquez avec vos patients en toute confidentialité.' },
  { icon: 'shield-checkmark', title: 'Profil vérifié', desc: 'Badge Pro et mise en avant dans les résultats de recherche.' },
  { icon: 'flash', title: 'Rappels automatiques', desc: 'SMS envoyés automatiquement aux patients avant chaque RDV.' },
];

export default function ProAvantagesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubscribe = (planName: string) => {
    Alert.alert(
      `Offre ${planName}`,
      'Pour souscrire, contactez notre équipe. Nous vous répondrons dans les 24h.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Envoyer un email', onPress: () => Linking.openURL(`mailto:contact@mondocteur.org?subject=Souscription Mondocteur Pro — ${planName}`) },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Mondocteur Pro</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ backgroundColor: TEAL, padding: 24, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 14, marginBottom: 14 }}>
            <Ionicons name="pulse" size={32} color="#fff" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 }}>
            Développez votre cabinet
          </Text>
          <Text style={{ fontSize: 14, color: '#ccfbf1', textAlign: 'center', lineHeight: 20 }}>
            Rejoignez les professionnels de santé qui font confiance à Mondocteur Pro pour gérer et développer leur activité.
          </Text>
        </View>

        {/* Features */}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 14 }}>Ce qui est inclus</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {FEATURES.map(f => (
              <View key={f.title} style={{ width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f3f4f6' }}>
                <View style={{ backgroundColor: '#f0fdfa', borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name={f.icon as any} size={18} color={TEAL} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 4 }}>{f.title}</Text>
                <Text style={{ fontSize: 11, color: '#6b7280', lineHeight: 15 }}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Plans */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 14 }}>Choisissez votre offre</Text>
          {PLANS.map(plan => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelected(selected === plan.id ? null : plan.id)}
              style={{
                backgroundColor: plan.highlight ? '#f0fdfa' : '#fff',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: plan.highlight ? TEAL : selected === plan.id ? TEAL : '#e5e7eb',
                marginBottom: 12,
                overflow: 'hidden',
              }}
            >
              {plan.highlight && (
                <View style={{ backgroundColor: TEAL, paddingVertical: 5, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>⭐ RECOMMANDÉ</Text>
                </View>
              )}
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>{plan.name}</Text>
                      {plan.discount && (
                        <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803d' }}>{plan.discount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{plan.tagline}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: plan.highlight ? TEAL : '#111827' }}>{plan.price}</Text>
                    <Text style={{ fontSize: 10, color: '#9ca3af' }}>{plan.billing}</Text>
                  </View>
                </View>

                {/* Features list */}
                {(selected === plan.id || plan.highlight) && (
                  <View style={{ marginTop: 14, gap: 8 }}>
                    {plan.features.map(f => (
                      <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons
                          name={f.included ? 'checkmark-circle' : 'close-circle'}
                          size={18}
                          color={f.included ? '#16a34a' : '#d1d5db'}
                        />
                        <Text style={{ fontSize: 13, color: f.included ? '#111827' : '#9ca3af' }}>{f.label}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {!plan.highlight && selected !== plan.id && (
                  <Text style={{ fontSize: 12, color: TEAL, marginTop: 10, fontWeight: '600' }}>
                    Voir les détails ↓
                  </Text>
                )}

                <TouchableOpacity
                  onPress={() => handleSubscribe(plan.name)}
                  style={{ backgroundColor: plan.highlight ? TEAL : '#fff', borderWidth: 2, borderColor: TEAL, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '800', color: plan.highlight ? '#fff' : TEAL }}>
                    Souscrire à l'offre {plan.name}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact */}
        <View style={{ margin: 20, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 32 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 6 }}>Une question ?</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
            Notre équipe vous accompagne dans le choix de votre offre et la configuration de votre espace Pro.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:contact@mondocteur.org')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdfa', borderRadius: 10, padding: 12 }}
          >
            <Ionicons name="mail" size={18} color={TEAL} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: TEAL }}>contact@mondocteur.org</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
