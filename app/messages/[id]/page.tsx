'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

type Message = {
  id: string;
  content: string;
  wasRedacted: boolean;
  createdAt: string;
  sender: {
    id: string;
    anonymousHandle: string;
    verificationStatus: string;
  };
};

type Conversation = {
  id: string;
  participants: {
    id: string;
    anonymousHandle: string;
    verificationStatus: string;
  }[];
  jobPosting: {
    id: string;
    title: string;
  } | null;
};

export default function ConversationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    fetchConversation();
    fetchMessages();

    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, router, params.id]);

  useEffect(() => {
    if (authLoading) return;
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${params.id}`);
      if (!response.ok) {
        throw new Error('Conversation not found');
      }
      const data = await response.json();
      setConversation(data.conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/conversations/${params.id}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data.messages || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageToSend = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch(`/api/conversations/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageToSend }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = conversation?.participants.find(
    (p) => p.id !== user?.id
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg">
            Conversation not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              ←
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">
                  {otherParticipant?.anonymousHandle || 'Unknown'}
                </h1>
                {otherParticipant?.verificationStatus === 'Approved' && (
                  <span className="text-green-500 text-sm">✓</span>
                )}
              </div>
              {conversation.jobPosting && (
                <p className="text-sm text-gray-400">
                  Regarding: {conversation.jobPosting.title}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender.id === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">
                          {message.sender.anonymousHandle}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        className={`p-4 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.wasRedacted && (
                          <p className="text-xs text-yellow-400 mt-2">
                            ⚠️ Some contact details were automatically redacted
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <form onSubmit={handleSendMessage} className="flex gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Note: Contact details (email, phone, etc.) will be automatically redacted
          </p>
        </div>
      </div>
    </div>
  );
}