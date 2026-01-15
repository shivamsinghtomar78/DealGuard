import { Request, Response } from 'express';
import ContractTemplate from '../models/ContractTemplate.js';
import Analysis from '../models/Analysis.js';
import { AuthRequest } from '../middleware/authUser.js';

export const getAllTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await ContractTemplate.find({ isPublished: true })
            .populate('createdBy', 'name specialization')
            .sort('-createdAt');
        res.status(200).json({ success: true, count: templates.length, data: templates });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTemplate = async (req: Request, res: Response) => {
    try {
        const template = await ContractTemplate.findById(req.params.id)
            .populate('createdBy', 'name specialization licenseNumber');
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        res.status(200).json({ success: true, data: template });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyContracts = async (req: AuthRequest, res: Response) => {
    try {
        const contracts = await Analysis.find({ userId: req.user?._id })
            .populate('templateId', 'title category')
            .sort('-purchasedAt');
        res.status(200).json({ success: true, count: contracts.length, data: contracts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAnalysis = async (req: AuthRequest, res: Response) => {
    try {
        const analysis = await Analysis.findById(req.params.id)
            .populate('templateId')
            .populate('expertReview.lawyerId', 'name specialization');

        if (!analysis) return res.status(404).json({ success: false, message: 'Analysis not found' });
        if (analysis.userId.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this analysis' });
        }
        res.status(200).json({ success: true, data: analysis });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
