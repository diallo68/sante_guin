import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const T = '#0d9488';
const DARK = '#0f2a2a';

interface DashboardData {
  profile: {
    firstName: string;
    lastName: string;
    specialty?: string;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
  };
  stats: {
    todayAppointments: number;
    monthAppointments: number;
    pendingAppointments: number;
    totalPatients?: number;
  };
  upcomingAppointments: {
    _id: string;
    patientId?: { firstName: string; lastName: string };
    date: string;
    time: string;
    reason?: string;
    status: string;
  }[];
}

const STATUS_COLOR: Record<string, string> = {
  confirmed: '#059669', pending: '#d97706', cancelled: '#dc2626', completed: '#6366f1',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmé', pending: 'En attente', cancelled: 'Annulé', completed: 'Terminé',
};

function StatCard({ label, value, icon, bg }: { label: string; value: number; icon: string; bg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 16, padding: 14, gap: 4 }}>
      <Ionicons name={icon as any} size={20} color={T} />
      <Text style={{ fontSize: 26, fontWeight: '900', color: '#0f172a' }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const PRO_MENU = [
  { icon: 'people-outline', label: 'Patients', route: '/pro/patients' },
  { icon: 'calendar-outline', label: 'Rendez-vous', route: '/pro/appointments' },
  { icon: 'time-outline', label: 'Horaires', route: '/pro/schedule' },
  { icon: 'business-outline', label: 'Établissement', route: '/pro/cabinet' },
  { icon: 'document-text-outline', label: 'Documents', route: '/pro/documents' },
  { icon: 'star-outline', label: 'Avis', route: '/pro/reviews' },
  { icon: 'person-outline', label: 'Mon profil', route: '/pro/profile' },
  { icon: 'sparkles-outline', label: 'HAM IA', route: '/pro/ai' },
];

export default function ProDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pro/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T }}>
      <StatusBar barStyle="light-content" backgroundColor={T} />
      <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/pro/profile' as any)}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ionicons name="briefcase" size={13} color="rgba(153,246,228,0.8)" />
            <Text style={{ color: 'rgba(153,246,228,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>Espace Pro</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>
            {data?.profile ? `Dr. ${data.profile.firstName} ${data.profile.lastName}` : user ? `${user.firstName} ${user.lastName}` : 'Tableau de bord'}
          </Text>
          {data?.profile?.specialty && (
            <Text style={{ color: '#99f6e4', fontSize: 14, marginTop: 2 }}>{data.profile.specialty}</Text>
          )}
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator color={T} size="large" />
          </View>
        ) : (
          <View style={{ padding: 18, marginTop: -18, gap: 16 }}>
            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard label="Aujourd'hui" value={data?.stats.todayAppointments ?? 0} icon="today-outline" bg="#f0fdfa" />
              <StatCard label="Ce mois" value={data?.stats.monthAppointments ?? 0} icon="calendar-outline" bg="#eff6ff" />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard label="En attente" value={data?.stats.pendingAppointments ?? 0} icon="hourglass-outline" bg="#fefce8" />
              <StatCard label="Patients" value={data?.stats.totalPatients ?? 0} icon="people-outline" bg="#fdf4ff" />
            </View>

            {/* Quick actions grid */}
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#334155', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Accès rapide</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {PRO_MENU.map(item => (
                  <TouchableOpacity
                    key={item.route}
                    onPress={() => router.push(item.route as any)}
                    style={{ width: '22%', alignItems: 'center', gap: 6, paddingVertical: 10 }}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={item.icon as any} size={22} color={T} />
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569', textAlign: 'center' }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Upcoming appointments */}
            {data?.upcomingAppointments && data.upcomingAppointments.length > 0 && (
              <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#334155', letterSpacing: 1, textTransform: 'uppercase' }}>Prochains rendez-vous</Text>
                  <TouchableOpacity onPress={() => router.push('/pro/appointments' as any)}>
                    <Text style={{ color: T, fontSize: 13, fontWeight: '600' }}>Tout voir</Text>
                  </TouchableOpacity>
                </View>
                {data.upcomingAppointments.slice(0, 5).map(appt => (
                  <View key={appt._id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="person" size={20} color={T} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                        {appt.patientId ? `${appt.patientId.firstName} ${appt.patientId.lastName}` : 'Patient'}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{appt.date} à {appt.time}</Text>
                      {appt.reason && <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }} numberOfLines={1}>{appt.reason}</Text>}
                    </View>
                    <View style={{ backgroundColor: `${STATUS_COLOR[appt.status] || '#94a3b8'}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: STATUS_COLOR[appt.status] || '#64748b' }}>{STATUS_LABEL[appt.status] || appt.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
