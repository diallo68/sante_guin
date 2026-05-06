import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  teal600:  '#0d9488',
  teal200:  '#99f6e4',
  teal50:   '#f0fdfa',
  tealDark: '#0f2a2a',   // banner Pro background
  tealMid:  '#134e4a',
  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  indigo50: '#eef2ff', indigo600: '#4f46e5',
  emerald50:'#ecfdf5', emerald600:'#059669',
  rose50:   '#fff1f2', rose600:'#e11d48',
  sky400:   '#38bdf8',
  amber400: '#fbbf24',
  white:    '#ffffff',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Doctor    { _id:string; firstName:string; lastName:string; specialty:string; city:string; rating:number; reviewCount:number; openTime?:string; closeTime?:string; }
interface Pharmacy  { _id:string; name:string; city:string; rating:number; reviewCount:number; openTime?:string; closeTime?:string; isOpen24h:boolean; }
interface Laboratory{ _id:string; name:string; city:string; rating:number; reviewCount:number; openTime?:string; closeTime?:string; }


// ─── Helpers ──────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating:number }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
      <Ionicons name="star" size={13} color={C.amber400} />
      <Text style={{ fontSize:13, fontWeight:'700', color:C.slate800 }}>{(rating||0).toFixed(1)}</Text>
    </View>
  );
}

function ProBadge() {
  return (
    <View style={{ position:'absolute', top:10, right:10, flexDirection:'row', alignItems:'center', gap:3, backgroundColor:C.teal50, borderRadius:20, paddingHorizontal:8, paddingVertical:3 }}>
      <Text style={{ fontSize:11, fontWeight:'700', color:C.teal600 }}>Pro</Text>
      <Ionicons name="checkmark-circle" size={12} color={C.teal600} />
    </View>
  );
}


function DoctorCard({ doc, onPress }:{ doc:Doctor; onPress:()=>void }) {
  const h = doc.openTime && doc.closeTime ? `${doc.openTime} - ${doc.closeTime}` : '08:00 - 17:00';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ width:196, backgroundColor:'#eef6ff', borderRadius:18, padding:14, marginRight:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, elevation:2 }}>
      <ProBadge />
      <View style={{ width:46, height:46, borderRadius:13, backgroundColor:'rgba(79,70,229,0.1)', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
        <Text style={{ fontSize:24 }}>👨‍⚕️</Text>
      </View>
      <Text style={{ fontSize:14, fontWeight:'800', color:C.slate900, marginBottom:2 }} numberOfLines={1}>Dr. {doc.firstName} {doc.lastName}</Text>
      <Text style={{ fontSize:12, fontWeight:'600', color:C.teal600, marginBottom:8 }} numberOfLines={1}>{doc.specialty}</Text>
      <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginBottom:3 }}>
        <Ionicons name="location-outline" size={11} color={C.slate400} />
        <Text style={{ fontSize:11, color:C.slate500 }} numberOfLines={1}>{doc.city}, Conakry</Text>
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginBottom:10 }}>
        <Ionicons name="time-outline" size={11} color={C.slate400} />
        <Text style={{ fontSize:11, color:C.slate500 }}>{h}</Text>
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
          <Stars rating={doc.rating} />
          <Text style={{ fontSize:11, color:C.slate400 }}>({doc.reviewCount})</Text>
        </View>
        <View style={{ flexDirection:'row', alignItems:'center', gap:2 }}>
          <Text style={{ fontSize:12, fontWeight:'600', color:C.teal600 }}>Voir</Text>
          <Ionicons name="chevron-forward" size={12} color={C.teal600} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function PharmacyCard({ p, onPress }:{ p:Pharmacy; onPress:()=>void }) {
  const h = p.isOpen24h ? '24h/24' : (p.openTime && p.closeTime ? `${p.openTime} - ${p.closeTime}` : '08:00 - 22:00');
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ width:196, backgroundColor:'#f0fdf4', borderRadius:18, padding:14, marginRight:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, elevation:2 }}>
      <ProBadge />
      <View style={{ width:46, height:46, borderRadius:13, backgroundColor:'rgba(5,150,105,0.1)', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
        <Text style={{ fontSize:24 }}>💊</Text>
      </View>
      <Text style={{ fontSize:14, fontWeight:'800', color:C.slate900, marginBottom:8 }} numberOfLines={2}>{p.name}</Text>
      <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginBottom:3 }}>
        <Ionicons name="location-outline" size={11} color={C.slate400} />
        <Text style={{ fontSize:11, color:C.slate500 }} numberOfLines={1}>{p.city}, Conakry</Text>
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginBottom:10 }}>
        <Ionicons name="time-outline" size={11} color={C.slate400} />
        <Text style={{ fontSize:11, color:C.slate500 }}>{h}</Text>
        {p.isOpen24h && <View style={{ backgroundColor:'#dcfce7', borderRadius:5, paddingHorizontal:5, paddingVertical:1 }}><Text style={{ fontSize:10, fontWeight:'700', color:C.emerald600 }}>Ouvert</Text></View>}
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
          <Stars rating={p.rating} />
          <Text style={{ fontSize:11, color:C.slate400 }}>({p.reviewCount})</Text>
        </View>
        <View style={{ flexDirection:'row', alignItems:'center', gap:2 }}>
          <Text style={{ fontSize:12, fontWeight:'600', color:C.teal600 }}>Voir</Text>
          <Ionicons name="chevron-forward" size={12} color={C.teal600} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LabCard({ lab, onPress }:{ lab:Laboratory; onPress:()=>void }) {
  const h = lab.openTime && lab.closeTime ? `${lab.openTime} - ${lab.closeTime}` : '07:00 - 18:00';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ width:196, backgroundColor:'#f0fdfa', borderRadius:18, padding:14, marginRight:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, elevation:2 }}>
      <ProBadge />
      <View style={{ width:46, height:46, borderRadius:13, backgroundColor:'rgba(13,148,136,0.1)', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
        <Text style={{ fontSize:24 }}>🧪</Text>
      </View>
      <Text style={{ fontSize:14, fontWeight:'800', color:C.slate900, marginBottom:8 }} numberOfLines={2}>{lab.name}</Text>
      <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginBottom:3 }}>
        <Ionicons name="location-outline" size={11} color={C.slate400} />
        <Text style={{ fontSize:11, color:C.slate500 }} numberOfLines={1}>{lab.city}, Conakry</Text>
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginBottom:10 }}>
        <Ionicons name="time-outline" size={11} color={C.slate400} />
        <Text style={{ fontSize:11, color:C.slate500 }}>{h}</Text>
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
          <Stars rating={lab.rating} />
          <Text style={{ fontSize:11, color:C.slate400 }}>({lab.reviewCount})</Text>
        </View>
        <View style={{ flexDirection:'row', alignItems:'center', gap:2 }}>
          <Text style={{ fontSize:12, fontWeight:'600', color:C.teal600 }}>Voir</Text>
          <Ionicons name="chevron-forward" size={12} color={C.teal600} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/doctors?limit=6').catch(() => ({ data:{ doctors:[] } })),
      api.get('/pharmacies?limit=6').catch(() => ({ data:{ pharmacies:[] } })),
      api.get('/laboratories?limit=6').catch(() => ({ data:{ laboratories:[] } })),
    ]).then(([d,p,l]) => {
      setDoctors(d.data.doctors || []);
      setPharmacies(p.data.pharmacies || []);
      setLabs(l.data.laboratories || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    if (search.trim()) router.push(`/(tabs)/doctors?search=${encodeURIComponent(search.trim())}` as any);
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal600 }}>
      <StatusBar barStyle="light-content" backgroundColor={C.teal600} />

      <ScrollView style={{ flex:1, backgroundColor:C.slate50 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>

        {/* ══ 1. HERO ═══════════════════════════════════════════════════ */}
        <View style={{ backgroundColor:C.teal600, paddingHorizontal:22, paddingTop:14, paddingBottom:56, borderBottomLeftRadius:34, borderBottomRightRadius:34 }}>

          {/* Top row */}
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
            <View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:3 }}>
                <Ionicons name="hand-left-outline" size={13} color="rgba(153,246,228,0.85)" />
                <Text style={{ color:'rgba(153,246,228,0.85)', fontSize:11, fontWeight:'700', letterSpacing:1.5, textTransform:'uppercase' }}>
                  {user ? `Bonjour, ${user.firstName}` : 'Bienvenue'}
                </Text>
              </View>
              <Text style={{ color:C.white, fontSize:21, fontWeight:'800', letterSpacing:-0.3 }}>MonDocteur</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={{ width:46, height:46, borderRadius:23, backgroundColor:'#2563eb', alignItems:'center', justifyContent:'center', shadowColor:'#1d4ed8', shadowOpacity:0.5, shadowRadius:8, elevation:6 }}
            >
              <Ionicons name="settings" size={22} color={C.white} />
            </TouchableOpacity>
          </View>

          {/* Headline */}
          <Text style={{ color:C.white, fontSize:38, fontWeight:'900', lineHeight:42, letterSpacing:-1, marginBottom:28 }}>
            Votre santé,{'\n'}<Text style={{ color:C.teal200 }}>entre de bonnes{'\n'}mains.</Text>
          </Text>

          {/* ① Search bar */}
          <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.white, borderRadius:50, paddingVertical:5, paddingLeft:16, paddingRight:5, shadowColor:'#000', shadowOpacity:0.18, shadowRadius:14, elevation:8 }}>
            <Ionicons name="search" size={20} color={C.slate400} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Médecin, spécialité, pharmacie..."
              placeholderTextColor={C.slate400}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              style={{ flex:1, paddingVertical:11, paddingHorizontal:10, fontSize:14, color:C.slate800 }}
            />
            <TouchableOpacity onPress={handleSearch} style={{ width:44, height:44, borderRadius:22, backgroundColor:C.teal600, alignItems:'center', justifyContent:'center' }}>
              <Ionicons name="arrow-forward" size={20} color={C.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ 2. MONDOCTEUR PRO (dark banner) ═══════════════════════════ */}
        <View style={{ paddingHorizontal:18, marginTop:-28, zIndex:10 }}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={{ backgroundColor:C.tealDark, borderRadius:22, padding:18, flexDirection:'row', alignItems:'center', justifyContent:'space-between', shadowColor:'#000', shadowOpacity:0.25, shadowRadius:18, elevation:10 }}
          >
            {/* Left */}
            <View style={{ flexDirection:'row', alignItems:'center', gap:14, flex:1 }}>
              <View style={{ width:46, height:46, borderRadius:13, backgroundColor:'rgba(13,148,136,0.25)', alignItems:'center', justifyContent:'center' }}>
                <Ionicons name="fitness" size={24} color={C.teal200} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:9, fontWeight:'800', color:C.teal200, letterSpacing:1.3, textTransform:'uppercase', marginBottom:3 }}>
                  Pour les professionnels de santé
                </Text>
                <Text style={{ fontSize:16, fontWeight:'800', color:C.white, marginBottom:3 }}>
                  Mondocteur <Text style={{ color:C.teal200 }}>Pro</Text>
                </Text>
                <Text style={{ fontSize:11, color:'rgba(153,246,228,0.6)', lineHeight:15 }} numberOfLines={2}>
                  Gérez votre cabinet, vos patients et votre agenda en un seul endroit.
                </Text>
              </View>
            </View>
            {/* Right button */}
            <TouchableOpacity onPress={() => router.push('/pro-avantages')} style={{ backgroundColor:C.teal600, borderRadius:20, paddingHorizontal:14, paddingVertical:9, marginLeft:10, flexShrink:0 }}>
              <Text style={{ fontSize:12, fontWeight:'700', color:C.white }}>Découvrir →</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* ══ 3. HAM — VOTRE COLLABORATEUR IA ══════════════════════════ */}
        <View style={{ paddingHorizontal:18, marginTop:14 }}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={{ backgroundColor:C.white, borderRadius:22, padding:18, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:12, elevation:4, borderWidth:1, borderColor:C.slate100 }}
          >
            <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 }}>
              <View style={{ width:42, height:42, borderRadius:12, backgroundColor:C.teal50, alignItems:'center', justifyContent:'center' }}>
                <Ionicons name="sparkles" size={22} color={C.teal600} />
              </View>
              <View>
                <Text style={{ fontSize:18, fontWeight:'900', color:C.teal600, letterSpacing:-0.3 }}>HAM</Text>
                <Text style={{ fontSize:12, fontWeight:'600', color:C.slate700 }}>Votre collaborateur IA</Text>
              </View>
            </View>
            <Text style={{ fontSize:13, color:C.slate500, lineHeight:19, marginBottom:12 }}>
              Posez vos questions médicales, obtenez des conseils intelligents et des orientations assistées par l'IA.
            </Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <Text style={{ fontSize:13, fontWeight:'700', color:C.teal600 }}>En savoir plus</Text>
              <Ionicons name="arrow-forward-circle" size={16} color={C.teal600} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ══ 4. PARTENAIRES VÉRIFIÉS ═══════════════════════════════════ */}
        <View style={{ paddingHorizontal:22, marginTop:28 }}>
          {/* Badge */}
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:5 }}>
            <Ionicons name="shield-checkmark" size={13} color={C.teal600} />
            <Text style={{ fontSize:11, fontWeight:'800', letterSpacing:1.4, color:C.teal600, textTransform:'uppercase' }}>Partenaires Vérifiés</Text>
          </View>
          {/* Title + see-all links */}
          <Text style={{ fontSize:24, fontWeight:'900', color:C.slate900, letterSpacing:-0.5, marginBottom:2 }}>Professionnels de santé</Text>
          <Text style={{ fontSize:13, color:C.slate500, lineHeight:18, marginBottom:14 }}>
            Médecins, pharmacies et laboratoires certifiés, disponibles pour vous
          </Text>
          {/* Quick-nav links row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:12, marginBottom:20 }}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <Text style={{ fontSize:13, fontWeight:'700', color:C.teal600 }}>Tous les médecins</Text>
              <Ionicons name="arrow-forward" size={13} color={C.teal600} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <Text style={{ fontSize:13, fontWeight:'700', color:C.teal600 }}>Toutes les pharmacies</Text>
              <Ionicons name="arrow-forward" size={13} color={C.teal600} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <Text style={{ fontSize:13, fontWeight:'700', color:C.teal600 }}>Tous les laboratoires</Text>
              <Ionicons name="arrow-forward" size={13} color={C.teal600} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {loading ? (
          <View style={{ alignItems:'center', paddingVertical:28 }}>
            <ActivityIndicator color={C.teal600} size="large" />
          </View>
        ) : (
          <>
            {doctors.length > 0 && (
              <View style={{ marginBottom:28 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:22, marginBottom:12 }}>
                  <Ionicons name="person-outline" size={14} color={C.slate700} />
                  <Text style={{ fontSize:11, fontWeight:'800', color:C.slate700, letterSpacing:1.3, textTransform:'uppercase' }}>Médecins</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:20 }}>
                  {doctors.map(d => <DoctorCard key={d._id} doc={d} onPress={() => router.push(`/doctors/${d._id}` as any)} />)}
                </ScrollView>
              </View>
            )}
            {pharmacies.length > 0 && (
              <View style={{ marginBottom:28 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:22, marginBottom:12 }}>
                  <Ionicons name="medkit-outline" size={14} color={C.slate700} />
                  <Text style={{ fontSize:11, fontWeight:'800', color:C.slate700, letterSpacing:1.3, textTransform:'uppercase' }}>Pharmacies</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:20 }}>
                  {pharmacies.map(p => <PharmacyCard key={p._id} p={p} onPress={() => router.push(`/pharmacies/${p._id}` as any)} />)}
                </ScrollView>
              </View>
            )}
            {labs.length > 0 && (
              <View style={{ marginBottom:24 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:22, marginBottom:12 }}>
                  <Ionicons name="flask-outline" size={14} color={C.slate700} />
                  <Text style={{ fontSize:11, fontWeight:'800', color:C.slate700, letterSpacing:1.3, textTransform:'uppercase' }}>Laboratoires d'analyse</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:20 }}>
                  {labs.map(l => <LabCard key={l._id} lab={l} onPress={() => {}} />)}
                </ScrollView>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
