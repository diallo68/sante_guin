import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator, TextInput, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const T = '#0d9488';

interface Patient { firstName: string; lastName: string; phone?: string; email?: string; }
interface Appointment {
  _id: string;
  patientId?: Patient;
  date: string;
  time: string;
  reason?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#dcfce7', text: '#059669' },
  pending:   { bg: '#fef9c3', text: '#d97706' },
  cancelled: { bg: '#fee2e2', text: '#dc2626' },
  completed: { bg: '#ede9fe', text: '#6366f1' },
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmé', pending: 'En attente', cancelled: 'Annulé', completed: 'Terminé',
};
const ALL_STATUSES = ['all', 'confirmed', 'pending', 'cancelled', 'completed'];

export default function ProAppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const params = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`/pro/appointments${params}`)
      .then(res => setAppointments(res.data.appointments || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const filtered = appointments.filter(a => {
    if (!search) return true;
    const name = a.patientId ? `${a.patientId.firstName} ${a.patientId.lastName}` : '';
    return name.toLowerCase().includes(search.toLowerCase()) || (a.reason || '').toLowerCase().includes(search.toLowerCase());
  });

  const openEdit = (a: Appointment) => {
    setSelected(a);
    setEditStatus(a.status);
    setEditNotes(a.notes || '');
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put('/pro/appointments', { appointmentId: selected._id, status: editStatus, notes: editNotes });
      setSelected(null);
      load();
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le rendez-vous.');
    } finally {
      setSaving(false);
    }
  };

  const deleteAppt = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer ce rendez-vous ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/pro/appointments?id=${id}`);
          load();
        } catch {
          Alert.alert('Erreur', 'Impossible de supprimer ce rendez-vous.');
        }
      }},
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>Rendez-vous</Text>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, marginTop: 14 }}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un patient..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, color: '#fff', fontSize: 14 }}
          />
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        {ALL_STATUSES.map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setFilter(s)}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: filter === s ? T : '#fff', borderWidth: 1.5, borderColor: filter === s ? T : '#e2e8f0' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: filter === s ? '#fff' : '#64748b' }}>
              {s === 'all' ? 'Tous' : STATUS_LABEL[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={T} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
              <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 15 }}>Aucun rendez-vous trouvé</Text>
            </View>
          ) : filtered.map(a => {
            const sc = STATUS_COLOR[a.status] || { bg: '#f3f4f6', text: '#6b7280' };
            return (
              <View key={a._id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>
                      {a.patientId ? `${a.patientId.firstName} ${a.patientId.lastName}` : 'Patient inconnu'}
                    </Text>
                    {a.patientId?.phone && <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{a.patientId.phone}</Text>}
                  </View>
                  <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: sc.text }}>{STATUS_LABEL[a.status]}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
                    <Text style={{ fontSize: 13, color: '#475569' }}>{a.date}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="time-outline" size={13} color="#94a3b8" />
                    <Text style={{ fontSize: 13, color: '#475569' }}>{a.time}</Text>
                  </View>
                </View>
                {a.reason && <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }} numberOfLines={2}>{a.reason}</Text>}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => openEdit(a)}
                    style={{ flex: 1, backgroundColor: '#f0fdfa', borderRadius: 10, paddingVertical: 9, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                  >
                    <Ionicons name="create-outline" size={15} color={T} />
                    <Text style={{ color: T, fontWeight: '700', fontSize: 13 }}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteAppt(a._id)}
                    style={{ backgroundColor: '#fee2e2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Edit modal */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 20 }}>Modifier le rendez-vous</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Statut</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['confirmed', 'pending', 'cancelled', 'completed'].map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setEditStatus(s)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: editStatus === s ? T : '#f1f5f9' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: editStatus === s ? '#fff' : '#64748b' }}>{STATUS_LABEL[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Notes</Text>
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Ajouter des notes..."
              multiline
              numberOfLines={3}
              style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0', textAlignVertical: 'top', minHeight: 80, marginBottom: 20 }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setSelected(null)} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#64748b' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} disabled={saving} style={{ flex: 1, backgroundColor: T, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontWeight: '700', color: '#fff' }}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
