'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, Loader2, MessageSquare, Calendar, ChevronLeft } from 'lucide-react';

interface ConvDoctor { _id: string; firstName: string; lastName: string; specialty: string }
interface ConvAppointment { _id: string; date: string; time: string; reason?: string; status: string }
interface Conversation {
  _id: string;
  doctorId: ConvDoctor;
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

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('conv');

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user) { router.push('/auth/login'); return; }
        setMyId(data.user.id);
      });

    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => setConvs(data.conversations || []))
      .finally(() => setLoadingConvs(false));
  }, [router]);

  useEffect(() => {
    if (!selectedId || !convs.length) return;
    const conv = convs.find(c => c._id === selectedId);
    if (!conv) return;
    openConversation(conv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, convs]);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    const res = await fetch(`/api/conversations/${conv._id}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setLoadingMsgs(false);
    // Mark as read locally
    setConvs(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
    router.replace(`/messages?conv=${conv._id}`, { scroll: false });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1">
            ← Accueil
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="text-blue-600" size={24} /> Mes messages
        </h1>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="flex h-full">

            {/* ── LISTE CONVERSATIONS ── */}
            <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
              {loadingConvs ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={28} />
                </div>
              ) : convs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare size={40} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Aucune conversation</p>
                  <p className="text-sm text-gray-400 mt-1">Prenez un rendez-vous pour démarrer une conversation.</p>
                  <Link href="/doctors" className="mt-4 text-blue-600 text-sm font-semibold hover:underline">
                    Trouver un médecin →
                  </Link>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {convs.map(conv => (
                    <button
                      key={conv._id}
                      onClick={() => openConversation(conv)}
                      className={`w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition ${activeConv?._id === conv._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-gray-900 text-sm">
                          Dr. {conv.doctorId.firstName} {conv.doctorId.lastName}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 mb-1">{conv.doctorId.specialty}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                        <Calendar size={10} />
                        {new Date(conv.appointmentId.date).toLocaleDateString('fr-FR')} à {conv.appointmentId.time}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── CHAT ── */}
            <div className={`flex-1 flex flex-col ${activeConv ? 'flex' : 'hidden md:flex'}`}>
              {!activeConv ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MessageSquare size={48} className="mx-auto mb-3 text-gray-200" />
                    <p>Sélectionnez une conversation</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header chat */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                    <button onClick={() => { setActiveConv(null); router.replace('/messages', { scroll: false }); }} className="md:hidden p-1">
                      <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                      <p className="font-bold text-gray-900">Dr. {activeConv.doctorId.firstName} {activeConv.doctorId.lastName}</p>
                      <p className="text-xs text-gray-500">
                        RDV du {new Date(activeConv.appointmentId.date).toLocaleDateString('fr-FR')} à {activeConv.appointmentId.time}
                        {activeConv.appointmentId.reason ? ` · ${activeConv.appointmentId.reason}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMsgs ? (
                      <div className="flex justify-center pt-8">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isMine = msg.senderId === myId;
                        return (
                          <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                              isMine
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                            }`}>
                              {!isMine && (
                                <p className="text-xs font-bold text-blue-600 mb-1">
                                  Dr. {activeConv.doctorId.firstName} {activeConv.doctorId.lastName}
                                </p>
                              )}
                              <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div className="px-4 py-3 border-t border-gray-200">
                    <div className="flex gap-2">
                      <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Écrivez votre message... (Entrée pour envoyer)"
                        rows={2}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 resize-none text-sm"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!text.trim() || sending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition flex-shrink-0"
                      >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
