import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(tabs)');
      }},
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 80, height: 80, backgroundColor: '#e5e7eb', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Ionicons name="person" size={40} color="#9ca3af" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Non connecté</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 28 }}>Connectez-vous pour accéder à votre profil</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}
          style={{ backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  const isPro = user.role === 'doctor' || user.role === 'pharmacist' || user.role === 'laboratorist';

  const MENU = [
    { icon: 'calendar-outline', label: 'Mes rendez-vous', onPress: () => router.push('/(tabs)/appointments') },
    { icon: 'medkit-outline', label: 'Trouver un médecin', onPress: () => router.push('/(tabs)/doctors') },
    { icon: 'storefront-outline', label: 'Trouver une pharmacie', onPress: () => router.push('/(tabs)/pharmacies') },
    { icon: 'chatbubbles-outline', label: 'Mes messages', onPress: () => router.push('/(tabs)/messages') },
    {
      icon: 'help-circle-outline',
      label: 'Aide & Support',
      onPress: () => Alert.alert(
        'Aide & Support',
        'Contactez-nous pour toute question ou assistance.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/224620000000') },
          { text: 'Email', onPress: () => Linking.openURL('mailto:support@mondocteur.org') },
        ]
      ),
    },
  ];

  const PRO_MENU = [
    { icon: 'grid-outline', label: 'Tableau de bord', onPress: () => router.push('/pro/dashboard' as any) },
    { icon: 'people-outline', label: 'Mes patients', onPress: () => router.push('/pro/patients' as any) },
    { icon: 'calendar-outline', label: 'Rendez-vous pro', onPress: () => router.push('/pro/appointments' as any) },
    { icon: 'time-outline', label: 'Mes horaires', onPress: () => router.push('/pro/schedule' as any) },
    { icon: 'business-outline', label: 'Mon établissement', onPress: () => router.push('/pro/cabinet' as any) },
    { icon: 'document-text-outline', label: 'Documents', onPress: () => router.push('/pro/documents' as any) },
    { icon: 'star-outline', label: 'Mes avis', onPress: () => router.push('/pro/reviews' as any) },
    { icon: 'sparkles-outline', label: 'HAM — IA médicale', onPress: () => router.push('/pro/ai' as any) },
    { icon: 'person-outline', label: 'Profil professionnel', onPress: () => router.push('/pro/profile' as any) },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: '#0d9488', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Profil</Text>
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Modifier</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 64, height: 64, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 22 }}>{initials}</Text>
            </View>
            <View>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{user.firstName} {user.lastName}</Text>
              <Text style={{ color: '#99f6e4', fontSize: 13, marginTop: 2, textTransform: 'capitalize' }}>{user.role}</Text>
              {user.email && <Text style={{ color: '#ccfbf1', fontSize: 12, marginTop: 1 }}>{user.email}</Text>}
              {user.phone && <Text style={{ color: '#ccfbf1', fontSize: 12, marginTop: 1 }}>{user.phone}</Text>}
            </View>
          </View>
        </View>

        {/* Pro section */}
        {isPro && (
          <View style={{ marginTop: -12, marginHorizontal: 16, marginBottom: 12 }}>
            <View style={{ backgroundColor: '#0f2a2a', borderRadius: 20, padding: 16, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Ionicons name="briefcase" size={16} color="#99f6e4" />
                <Text style={{ color: '#99f6e4', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Espace Professionnel</Text>
              </View>
              {PRO_MENU.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={item.onPress}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: i < PRO_MENU.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                >
                  <View style={{ width: 36, height: 36, backgroundColor: 'rgba(13,148,136,0.2)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={item.icon as any} size={18} color="#99f6e4" />
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' }}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Menu */}
        <View style={{ marginTop: isPro ? 0 : -12, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}>
          {MENU.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={item.onPress}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: i < MENU.length - 1 ? 1 : 0, borderBottomColor: '#f3f4f6' }}
            >
              <View style={{ width: 38, height: 38, backgroundColor: '#f0fdfa', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={item.icon as any} size={20} color="#0d9488" />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' }}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ margin: 16, marginTop: 20, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 16 }}>Déconnexion</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', color: '#d1d5db', fontSize: 12, marginBottom: 24 }}>
          MonDocteur v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
