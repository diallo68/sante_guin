'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send, Loader2, MessageSquare, Calendar, ChevronLeft,
  Paperclip, FileText, X, Plus, Search,
} from 'lucide-react';

interface Attachment { name: string; url: string; type: string; size: number }
interface Participant { userId: string; role: string; displayName: string }
interface ConvPatient { _id: string; firstName: string; lastName: string }
interface ConvAppointment { _id: string; date: string; time: string; reason?: string; status: string }
interface Conversation {
  _id: string;
  type: 'appointment' | 'document';
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

function convTitle(conv: Conversation, myId: string) {
  if (conv.type === 'appointment' && conv.patientId) {
    return `${conv.patientId.firstName} ${conv.patientId.lastName}`;
  }
  if (conv.type === 'document' && conv.participants) {
    const other = conv.participants.find(p => p.userId !== myId);
    return other?.displayName ?? 'Conversation';
  }
  return 'Conversation';
}

function convSubtitle(conv: Conversation, myId: string) {
  if (conv.type === 'appointment' && conv.appointmentId) {
    return `RDV du ${new Date(conv.appointmentId.date).toLocaleDateString('fr-FR')} à ${conv.appointmentId.time}`;
  }
  if (conv.type === 'document' && conv.participants) {
    const other = conv.participants.find(p => p.userId !== myId);
    return roleLabel(other?.role ?? '');
  }
  return '';
}

export default function ProMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('conv');

  const [myId, setMyId] = useState('');
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // New conversation modal
  const [showNewConv, setShowNewConv] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [creatingConv, setCreatingConv] = useState(false);

  // File attachment
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setMyId(data.user.id); });

    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => setConvs(data.conversations || []))
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!selectedId || !convs.length) return;
    const conv = convs.find(c => c._id === selectedId);
    if (conv) openConversation(conv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, convs]);

  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    const res = await fetch(`/api/conversations/${conv._id}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setLoadingMsgs(false);
    setConvs(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
    router.replace(`/pro/messages?conv=${conv._id}`, { scroll: false });
  }, [router]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !activeConv || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    const res = await fetch(`/api/conversations/${activeConv._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setConvs(prev => prev.map(c => c._id === activeConv._id
        ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
        : c));
    }
    setSending(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/conversations/${activeConv._id}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setConvs(prev => prev.map(c => c._id === activeConv._id
        ? { ...c, lastMessage: data.message.content, lastMessageAt: new Date().toISOString() }
        : c));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openNewConvModal = async () => {
    setShowNewConv(true);
    setLoadingContacts(true);
    const res = await fetch('/api/conversations/new');
    const data = await res.json();
    setContacts(data.contacts || []);
    setLoadingContacts(false);
  };

  const startConversation = async (contact: Contact) => {
    setCreatingConv(true);
    const res = await fetch('/api/conversations/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientUserId: contact.userId,
        recipientRole: contact.role,
        recipientProfileId: contact.profileId,
        recipientDisplayName: contact.displayName,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setShowNewConv(false);
      setContactSearch('');
      if (!data.existing) {
        setConvs(prev => [data.conversation, ...prev]);
      }
      openConversation(data.conversation);
    }
    setCreatingConv(false);
  };

  const filteredContacts = contacts.filter(c =>
    c.displayName.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={20} className="text-teal-600" /> Messages
        </h1>
        <button
          onClick={openNewConvModal}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
        >
          <Plus size={16} /> Nouveau message
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── LISTE ── */}
        <div className={`w-full md:w-72 border-r border-gray-200 bg-white flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          {loadingConvs ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-teal-600" size={24} />
            </div>
          ) : convs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <MessageSquare size={36} className="text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm">Aucune conversation</p>
              <button
                onClick={openNewConvModal}
                className="mt-3 text-teal-600 text-sm font-semibold hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Nouveau message
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {convs.map(conv => (
                <button
                  key={conv._id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition ${activeConv?._id === conv._id ? 'bg-teal-50 border-l-4 border-l-teal-600' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-bold text-gray-900 text-sm truncate">{convTitle(conv, myId)}</p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-teal-600 mb-1">{convSubtitle(conv, myId)}</p>
                  {conv.type === 'appointment' && conv.appointmentId && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Calendar size={10} />
                      {new Date(conv.appointmentId.date).toLocaleDateString('fr-FR')} à {conv.appointmentId.time}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 truncate">{conv.lastMessage || 'Aucun message'}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── CHAT ── */}
        <div className={`flex-1 flex flex-col bg-gray-50 ${activeConv ? 'flex' : 'hidden md:flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
                <button onClick={() => { setActiveConv(null); router.replace('/pro/messages', { scroll: false }); }} className="md:hidden p-1">
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <div>
                  <p className="font-bold text-gray-900">{convTitle(activeConv, myId)}</p>
                  <p className="text-xs text-gray-500">{convSubtitle(activeConv, myId)}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-8">
                    <Loader2 className="animate-spin text-teal-600" size={24} />
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.senderId === myId;
                    return (
                      <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-teal-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
                        }`}>
                          {!isMine && (
                            <p className="text-xs font-bold text-teal-600 mb-1">
                              {convTitle(activeConv, myId)}
                            </p>
                          )}
                          {msg.attachments && msg.attachments.length > 0 ? (
                            <div className="space-y-2">
                              {msg.attachments.map((att, i) => (
                                <a
                                  key={i}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded-xl border ${
                                    isMine ? 'border-teal-400 bg-teal-700 hover:bg-teal-800' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                  } transition`}
                                >
                                  <FileText size={16} className={isMine ? 'text-teal-200' : 'text-teal-600'} />
                                  <div className="min-w-0">
                                    <p className={`text-xs font-semibold truncate ${isMine ? 'text-white' : 'text-gray-900'}`}>
                                      {att.name}
                                    </p>
                                    <p className={`text-xs ${isMine ? 'text-teal-200' : 'text-gray-500'}`}>
                                      {formatSize(att.size)}
                                    </p>
                                  </div>
                                </a>
                              ))}
                              {msg.content && !msg.content.startsWith('📎') && (
                                <p className="whitespace-pre-line leading-relaxed text-sm">{msg.content}</p>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                          )}
                          <p className={`text-xs mt-1 ${isMine ? 'text-teal-200' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="px-4 py-3 border-t border-gray-200 bg-white">
                <div className="flex gap-2 items-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition flex-shrink-0"
                    title="Joindre un document"
                  >
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                  </button>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Écrire un message... (Entrée pour envoyer)"
                    rows={2}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 resize-none text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!text.trim() || sending}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition flex-shrink-0"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-10">
                  📎 Formats acceptés : PDF, JPG, PNG (max 10 Mo)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MODAL NOUVELLE CONVERSATION ── */}
      {showNewConv && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Nouveau message</h2>
              <button onClick={() => { setShowNewConv(false); setContactSearch(''); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Rechercher un patient, médecin, pharmacie..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
              {loadingContacts ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-teal-600" size={24} />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">Aucun contact trouvé</div>
              ) : (
                filteredContacts.map(c => (
                  <button
                    key={c.userId}
                    onClick={() => startConversation(c)}
                    disabled={creatingConv}
                    className="w-full text-left px-6 py-3 hover:bg-gray-50 transition flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-700 font-bold text-sm">{c.displayName[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{c.displayName}</p>
                      <p className="text-xs text-gray-500">{c.subtitle}</p>
                    </div>
                    {creatingConv && <Loader2 size={14} className="animate-spin text-teal-600 ml-auto" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
