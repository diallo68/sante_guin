'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, Trash2, Loader2, Paperclip, X, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // base64 data URL pour affichage
}

const SUGGESTIONS = [
  'Quels sont les critères de diagnostic du paludisme grave ?',
  'Interactions médicamenteuses entre l\'artéméther et la quinine',
  'Protocole de traitement de la typhoïde chez l\'adulte',
  'Interprétation d\'une NFS avec hyperleucocytose',
  'Rédige une ordonnance pour une HTA légère',
  'Signes d\'alerte d\'une hépatite fulminante',
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 10 Mo');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({ file, preview: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if ((!content && !selectedImage) || loading) return;

    const displayContent = content || (selectedImage ? '📎 Image jointe pour analyse' : '');
    const userMsg: Message = { role: 'user', content: displayContent, image: selectedImage?.preview };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    const imageToSend = selectedImage?.preview || null;
    setSelectedImage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          image: imageToSend,
          imagePrompt: content || 'Analyse et interprète ce document médical (ordonnance, résultat d\'examen ou autre). Fournis une interprétation clinique détaillée.',
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erreur : ' + (data.error || 'Service indisponible') }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erreur de connexion. Vérifiez votre réseau.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold mt-2">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\./, '').trim()}</li>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bot className="text-teal-600" size={26} />
            Votre Collaborateur
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Aide à la décision clinique · Analyse de documents</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setSelectedImage(null); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={15} /> Effacer
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
        <span>Outil d'aide à la décision médicale — réservé aux professionnels de santé. La décision clinique finale appartient toujours au médecin.</span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
              <Bot className="text-teal-600" size={32} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Bonjour Docteur</h2>
            <p className="text-gray-500 text-sm mb-2 max-w-sm">
              Posez vos questions cliniques ou envoyez une image d'ordonnance / résultat d'examen pour analyse.
            </p>
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2 mb-6 text-sm text-teal-700">
              <ImageIcon size={15} />
              <span>Joignez une photo via le bouton <strong>📎</strong> pour interpréter un document médical</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-3 bg-gray-50 hover:bg-teal-50 hover:border-teal-300 border border-gray-200 rounded-xl text-sm text-gray-700 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-teal-600'
              }`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                {msg.image && (
                  <div className="relative w-48 h-36 rounded-xl overflow-hidden border border-gray-200">
                    <Image src={msg.image} alt="Document médical" fill className="object-cover" />
                  </div>
                )}
                {msg.content && msg.content !== '📎 Image jointe pour analyse' && (
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant'
                      ? <div className="space-y-0.5">{formatContent(msg.content)}</div>
                      : msg.content
                    }
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 size={15} className="animate-spin" />
              Analyse en cours…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {selectedImage && (
        <div className="mt-2 flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={selectedImage.preview} alt="Document à analyser" fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-teal-800 truncate">{selectedImage.file.name}</p>
            <p className="text-xs text-teal-600">Prêt pour analyse — ajoutez un commentaire si besoin</p>
          </div>
          <button onClick={() => setSelectedImage(null)} className="text-teal-500 hover:text-red-500 transition">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="mt-2 flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Joindre une ordonnance ou un résultat d'examen"
          className="p-3.5 bg-gray-100 hover:bg-teal-100 hover:text-teal-700 text-gray-500 rounded-xl transition flex-shrink-0"
        >
          <Paperclip size={18} />
        </button>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedImage ? 'Ajoutez un commentaire ou envoyez directement...' : 'Posez votre question ou joignez un document... (📎)'}
          rows={2}
          className="flex-1 px-4 py-3 border-2 border-gray-200 focus:border-teal-500 rounded-xl outline-none resize-none text-sm text-gray-800 placeholder-gray-400 transition"
        />
        <button
          onClick={() => sendMessage()}
          disabled={(!input.trim() && !selectedImage) || loading}
          className="p-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-xl transition flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
