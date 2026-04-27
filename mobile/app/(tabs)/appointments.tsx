import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Appointment {
  _id: string;
  date: string;
  time: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  doctorId: { firstName: string; lastName: string; specialty: string; city: string } | null;
}

const STATUS_MAP = {
  pending:   { label: 'En attente', bg: '#fef9c3', text: '#854d0e' },
  confirmed: { label: 'Confirmé',   bg: '#dcfce7', text: '#14532d' },
  cancelled: { label: 'Annulé',     bg: '#fee2e2', text: '#7f1d1d' },
  completed: { label: 'Terminé',    bg: '#e0e7ff', text: '#3730a3' },
};

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch_ = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.appointments || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetch_();
    else setLoading(false);
  }, [user]);

  const onRefresh = () => { setRefreshing(true); fetch_(); };

  const renderItem = ({ item }: { item: Appointment }) => {
    const s = STATUS_MAP[item.status] || STATUS_MAP.pending;
    const d = new Date(item.date);
    return (
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
            <View style={{ width: 50, height: 50, backgroundColor: '#dbeafe', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24 }}>👨‍⚕️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
                {item.doctorId ? `Dr. ${item.doctorId.firstName} ${item.doctorId.lastName}` : 'Médecin inconnu'}
              </Text>
              {item.doctorId?.specialty && (
                <Text style={{ color: '#2563eb', fontSize: 12, fontWeight: '600', marginTop: 1 }}>{item.doctorId.specialty}</Text>
              )}
            </View>
          </View>
          <View style={{ backgroundColor: s.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: s.text }}>{s.label}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>
              {d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>{item.time}</Text>
          </View>
        </View>
        {item.reason && (
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Motif : {item.reason}</Text>
        )}
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Ionicons name="calendar-outline" size={56} color="#d1d5db" />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16, textAlign: 'center' }}>
          Connectez-vous pour voir vos rendez-vous
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={{ backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827' }}>Mes Rendez-vous</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0d9488" />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={a => a._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="calendar-outline" size={52} color="#d1d5db" />
              <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '600', marginTop: 12 }}>Aucun rendez-vous</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/doctors')} style={{ marginTop: 16, backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Trouver un médecin</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
