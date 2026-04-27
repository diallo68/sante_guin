'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, Loader2, MessageSquare, Calendar, ChevronLeft } from 'lucide-react';

interface ConvPatient { _id: string; firstName: string; lastName: string }
interface ConvAppointment { _id: string; date: string; time: string; reason?: string; status: string }
interface Conversation {
  _id: string;
  patientId: ConvPatient;
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

export default function ProMessagesPage() {
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

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    const res = await fetch(`/api/conversations/${conv._id}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setLoadingMsgs(false);
    setConvs(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
    router.replace(`/pro/messages?conv=${conv._id}`, { scroll: false });
  };

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

  return (
    <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={20} className="text-teal-600" /> Messages patients
        </h1>
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
              <p className="text-xs text-gray-400 mt-1">Les patients vous écriront lors de leurs prises de RDV.</p>
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
                    <p className="font-bold text-gray-900 text-sm">
                      {conv.patientId.firstName} {conv.patientId.lastName}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
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
                  <p className="font-bold text-gray-900">{activeConv.patientId.firstName} {activeConv.patientId.lastName}</p>
                  <p className="text-xs text-gray-500">
                    RDV du {new Date(activeConv.appointmentId.date).toLocaleDateString('fr-FR')} à {activeConv.appointmentId.time}
                    {activeConv.appointmentId.reason ? ` · ${activeConv.appointmentId.reason}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-8">
                    <Loader2 className="animate-spin text-teal-600" size={24} />
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.senderRole === 'doctor';
                    return (
                      <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-teal-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
                        }`}>
                          {!isMine && (
                            <p className="text-xs font-bold text-teal-600 mb-1">
                              {activeConv.patientId.firstName} {activeConv.patientId.lastName}
                            </p>
                          )}
                          <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
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
                <div className="flex gap-2">
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Répondre au patient... (Entrée pour envoyer)"
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
