import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const T = '#0d9488';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  notes?: string;
  createdAt?: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProPatientsScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    dateOfBirth: '', gender: 'homme', bloodGroup: '', notes: '',
  });

  const load = () => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/pro/patients${q}`)
      .then(res => {
        // L'API renvoie deux listes distinctes : `patients` (issus des
        // rendez-vous, avec le patient imbriqué sous `.patient`) et
        // `manual` (dossiers patients créés à la main, déjà plats). La
        // liste attendue ici est une seule liste plate — voir audit B13.
        const fromAppointments: Patient[] = (res.data.patients || []).map((row: any) => ({
          _id: row.patient?._id ?? row._id,
          firstName: row.patient?.firstName ?? '',
          lastName: row.patient?.lastName ?? '',
          phone: row.patient?.phone,
          email: row.patient?.email,
          createdAt: row.patient?.createdAt,
        }));
        const manual: Patient[] = res.data.manual || [];
        setPatients([...fromAppointments, ...manual]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => load();

  const addPatient = async () => {
    if (!form.firstName || !form.lastName || !form.phone) {
      return Alert.alert('Requis', 'Prénom, nom et téléphone sont obligatoires.');
    }
    setSaving(true);
    try {
      await api.post('/pro/patients', form);
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', phone: '', email: '', dateOfBirth: '', gender: 'homme', bloodGroup: '', notes: '' });
      load();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le patient.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = patients.filter(p => {
    if (!search) return true;
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (p.phone || '').includes(search) || (p.email || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAdd(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Nouveau</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 14 }}>Mes patients</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12 }}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            placeholder="Nom, téléphone, email..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            returnKeyType="search"
            style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, color: '#fff', fontSize: 14 }}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={T} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 15 }}>Aucun patient trouvé</Text>
              <TouchableOpacity onPress={() => setShowAdd(true)} style={{ marginTop: 20, backgroundColor: T, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Enregistrer un patient</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.map(p => (
            <View key={p._id} style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <TouchableOpacity
                onPress={() => setExpanded(expanded === p._id ? null : p._id)}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: T }}>{p.firstName[0]}{p.lastName[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>{p.firstName} {p.lastName}</Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{p.phone || p.email || 'Aucun contact'}</Text>
                </View>
                <Ionicons name={expanded === p._id ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
              </TouchableOpacity>
              {expanded === p._id && (
                <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 8 }}>
                  {p.email && <View style={{ flexDirection: 'row', gap: 8 }}><Ionicons name="mail-outline" size={14} color="#94a3b8" /><Text style={{ fontSize: 13, color: '#475569' }}>{p.email}</Text></View>}
                  {p.dateOfBirth && <View style={{ flexDirection: 'row', gap: 8 }}><Ionicons name="calendar-outline" size={14} color="#94a3b8" /><Text style={{ fontSize: 13, color: '#475569' }}>Né(e) le {p.dateOfBirth}</Text></View>}
                  {p.gender && <View style={{ flexDirection: 'row', gap: 8 }}><Ionicons name="person-outline" size={14} color="#94a3b8" /><Text style={{ fontSize: 13, color: '#475569' }}>{p.gender === 'homme' ? 'Masculin' : 'Féminin'}</Text></View>}
                  {p.bloodGroup && <View style={{ flexDirection: 'row', gap: 8 }}><Ionicons name="water-outline" size={14} color="#94a3b8" /><Text style={{ fontSize: 13, color: '#475569' }}>Groupe {p.bloodGroup}</Text></View>}
                  {p.notes && <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}><Ionicons name="document-text-outline" size={14} color="#94a3b8" /><Text style={{ fontSize: 13, color: '#475569', flex: 1 }}>{p.notes}</Text></View>}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add patient modal */}
      <Modal visible={showAdd} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Nouveau patient</Text>
              <View style={{ width: 24 }} />
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {[
              { key: 'firstName', label: 'Prénom *', placeholder: 'Prénom' },
              { key: 'lastName', label: 'Nom *', placeholder: 'Nom de famille' },
              { key: 'phone', label: 'Téléphone *', placeholder: '+224 6XX XXX XXX', keyboard: 'phone-pad' },
              { key: 'email', label: 'Email', placeholder: 'email@exemple.com', keyboard: 'email-address' },
              { key: 'dateOfBirth', label: 'Date de naissance', placeholder: 'AAAA-MM-JJ' },
              { key: 'notes', label: 'Notes', placeholder: 'Observations, antécédents...' },
            ].map(f => (
              <View key={f.key}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>{f.label}</Text>
                <TextInput
                  value={(form as any)[f.key]}
                  onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                  placeholder={f.placeholder}
                  keyboardType={(f.keyboard as any) || 'default'}
                  multiline={f.key === 'notes'}
                  style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0f172a', minHeight: f.key === 'notes' ? 80 : undefined, textAlignVertical: f.key === 'notes' ? 'top' : undefined }}
                />
              </View>
            ))}
            {/* Gender */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Genre</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['homme', 'femme'].map(g => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setForm(prev => ({ ...prev, gender: g }))}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: form.gender === g ? T : '#e2e8f0', backgroundColor: form.gender === g ? '#f0fdfa' : '#fff', alignItems: 'center' }}
                  >
                    <Text style={{ fontWeight: '700', color: form.gender === g ? T : '#64748b' }}>{g === 'homme' ? 'Masculin' : 'Féminin'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* Blood group */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Groupe sanguin</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {BLOOD_GROUPS.map(bg => (
                  <TouchableOpacity
                    key={bg}
                    onPress={() => setForm(prev => ({ ...prev, bloodGroup: prev.bloodGroup === bg ? '' : bg }))}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: form.bloodGroup === bg ? T : '#e2e8f0', backgroundColor: form.bloodGroup === bg ? '#f0fdfa' : '#fff' }}
                  >
                    <Text style={{ fontWeight: '700', color: form.bloodGroup === bg ? T : '#64748b' }}>{bg}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              onPress={addPatient}
              disabled={saving}
              style={{ backgroundColor: T, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 10 }}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Enregistrer le patient</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
