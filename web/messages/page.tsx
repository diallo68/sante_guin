'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Send, MoreVertical } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

const conversations: Message[] = [
  {
    id: '1',
    sender: 'Dr. Ahmed Diallo',
    avatar: '👨‍⚕️',
    lastMessage: 'Votre rendez-vous est confirmé pour demain',
    timestamp: '10:30',
    unread: 1,
  },
  {
    id: '2',
    sender: 'Pharmacie Centrale',
    avatar: '💊',
    lastMessage: 'Votre ordonnance est prête',
    timestamp: '09:15',
    unread: 0,
  },
  {
    id: '3',
    sender: 'Dr. Fatou Sow',
    avatar: '👩‍⚕️',
    lastMessage: 'Merci pour votre confiance',
    timestamp: 'Hier',
    unread: 0,
  },
];

const chatMessages: ChatMessage[] = [
  {
    id: '1',
    sender: 'Dr. Ahmed Diallo',
    text: 'Bonjour, comment allez-vous ?',
    timestamp: '10:00',
    isOwn: false,
  },
  {
    id: '2',
    sender: 'Vous',
    text: 'Bonjour, très bien merci !',
    timestamp: '10:05',
    isOwn: true,
  },
  {
    id: '3',
    sender: 'Dr. Ahmed Diallo',
    text: 'Votre rendez-vous est confirmé pour demain à 14h00',
    timestamp: '10:30',
    isOwn: false,
  },
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      console.log('Message envoyé:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← Accueil
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Chercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredConversations.map(conversation => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                    selectedConversation === conversation.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{conversation.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900 truncate">{conversation.sender}</h3>
                        <span className="text-xs text-gray-600 ml-2">{conversation.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unread > 0 && (
                      <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">👨‍⚕️</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dr. Ahmed Diallo</h3>
                    <p className="text-xs text-gray-600">En ligne</p>
                  </div>
                </div>
                <button className="text-gray-600 hover:text-gray-900">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.isOwn
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-lg shadow flex items-center justify-center text-gray-600">
              <p>Sélectionnez une conversation pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
