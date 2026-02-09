'use client';

/**
 * Team AI Chat - Conversational AI with access to team decisions
 * Features smart context retrieval and conversation persistence
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Send,
    Trash2,
    Bot,
    User,
    Sparkles,
    AlertCircle,
    ChevronDown,
    FileText,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
    created_at: string;
}

export default function ChatPage() {
    const { user, session } = useAuth();
    const { selectedTeam, loading: teamsLoading, userRole } = useTeam();
    const router = useRouter();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!user && !teamsLoading) {
            router.push('/login');
        }
    }, [user, teamsLoading, router]);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchHistory();
        }
    }, [selectedTeam, session]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    async function fetchHistory() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/chat/history`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
            }
        } catch (err) {
            console.error('Failed to fetch chat history:', err);
        } finally {
            setLoading(false);
        }
    }

    const sendMessage = useCallback(async () => {
        if (!input.trim() || !selectedTeam || !session?.access_token || sending) return;

        const messageText = input.trim();
        setInput('');
        setSending(true);
        setError(null);

        // Optimistic update
        const tempUserMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: messageText,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/chat`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: messageText }),
                }
            );

            if (response.ok) {
                const data = await response.json();

                // Replace temp message with real one and add assistant response
                setMessages(prev => [
                    ...prev.filter(m => m.id !== tempUserMessage.id),
                    data.userMessage,
                    data.assistantMessage
                ]);
            } else {
                throw new Error('Failed to send message');
            }
        } catch (err) {
            console.error('Chat error:', err);
            setError('Failed to send message. Please try again.');
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
            setInput(messageText); // Restore input
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    }, [input, selectedTeam, session, sending]);

    async function clearChat() {
        if (!selectedTeam || !session?.access_token) return;
        if (!confirm('Are you sure you want to clear all chat history?')) return;

        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/chat/clear`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );
            setMessages([]);
        } catch (err) {
            console.error('Failed to clear chat:', err);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (teamsLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-secondary">Loading chat...</span>
                </div>
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Bot className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                    <p className="text-text-secondary">No team selected</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-h1 text-text-primary mb-1 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        Team Chat
                    </h1>
                    <p className="text-body text-text-secondary">
                        AI assistant with access to {selectedTeam.team.name}'s decisions
                    </p>
                </div>
                {userRole === 'admin' && messages.length > 0 && (
                    <button
                        onClick={clearChat}
                        className="flex items-center gap-2 px-3 py-2 text-text-tertiary hover:text-conflict hover:bg-conflict-light rounded-lg text-small transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Messages Container */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mb-4">
                                <Bot className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-h3 text-text-primary mb-2">Start a conversation</h3>
                            <p className="text-text-secondary max-w-md">
                                Ask questions about your team's decisions, get summaries, or explore your knowledge base.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                {['What decisions have we made recently?', 'Summarize our key priorities', 'Are there any conflicts?'].map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => setInput(prompt)}
                                        className="px-3 py-2 bg-neutral-light text-text-secondary text-small rounded-lg hover:bg-primary-light hover:text-primary transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-primary" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                            ? 'bg-primary text-white rounded-br-md'
                                            : 'bg-neutral-light text-text-primary rounded-bl-md'
                                        }`}
                                >
                                    <p className="text-body whitespace-pre-wrap">{message.content}</p>
                                    <div className={`flex items-center gap-2 mt-2 text-meta ${message.role === 'user' ? 'text-white/70' : 'text-text-tertiary'
                                        }`}>
                                        <span>{formatTime(message.created_at)}</span>
                                        {message.sources && message.sources.length > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    {message.sources.length} sources
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {message.role === 'user' && (
                                    <div className="w-8 h-8 bg-aligned-light rounded-lg flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-aligned" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {sending && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                            <div className="bg-neutral-light rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-small text-text-tertiary">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="px-4 py-2 bg-conflict-light border-t border-conflict/20">
                        <div className="flex items-center gap-2 text-conflict text-small">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="border-t border-border p-4">
                    <div className="flex gap-3">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your team's decisions..."
                            rows={1}
                            className="flex-1 px-4 py-3 bg-neutral-light border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            disabled={sending}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || sending}
                            className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-meta text-text-tertiary mt-2 text-center">
                        AI responses are based on your team's uploaded decisions. Press Enter to send.
                    </p>
                </div>
            </Card>
        </div>
    );
}
