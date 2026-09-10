import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

// ─── Tokens — charte Mondocteur (cf. maquettes web/mobile) ────────────────────
const C = {
  teal600:  '#0d7a86',   // primaire (boutons, accents)
  teal700:  '#0b6169',
  teal200:  '#99f6e4',
  teal50:   '#f0fdfa',
  tealDark: '#0f2a2a',   // banner Pro background
  tealMid:  '#134e4a',
  ink900:   '#0b2a3a',   // titres
  ink400:   '#5b7c8a',   // texte secondaire
  mist50:   '#f6fafa',   // fond clair
  mist100:  '#eef6f6',
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

const QUICK_ACCESS = ['Généraliste', 'Pédiatre', 'Cardiologue'];

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
    <SafeAreaView edges={['top','left','right']} style={{ flex:1, backgroundColor:C.mist50 }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.mist50} />

      <ScrollView style={{ flex:1, backgroundColor:C.white }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>

        {/* ══ 1. HERO ═══════════════════════════════════════════════════ */}
        <View style={{ backgroundColor:C.mist50, paddingHorizontal:22, paddingTop:10, paddingBottom:26 }}>

          {/* Top row */}
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <View>
              <Text style={{ color:C.teal600, fontSize:11, fontWeight:'800', letterSpacing:1.5, textTransform:'uppercase' }}>
                Santé en Guinée
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={{ width:44, height:44, borderRadius:22, backgroundColor:C.white, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:C.slate100 }}
            >
              <Ionicons name={user ? 'person' : 'settings-outline'} size={20} color={C.teal600} />
            </TouchableOpacity>
          </View>

          {/* Headline */}
          <Text style={{ color:C.ink900, fontSize:32, fontWeight:'900', lineHeight:36, letterSpacing:-0.5, marginBottom:10 }}>
            Votre santé,{'\n'}<Text style={{ color:C.teal600 }}>simplement.</Text>
          </Text>
          <Text style={{ color:C.ink400, fontSize:14, lineHeight:20, marginBottom:18 }}>
            Trouvez un professionnel de santé près de chez vous et prenez rendez-vous en quelques minutes.
          </Text>

          {/* Illustration */}
          <View style={{ borderRadius:20, overflow:'hidden', marginBottom:18, height:170 }}>
            <Image
              source={require('@/assets/marketing/hero-illustration.jpg')}
              style={{ width:'100%', height:'100%' }}
              resizeMode="cover"
            />
          </View>

          {/* Search inputs */}
          <View style={{ gap:10, marginBottom:14 }}>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.white, borderRadius:16, paddingHorizontal:14, borderWidth:1, borderColor:C.slate100 }}>
              <Ionicons name="search" size={18} color={C.slate400} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Professionnel ou spécialité"
                placeholderTextColor={C.slate400}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
                style={{ flex:1, paddingVertical:13, paddingHorizontal:10, fontSize:14, color:C.slate800 }}
              />
            </View>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.white, borderRadius:16, paddingHorizontal:14, borderWidth:1, borderColor:C.slate100 }}>
              <Ionicons name="location-outline" size={18} color={C.slate400} />
              <TextInput
                placeholder="Ville ou quartier"
                placeholderTextColor={C.slate400}
                style={{ flex:1, paddingVertical:13, paddingHorizontal:10, fontSize:14, color:C.slate800 }}
              />
            </View>
            <TouchableOpacity onPress={handleSearch} style={{ backgroundColor:C.teal600, borderRadius:16, paddingVertical:14, alignItems:'center' }}>
              <Text style={{ color:C.white, fontWeight:'800', fontSize:14 }}>Rechercher</Text>
            </TouchableOpacity>
          </View>

          {/* Accès rapides */}
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
            {QUICK_ACCESS.map(label => (
              <TouchableOpacity
                key={label}
                onPress={() => router.push(`/(tabs)/doctors?search=${encodeURIComponent(label)}` as any)}
                style={{ backgroundColor:C.mist100, borderRadius:20, paddingHorizontal:14, paddingVertical:8 }}
              >
                <Text style={{ fontSize:12, fontWeight:'700', color:C.teal700 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ══ 2. ACCÈS SERVICES ═══════════════════════════════════════ */}
        <View style={{ paddingHorizontal:18, marginTop:6, gap:10 }}>
          {[
            { label:'Médecins', desc:'Trouvez un professionnel de santé près de chez vous', icon:'person-outline' as const, href:'/(tabs)/doctors' as const },
            { label:'Pharmacies', desc:'Trouvez une pharmacie à proximité', icon:'medkit-outline' as const, href:'/(tabs)/pharmacies' as const },
            { label:'Laboratoires', desc:'Trouvez un laboratoire près de chez vous', icon:'flask-outline' as const, href:'/(tabs)/laboratories' as const },
          ].map(item => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.href as any)}
              activeOpacity={0.85}
              style={{ flexDirection:'row', alignItems:'center', gap:14, backgroundColor:C.white, borderRadius:18, padding:16, borderWidth:1, borderColor:C.slate100 }}
            >
              <View style={{ width:44, height:44, borderRadius:14, backgroundColor:C.mist100, alignItems:'center', justifyContent:'center' }}>
                <Ionicons name={item.icon} size={22} color={C.teal600} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:15, fontWeight:'800', color:C.ink900 }}>{item.label}</Text>
                <Text style={{ fontSize:12, color:C.ink400, marginTop:1 }}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.slate400} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ══ 3. COMMENT ÇA MARCHE ═══════════════════════════════════ */}
        <View style={{ paddingHorizontal:18, marginTop:28 }}>
          <Text style={{ fontSize:19, fontWeight:'900', color:C.ink900, marginBottom:16 }}>Comment ça marche ?</Text>
          <View style={{ flexDirection:'row', gap:10 }}>
            {[
              { n:'1', title:'Recherchez', desc:"Trouvez le professionnel ou l'établissement adapté" },
              { n:'2', title:'Réservez', desc:'Prenez rendez-vous en quelques minutes' },
              { n:'3', title:'Consultez', desc:'Rendez-vous sur place le jour choisi' },
            ].map(step => (
              <View key={step.n} style={{ flex:1 }}>
                <View style={{ width:30, height:30, borderRadius:15, backgroundColor:C.mist100, alignItems:'center', justifyContent:'center', marginBottom:8 }}>
                  <Text style={{ color:C.teal600, fontWeight:'800', fontSize:13 }}>{step.n}</Text>
                </View>
                <Text style={{ fontSize:13, fontWeight:'800', color:C.ink900, marginBottom:3 }}>{step.title}</Text>
                <Text style={{ fontSize:11, color:C.ink400, lineHeight:15 }}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══ 4. PATIENTS / PROFESSIONNELS ═══════════════════════════ */}
        <View style={{ paddingHorizontal:18, marginTop:26, flexDirection:'row', gap:10 }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/doctors')} activeOpacity={0.85} style={{ flex:1, backgroundColor:C.mist50, borderRadius:18, padding:14 }}>
            <View style={{ width:34, height:34, borderRadius:17, backgroundColor:C.mist100, alignItems:'center', justifyContent:'center', marginBottom:8 }}>
              <Ionicons name="people" size={17} color={C.teal600} />
            </View>
            <Text style={{ fontSize:13, fontWeight:'800', color:C.ink900, marginBottom:2 }}>Patients</Text>
            <Text style={{ fontSize:11, color:C.ink400, lineHeight:15 }}>Accédez facilement aux soins près de chez vous</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/pro-avantages')} activeOpacity={0.85} style={{ flex:1, backgroundColor:C.mist50, borderRadius:18, padding:14 }}>
            <View style={{ width:34, height:34, borderRadius:17, backgroundColor:C.mist100, alignItems:'center', justifyContent:'center', marginBottom:8 }}>
              <Ionicons name="person-add" size={17} color={C.teal600} />
            </View>
            <Text style={{ fontSize:13, fontWeight:'800', color:C.ink900, marginBottom:2 }}>Professionnels de santé</Text>
            <Text style={{ fontSize:11, color:C.ink400, lineHeight:15 }}>Développez votre activité et simplifiez la gestion de vos rendez-vous</Text>
          </TouchableOpacity>
        </View>

        {/* ══ 5. HAM — bandeau compact ═══════════════════════════════ */}
        <View style={{ paddingHorizontal:18, marginTop:20 }}>
          <TouchableOpacity
            onPress={() => router.push('/pro/ai')}
            activeOpacity={0.88}
            style={{ backgroundColor:C.tealDark, borderRadius:18, padding:16, flexDirection:'row', alignItems:'center', gap:12 }}
          >
            <View style={{ width:40, height:40, borderRadius:12, overflow:'hidden' }}>
              <Image source={require('@/assets/marketing/ham-icon.jpg')} style={{ width:'100%', height:'100%' }} resizeMode="cover" />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.white }}>Ham · Assistant pour professionnels</Text>
              <Text style={{ fontSize:11, color:'rgba(153,246,228,0.75)', marginTop:2 }} numberOfLines={2}>
                Votre allié au quotidien pour une meilleure organisation
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.teal200} />
          </TouchableOpacity>
        </View>

        {/* ══ 6. PARTENAIRES VÉRIFIÉS ═══════════════════════════════════ */}
        <View style={{ paddingHorizontal:22, marginTop:32 }}>
          {/* Badge */}
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:5 }}>
            <Ionicons name="shield-checkmark" size={13} color={C.teal600} />
            <Text style={{ fontSize:11, fontWeight:'800', letterSpacing:1.4, color:C.teal600, textTransform:'uppercase' }}>Partenaires Vérifiés</Text>
          </View>
          {/* Title + see-all links */}
          <Text style={{ fontSize:24, fontWeight:'900', color:C.ink900, letterSpacing:-0.5, marginBottom:2 }}>Professionnels de santé</Text>
          <Text style={{ fontSize:13, color:C.ink400, lineHeight:18, marginBottom:14 }}>
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
