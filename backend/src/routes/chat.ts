/**
 * Chat Routes (Team-Scoped)
 * 
 * POST /api/teams/:teamId/chat - Send message, get AI response
 * GET /api/teams/:teamId/chat/history - Get conversation history
 * DELETE /api/teams/:teamId/chat/clear - Clear conversation history
 * 
 * Uses smart retrieval for token-efficient context injection
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';
import { supabaseService } from '../services/supabase';
import { geminiService } from '../services/gemini';
import { chatRetriever } from '../services/chat-retriever';

const router = Router();

interface ChatMessage {
    id: string;
    team_id: string;
    user_id: string | null;
    role: 'user' | 'assistant';
    content: string;
    sources: string[];
    created_at: string;
}

/**
 * POST /api/teams/:teamId/chat
 * Send a message and get AI response.
 * Stores both user message and AI response in database.
 */
router.post(
    '/teams/:teamId/chat',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;
            const userId = req.userId!;
            const { message } = req.body;

            if (!message || typeof message !== 'string') {
                return res.status(400).json({ error: 'Message is required' });
            }

            // 1. Store user message
            const userMessage = await storeMessage(teamId, userId, 'user', message, []);

            // 2. Get recent conversation history
            const history = await getConversationHistory(teamId, 10);

            // 3. Retrieve relevant decisions using smart retrieval
            const allDecisions = await supabaseService.getDecisions(teamId, 100, 0);
            const retrieval = chatRetriever.retrieve(message, allDecisions);
            const contextStr = chatRetriever.formatContext(retrieval.decisions);

            // 4. Generate AI response
            const historyForAI = history.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }));

            const aiResult = await geminiService.chat(message, contextStr, historyForAI);

            // 5. Store AI response
            const aiMessage = await storeMessage(teamId, null, 'assistant', aiResult.response, aiResult.sources);

            res.json({
                success: true,
                userMessage,
                assistantMessage: aiMessage,
                context: {
                    decisionsUsed: retrieval.decisions.length,
                    tokensUsed: retrieval.tokenCount
                }
            });
        } catch (error) {
            console.error('Chat error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Chat failed'
            });
        }
    }
);

/**
 * GET /api/teams/:teamId/chat/history
 * Get conversation history for the team.
 */
router.get(
    '/teams/:teamId/chat/history',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;
            const limit = parseInt(req.query.limit as string || '50', 10);

            const messages = await getConversationHistory(teamId, limit);

            res.json({
                success: true,
                messages,
                count: messages.length
            });
        } catch (error) {
            console.error('Get chat history error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to get chat history'
            });
        }
    }
);

/**
 * DELETE /api/teams/:teamId/chat/clear
 * Clear all conversation history for the team.
 * Requires admin role.
 */
router.delete(
    '/teams/:teamId/chat/clear',
    authenticateUser,
    requireTeamAccess('admin'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;

            await clearConversation(teamId);

            res.json({
                success: true,
                message: 'Conversation history cleared'
            });
        } catch (error) {
            console.error('Clear chat error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to clear chat history'
            });
        }
    }
);

// ===========================================
// Helper functions for database operations
// ===========================================

async function storeMessage(
    teamId: string,
    userId: string | null,
    role: 'user' | 'assistant',
    content: string,
    sources: string[]
): Promise<ChatMessage> {
    const { data, error } = await supabaseService.client
        .from('chat_messages')
        .insert({
            team_id: teamId,
            user_id: userId,
            role,
            content,
            sources
        })
        .select()
        .single();

    if (error) {
        console.error('Error storing chat message:', error);
        // Return in-memory message if DB fails (graceful degradation)
        return {
            id: crypto.randomUUID(),
            team_id: teamId,
            user_id: userId,
            role,
            content,
            sources,
            created_at: new Date().toISOString()
        };
    }

    return data;
}

async function getConversationHistory(teamId: string, limit: number): Promise<ChatMessage[]> {
    const { data, error } = await supabaseService.client
        .from('chat_messages')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching chat history:', error);
        return [];
    }

    return data || [];
}

async function clearConversation(teamId: string): Promise<void> {
    const { error } = await supabaseService.client
        .from('chat_messages')
        .delete()
        .eq('team_id', teamId);

    if (error) {
        console.error('Error clearing chat history:', error);
        throw error;
    }
}

export default router;
