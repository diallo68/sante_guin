import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Switch, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const T = '#0d9488';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

interface DaySchedule {
  day: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((day, i) => ({
  day,
  isOpen: i < 6,
  startTime: '08:00',
  endTime: i < 5 ? '17:00' : '12:00',
}));

export default function ProScheduleScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDay, setEditDay] = useState<DaySchedule | null>(null);
  const [editIndex, setEditIndex] = useState<number>(-1);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    api.get('/pro/schedule')
      .then(res => {
        if (res.data?.schedule?.length) setSchedule(res.data.schedule);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveAll = async () => {
    setSaving(true);
    try {
      await api.put('/pro/schedule', { schedule });
      Alert.alert('Succès', 'Vos horaires ont été enregistrés.');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer les horaires.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (index: number) => {
    setSchedule(prev => prev.map((d, i) => i === index ? { ...d, isOpen: !d.isOpen } : d));
  };

  const openEdit = (day: DaySchedule, index: number) => {
    setEditDay({ ...day });
    setEditIndex(index);
  };

  const applyEdit = () => {
    if (!editDay || editIndex < 0) return;
    setSchedule(prev => prev.map((d, i) => i === editIndex ? editDay : d));
    setEditDay(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={saveAll}
            disabled={saving}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 }}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>Mes horaires</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
          Configurez vos jours et heures d'ouverture
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={T} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
          {schedule.map((day, index) => (
            <View key={day.day} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, opacity: day.isOpen ? 1 : 0.6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: day.isOpen ? '#f0fdfa' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={day.isOpen ? 'sunny' : 'moon-outline'} size={20} color={day.isOpen ? T : '#94a3b8'} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>{day.day}</Text>
                    {day.isOpen ? (
                      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{day.startTime} – {day.endTime}</Text>
                    ) : (
                      <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Fermé</Text>
                    )}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {day.isOpen && (
                    <TouchableOpacity
                      onPress={() => openEdit(day, index)}
                      style={{ backgroundColor: '#f0fdfa', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                    >
                      <Ionicons name="create-outline" size={16} color={T} />
                    </TouchableOpacity>
                  )}
                  <Switch
                    value={day.isOpen}
                    onValueChange={() => toggleDay(index)}
                    trackColor={{ false: '#e2e8f0', true: '#99f6e4' }}
                    thumbColor={day.isOpen ? T : '#94a3b8'}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={saveAll}
            disabled={saving}
            style={{ backgroundColor: T, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Enregistrer tous les horaires</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Edit day modal */}
      <Modal visible={!!editDay} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 20 }}>
              Modifier {editDay?.day}
            </Text>
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 10 }}>Heure d'ouverture</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {HOURS.filter(h => h <= (editDay?.endTime || '23:00')).map(h => (
                    <TouchableOpacity
                      key={h}
                      onPress={() => setEditDay(prev => prev ? { ...prev, startTime: h } : prev)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: editDay?.startTime === h ? T : '#e2e8f0', backgroundColor: editDay?.startTime === h ? '#f0fdfa' : '#f8fafc' }}
                    >
                      <Text style={{ fontWeight: '700', color: editDay?.startTime === h ? T : '#64748b' }}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 10 }}>Heure de fermeture</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {HOURS.filter(h => h > (editDay?.startTime || '00:00')).map(h => (
                    <TouchableOpacity
                      key={h}
                      onPress={() => setEditDay(prev => prev ? { ...prev, endTime: h } : prev)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: editDay?.endTime === h ? T : '#e2e8f0', backgroundColor: editDay?.endTime === h ? '#f0fdfa' : '#f8fafc' }}
                    >
                      <Text style={{ fontWeight: '700', color: editDay?.endTime === h ? T : '#64748b' }}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity onPress={() => setEditDay(null)} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#64748b' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyEdit} style={{ flex: 1, backgroundColor: T, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#fff' }}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
