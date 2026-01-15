import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/authUser.js';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const semanticSearch = async (req: AuthRequest, res: Response) => {
    try {
        const { query, limit, category } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const response = await axios.post(`${AI_SERVICE_URL}/search/semantic`, {
            query,
            user_id: userId.toString(),
            limit: limit || 5,
            category
        });

        res.status(200).json({
            success: true,
            data: response.data.results
        });
    } catch (error: any) {
        console.error('Semantic Search Error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Failed to perform semantic search' });
    }
};

export const chatWithHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { message, contextLimit } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const response = await axios.post(`${AI_SERVICE_URL}/chat/history`, {
            message,
            user_id: userId.toString(),
            context_limit: contextLimit || 5
        });

        res.status(200).json({
            success: true,
            data: response.data
        });
    } catch (error: any) {
        console.error('History Chat Error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Failed to chat with contract history' });
    }
};
