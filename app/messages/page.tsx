'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Link from 'next/link';

type Conversation = {
  id: string;
  updatedAt: string;
  lastMessage: {
    content: string;
    createdAt: string;
    sender: {
      anonymousHandle: string;
    };
  } | null;
  participants: {
    id: string;
    anonymousHandle: string;
    verificationStatus: string;
  }[];
  jobPosting: {
    id: string;
    title: string;
  } | null;
  _count: {
    unread: number;
  };
};

export default function MessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    fetchConversations();
  }, [isAuthenticated, router]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-gray-400 text-sm">Private conversations with organizations and operators</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">No Messages Yet</h2>
            <p className="text-gray-400 mb-6">
              {user?.userRole === 'organization' 
                ? 'Start conversations with operators who have applied to your job postings'
                : 'Messages from organizations will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {conversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(
                (p) => p.id !== user?.id
              );

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all block"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">
                            {otherParticipant?.anonymousHandle || 'Unknown'}
                          </span>
                          {otherParticipant?.verificationStatus === 'Approved' && (
                            <span className="text-green-500 text-sm">✓</span>
                          )}
                          {conversation._count.unread > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                              {conversation._count.unread}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {conversation.jobPosting && (
                        <p className="text-sm text-gray-400 mb-2">
                          Regarding: {conversation.jobPosting.title}
                        </p>
                      )}

                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-300 line-clamp-1">
                          <span className="font-medium">
                            {conversation.lastMessage.sender.anonymousHandle}:
                          </span>{' '}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}