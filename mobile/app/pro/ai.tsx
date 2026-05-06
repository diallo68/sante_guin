import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const T = '#0d9488';
const DARK = '#0f2a2a';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Quels sont les symptômes du paludisme ?',
  'Posologie de l\'amoxicilline adulte',
  'Interactions médicamenteuses à surveiller',
  'Protocole de prise en charge du diabète',
  'Quand référer un patient en urgence ?',
  'Conseils hygiéno-diététiques courants',
];

function parseContent(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={{ fontWeight: '800', color: '#0f172a' }}>{part.slice(2, -2)}</Text>;
    }
    return <Text key={i}>{part}</Text>;
  });
}

export default function ProAIScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    const updated: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(updated);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', {
        messages: updated.map(m => ({ role: m.role, content: m.content })),
      });
      const reply = res.data.content || res.data.message || 'Je ne suis pas sûr de la réponse.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Une erreur est survenue. Vérifiez votre connexion et réessayez.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    Alert.alert('Effacer', 'Voulez-vous effacer l\'historique de la conversation ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => setMessages([]) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        {/* Header */}
        <View style={{ backgroundColor: DARK, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
            </TouchableOpacity>
            {messages.length > 0 && (
              <TouchableOpacity onPress={clear} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#99f6e4', fontWeight: '600', fontSize: 13 }}>Effacer</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(13,148,136,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sparkles" size={24} color="#99f6e4" />
            </View>
            <View>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>HAM</Text>
              <Text style={{ color: '#99f6e4', fontSize: 12 }}>Assistant médical IA</Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={{ backgroundColor: '#fefce8', borderBottomWidth: 1, borderBottomColor: '#fde68a', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', gap: 10 }}>
          <Ionicons name="warning-outline" size={16} color="#d97706" style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 11, color: '#92400e', lineHeight: 16 }}>
            HAM est un assistant IA. Ses réponses sont indicatives et ne remplacent pas un diagnostic médical professionnel.
          </Text>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 8, gap: 12 }}>
          {messages.length === 0 && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#334155', textAlign: 'center', marginTop: 8, marginBottom: 4 }}>
                Bonjour, comment puis-je vous aider ?
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {SUGGESTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => send(s)}
                    style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#e2e8f0', maxWidth: '48%' }}
                  >
                    <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', textAlign: 'center' }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {messages.map((m, i) => (
            <View
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: m.role === 'user' ? T : '#fff',
                borderRadius: 18,
                borderBottomRightRadius: m.role === 'user' ? 4 : 18,
                borderBottomLeftRadius: m.role === 'assistant' ? 4 : 18,
                padding: 14,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              {m.role === 'assistant' ? (
                <Text style={{ fontSize: 14, color: '#334155', lineHeight: 21 }}>{parseContent(m.content)}</Text>
              ) : (
                <Text style={{ fontSize: 14, color: '#fff', lineHeight: 21 }}>{m.content}</Text>
              )}
            </View>
          ))}
          {loading && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={T} />
              <Text style={{ fontSize: 13, color: '#94a3b8' }}>HAM réfléchit...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Posez votre question médicale..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={1000}
            style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#0f172a', maxHeight: 100, borderWidth: 1, borderColor: '#e2e8f0' }}
          />
          <TouchableOpacity
            onPress={() => send()}
            disabled={!input.trim() || loading}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: input.trim() && !loading ? T : '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="send" size={18} color={input.trim() && !loading ? '#fff' : '#94a3b8'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
