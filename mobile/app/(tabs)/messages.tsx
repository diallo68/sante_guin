import { useState, useEffect, useRef } from 'react';
import {
  View, Text, SafeAreaView, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
  Modal, Pressable, Linking, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import api, { API_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment { name: string; url: string; type: string; size: number }
interface Participant { userId: string; role: string; displayName: string }
interface ConvDoctor { _id: string; firstName: string; lastName: string; specialty: string }
interface ConvPatient { _id: string; firstName: string; lastName: string }
interface ConvAppointment { date: string; time: string; reason?: string }
interface Conversation {
  _id: string;
  type: 'appointment' | 'document';
  doctorId?: ConvDoctor;
  patientId?: ConvPatient;
  appointmentId?: ConvAppointment;
  participants?: Participant[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}
interface Message {
  _id: string;
  senderId: string;
  senderRole: string;
  content: string;
  attachments?: Attachment[];
  createdAt: string;
}
interface Contact {
  userId: string;
  role: string;
  profileId: string;
  displayName: string;
  subtitle: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function roleLabel(role: string) {
  if (role === 'doctor') return 'Médecin';
  if (role === 'pharmacist') return 'Pharmacie';
  if (role === 'laboratorist') return 'Laboratoire';
  return 'Patient';
}

function convTitle(conv: Conversation, myId: string, isDoc: boolean) {
  if (conv.type === 'appointment') {
    if (isDoc && conv.patientId) return `${conv.patientId.firstName} ${conv.patientId.lastName}`;
    if (!isDoc && conv.doctorId) return `Dr. ${conv.doctorId.firstName} ${conv.doctorId.lastName}`;
  }
  if (conv.type === 'document' && conv.participants) {
    const other = conv.participants.find(p => p.userId !== myId);
    return other?.displayName ?? 'Conversation';
  }
  return 'Conversation';
}

function convSubtitle(conv: Conversation, myId: string, isDoc: boolean) {
  if (conv.type === 'appointment') {
    if (!isDoc && conv.doctorId) return conv.doctorId.specialty;
    return conv.appointmentId
      ? `RDV ${new Date(conv.appointmentId.date).toLocaleDateString('fr-FR')} à ${conv.appointmentId.time}`
      : '';
  }
  if (conv.type === 'document' && conv.participants) {
    const other = conv.participants.find(p => p.userId !== myId);
    return roleLabel(other?.role ?? '');
  }
  return '';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isDoc = user?.role === 'doctor' || user?.role === 'pharmacist' || user?.role === 'laboratorist';
  const myId = user?.id ?? '';

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  // New conversation modal
  const [showNewConv, setShowNewConv] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [creatingConv, setCreatingConv] = useState(false);

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
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
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

  const pickAndUpload = async () => {
    if (!activeConv || uploading) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if ((asset.size ?? 0) > 10 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 10 Mo)');
      return;
    }

    setUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/octet-stream',
      } as any);

      const res = await fetch(`${API_URL}/api/conversations/${activeConv._id}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setConvs(prev => prev.map(c => c._id === activeConv!._id
          ? { ...c, lastMessage: data.message.content, lastMessageAt: new Date().toISOString() }
          : c));
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {}
    setUploading(false);
  };

  const openNewConvModal = async () => {
    setShowNewConv(true);
    setLoadingContacts(true);
    setContactSearch('');
    try {
      const res = await api.get('/conversations/new');
      setContacts(res.data.contacts || []);
    } catch {}
    setLoadingContacts(false);
  };

  const startConversation = async (contact: Contact) => {
    if (creatingConv) return;
    setCreatingConv(true);
    try {
      const res = await api.post('/conversations/new', {
        recipientUserId: contact.userId,
        recipientRole: contact.role,
        recipientProfileId: contact.profileId,
        recipientDisplayName: contact.displayName,
      });
      const conv = res.data.conversation;
      if (!res.data.existing) {
        setConvs(prev => [conv, ...prev]);
      }
      setShowNewConv(false);
      openConv(conv);
    } catch {}
    setCreatingConv(false);
  };

  const filteredContacts = contacts.filter(c =>
    c.displayName.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // ── Non authentifié ──
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

  // ── Vue CHAT ──
  if (activeConv) {
    const title = convTitle(activeConv, myId, isDoc);
    const subtitle = convSubtitle(activeConv, myId, isDoc);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <TouchableOpacity onPress={() => setActiveConv(null)}>
              <Ionicons name="chevron-back" size={24} color="#0d9488" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#111827', fontSize: 16 }}>{title}</Text>
              {!!subtitle && <Text style={{ fontSize: 12, color: '#6b7280' }}>{subtitle}</Text>}
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
                const isMine = msg.senderId === myId;
                const hasAttachments = msg.attachments && msg.attachments.length > 0;

                return (
                  <View style={{ alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    {!isMine && (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#0d9488', marginBottom: 2 }}>{title}</Text>
                    )}
                    <View style={{
                      maxWidth: '82%',
                      backgroundColor: isMine ? '#0d9488' : '#fff',
                      borderRadius: 16,
                      borderBottomRightRadius: isMine ? 4 : 16,
                      borderBottomLeftRadius: isMine ? 16 : 4,
                      padding: 12,
                      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
                    }}>
                      {hasAttachments && msg.attachments!.map((att: Attachment, i: number) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => Linking.openURL(`${API_URL}${att.url}`)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : '#f3f4f6',
                            borderRadius: 10,
                            padding: 8,
                            marginBottom: 6,
                            borderWidth: 1,
                            borderColor: isMine ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
                          }}
                        >
                          <Ionicons name="document-text-outline" size={20} color={isMine ? '#99f6e4' : '#0d9488'} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: isMine ? '#fff' : '#111827', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                              {att.name}
                            </Text>
                            <Text style={{ color: isMine ? '#99f6e4' : '#6b7280', fontSize: 10 }}>
                              {formatSize(att.size)}
                            </Text>
                          </View>
                          <Ionicons name="download-outline" size={16} color={isMine ? '#99f6e4' : '#6b7280'} />
                        </TouchableOpacity>
                      ))}
                      {(!msg.content.startsWith('📎') || !hasAttachments) && (
                        <Text style={{ color: isMine ? '#fff' : '#111827', fontSize: 14, lineHeight: 20 }}>
                          {msg.content}
                        </Text>
                      )}
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
          <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', padding: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              <TouchableOpacity
                onPress={pickAndUpload}
                disabled={uploading}
                style={{ width: 40, height: 40, backgroundColor: '#f0fdfa', borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }}
              >
                {uploading
                  ? <ActivityIndicator color="#0d9488" size="small" />
                  : <Ionicons name="attach" size={20} color="#0d9488" />}
              </TouchableOpacity>
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
                style={{ width: 40, height: 40, backgroundColor: text.trim() ? '#0d9488' : '#e5e7eb', borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }}
              >
                {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, marginLeft: 48 }}>
              📎 PDF, JPG, PNG — max 10 Mo
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── LISTE CONVERSATIONS ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>

      {/* Header */}
      <View style={{ backgroundColor: '#0d9488', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Messages</Text>
        <TouchableOpacity
          onPress={openNewConvModal}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
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
            Envoyez un document ou démarrez une conversation.
          </Text>
          <TouchableOpacity
            onPress={openNewConvModal}
            style={{ backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700' }}>Nouveau message</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={convs}
          keyExtractor={c => c._id}
          renderItem={({ item: conv }) => {
            const title = convTitle(conv, myId, isDoc);
            const subtitle = convSubtitle(conv, myId, isDoc);
            const icon = conv.type === 'document' ? 'document-text-outline' : 'person';

            return (
              <TouchableOpacity
                onPress={() => openConv(conv)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
              >
                <View style={{ width: 48, height: 48, backgroundColor: '#f0fdfa', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={icon} size={22} color="#0d9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={{ fontWeight: '700', color: '#111827', fontSize: 15 }} numberOfLines={1}>{title}</Text>
                    {conv.unreadCount > 0 && (
                      <View style={{ backgroundColor: '#0d9488', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{conv.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                  {!!subtitle && <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{subtitle}</Text>}
                  <Text style={{ fontSize: 12, color: '#9ca3af' }} numberOfLines={1}>
                    {conv.lastMessage || 'Aucun message'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── MODAL NOUVEAU MESSAGE ── */}
      <Modal
        visible={showNewConv}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewConv(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowNewConv(false)}
        >
          <Pressable
            style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' }}
            onPress={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Nouveau message</Text>
              <TouchableOpacity onPress={() => setShowNewConv(false)}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Ionicons name="search" size={16} color="#9ca3af" />
                <TextInput
                  value={contactSearch}
                  onChangeText={setContactSearch}
                  placeholder="Rechercher..."
                  placeholderTextColor="#9ca3af"
                  style={{ flex: 1, fontSize: 14, color: '#111827' }}
                  autoFocus
                />
              </View>
            </View>

            {/* Contacts list */}
            {loadingContacts ? (
              <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                <ActivityIndicator color="#0d9488" />
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {filteredContacts.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>Aucun contact trouvé</Text>
                  </View>
                ) : (
                  filteredContacts.map(c => (
                    <TouchableOpacity
                      key={c.userId}
                      onPress={() => startConversation(c)}
                      disabled={creatingConv}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}
                    >
                      <View style={{ width: 40, height: 40, backgroundColor: '#f0fdfa', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#0d9488', fontWeight: '800', fontSize: 15 }}>{c.displayName[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', color: '#111827', fontSize: 14 }}>{c.displayName}</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>{c.subtitle}</Text>
                      </View>
                      {creatingConv
                        ? <ActivityIndicator color="#0d9488" size="small" />
                        : <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                      }
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
