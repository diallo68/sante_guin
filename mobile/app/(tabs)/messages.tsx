import { useState, useEffect, useRef } from 'react';
import {
  View, Text, SafeAreaView, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ConvDoctor { _id: string; firstName: string; lastName: string; specialty: string }
interface ConvPatient { _id: string; firstName: string; lastName: string }
interface ConvAppointment { date: string; time: string; reason?: string }
interface Conversation {
  _id: string;
  doctorId?: ConvDoctor;
  patientId?: ConvPatient;
  appointmentId: ConvAppointment;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}
interface Message {
  _id: string;
  senderId: string;
  senderRole: 'patient' | 'doctor';
  content: string;
  createdAt: string;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isDoc = user?.role === 'doctor' || user?.role === 'pharmacist';

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user) return;
    api.get('/conversations')
      .then(res => setConvs(res.data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const openConv = async (conv: Conversation) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/conversations/${conv._id}`);
      setMessages(res.data.messages || []);
      setConvs(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
    } catch {}
    setLoadingMsgs(false);
  };

  const sendMessage = async () => {
    if (!text.trim() || !activeConv || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    try {
      const res = await api.post(`/conversations/${activeConv._id}`, { content });
      setMessages(prev => [...prev, res.data.message]);
      setConvs(prev => prev.map(c => c._id === activeConv!._id
        ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
        : c));
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {}
    setSending(false);
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Ionicons name="chatbubbles-outline" size={52} color="#d1d5db" />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 }}>Non connecté</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}
          style={{ backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── CHAT VIEW ──
  if (activeConv) {
    const otherName = isDoc
      ? `${activeConv.patientId?.firstName} ${activeConv.patientId?.lastName}`
      : `Dr. ${activeConv.doctorId?.firstName} ${activeConv.doctorId?.lastName}`;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <TouchableOpacity onPress={() => setActiveConv(null)}>
              <Ionicons name="chevron-back" size={24} color="#0d9488" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#111827', fontSize: 16 }}>{otherName}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                RDV {new Date(activeConv.appointmentId.date).toLocaleDateString('fr-FR')} à {activeConv.appointmentId.time}
              </Text>
            </View>
          </View>

          {/* Messages */}
          {loadingMsgs ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#0d9488" />
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={m => m._id}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item: msg }) => {
                const isMine = isDoc ? msg.senderRole === 'doctor' : msg.senderRole === 'patient';
                return (
                  <View style={{ alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    {!isMine && (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#0d9488', marginBottom: 2 }}>{otherName}</Text>
                    )}
                    <View style={{
                      maxWidth: '80%',
                      backgroundColor: isMine ? '#0d9488' : '#fff',
                      borderRadius: 16,
                      borderBottomRightRadius: isMine ? 4 : 16,
                      borderBottomLeftRadius: isMine ? 16 : 4,
                      padding: 12,
                      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
                    }}>
                      <Text style={{ color: isMine ? '#fff' : '#111827', fontSize: 14, lineHeight: 20 }}>{msg.content}</Text>
                      <Text style={{ color: isMine ? '#99f6e4' : '#9ca3af', fontSize: 10, marginTop: 4 }}>
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Input */}
          <View style={{ flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Votre message..."
              placeholderTextColor="#9ca3af"
              multiline
              style={{ flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', maxHeight: 100 }}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!text.trim() || sending}
              style={{ width: 44, height: 44, backgroundColor: text.trim() ? '#0d9488' : '#e5e7eb', borderRadius: 22, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }}
            >
              {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── LISTE CONVERSATIONS ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: '#0d9488', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Messages</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#0d9488" size="large" />
        </View>
      ) : convs.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="chatbubbles-outline" size={52} color="#d1d5db" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 }}>Aucune conversation</Text>
          <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
            {isDoc ? 'Les patients vous écriront lors de leurs prises de RDV.' : 'Prenez un rendez-vous pour démarrer une conversation.'}
          </Text>
          {!isDoc && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/doctors')}
              style={{ backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Trouver un médecin</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={convs}
          keyExtractor={c => c._id}
          renderItem={({ item: conv }) => {
            const name = isDoc
              ? `${conv.patientId?.firstName} ${conv.patientId?.lastName}`
              : `Dr. ${conv.doctorId?.firstName} ${conv.doctorId?.lastName}`;
            return (
              <TouchableOpacity
                onPress={() => openConv(conv)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
              >
                <View style={{ width: 48, height: 48, backgroundColor: '#f0fdfa', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={22} color="#0d9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={{ fontWeight: '700', color: '#111827', fontSize: 15 }}>{name}</Text>
                    {conv.unreadCount > 0 && (
                      <View style={{ backgroundColor: '#0d9488', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{conv.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                    RDV {new Date(conv.appointmentId.date).toLocaleDateString('fr-FR')} à {conv.appointmentId.time}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }} numberOfLines={1}>{conv.lastMessage}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
