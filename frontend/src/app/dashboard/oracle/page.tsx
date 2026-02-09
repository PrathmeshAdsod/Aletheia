'use client';

/**
 * Oracle - Team-Scoped Executive Assistant Chat
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles } from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { oracleApi } from '@/lib/team-api';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: string[];
}

export default function Oracle() {
    const { user, session } = useAuth();
    const { selectedTeam } = useTeam();
    const router = useRouter();

    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'system',
            content: 'Ask me anything about your institutional decisions. I only answer with verified citations.'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    if (!user) {
        router.push('/login');
        return null;
    }

    if (!selectedTeam) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-text-secondary mb-4">No team selected</p>
                    <p className="text-text-tertiary text-sm">Please contact an admin to be added to a team</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading || !session?.access_token) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await oracleApi.query(
                session.access_token,
                selectedTeam.team.id,
                input
            );

            if ('error' in response) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.error
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.answer,
                    citations: response.citations
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Failed to get response from Oracle'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-h1 text-text-primary mb-2">Oracle</h1>
                <p className="text-body text-text-secondary">
                    Ask questions about {selectedTeam.team.name}'s decisions with verified citations
                </p>
            </div>

            {/* Chat Container */}
            <Card className="p-0 overflow-hidden">
                {/* Messages */}
                <div className="h-[600px] overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, i) => (
                        <div key={i}>
                            {msg.role === 'system' && (
                                <div className="flex justify-center">
                                    <div className="px-4 py-2 bg-neutral-light rounded-full text-meta text-text-secondary">
                                        {msg.content}
                                    </div>
                                </div>
                            )}

                            {msg.role === 'user' && (
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] px-4 py-3 bg-primary text-white rounded-2xl rounded-tr-sm">
                                        <p className="text-small">{msg.content}</p>
                                    </div>
                                </div>
                            )}

                            {msg.role === 'assistant' && (
                                <div className="flex justify-start">
                                    <div className="max-w-[80%]">
                                        <div className="px-4 py-3 bg-surface border border-border rounded-2xl rounded-tl-sm">
                                            <p className="text-small text-text-primary whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                        </div>

                                        {msg.citations && msg.citations.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="text-meta text-text-tertiary">Sources:</span>
                                                {msg.citations.map((citation, idx) => (
                                                    <button
                                                        key={idx}
                                                        className="px-2 py-1 bg-primary-light text-primary text-meta rounded-full font-mono hover:bg-primary hover:text-white transition-colors"
                                                    >
                                                        {citation.substring(0, 8)}...
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="px-4 py-3 bg-surface border border-border rounded-2xl rounded-tl-sm">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="text-primary animate-pulse" size={16} />
                                    <span className="text-small text-text-tertiary">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-border p-4">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about a decision..."
                            className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small text-text-primary placeholder:text-text-tertiary"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="px-6 py-3 bg-primary hover:bg-primary-hover rounded-lg font-semibold text-white disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <Send size={16} />
                            <span>Send</span>
                        </button>
                    </form>

                    <p className="text-meta text-text-tertiary mt-2">
                        Oracle only provides answers with verified citations from your decision graph
                    </p>
                </div>
            </Card>
        </div>
    );
}
