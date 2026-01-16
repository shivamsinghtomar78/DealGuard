import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/authUser.js';
import { uploadFileForAnalysis, redlineContractWithAI } from '../utils/aiClient.js';
import Analysis from '../models/Analysis.js';
import User from '../models/User.js';


export const uploadAndAnalyze = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { templateId, category } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Create a pending analysis record
        const analysis = await Analysis.create({
            userId,
            templateId: templateId || null,
            contractFileName: req.file.originalname,
            contractFilePath: req.file.path,
            status: 'analyzing', // Start with 'analyzing'
            overallRiskScore: 0,
            riskAssessments: [],
            aiSummary: 'Analysis in progress...',
            fullText: '',
            engineVersion: '2.1.0-Elite-Async',
            purchasedAt: new Date(),
            agentLogs: [{
                agent: 'System',
                action: 'initialize',
                message: 'Analysis initiated. Document queued for processing.',
                timestamp: new Date(),
                node: 'start'
            }]
        });

        // Add to user's purchased analyses
        await User.findByIdAndUpdate(userId, {
            $push: { purchasedAnalyses: analysis._id }
        });

        // Trigger Python AI service asynchronously
        // Construct webhook URL - use SERVER_URL env var in production, or detect from request
        const serverBaseUrl = process.env.SERVER_URL ||
            `${process.env.NODE_ENV === 'production' ? 'https' : req.protocol}://${req.get('host')}`;
        const webhookUrl = `${serverBaseUrl}/api/contracts/webhook/analysis`;

        console.log(`Webhook URL: ${webhookUrl}`);

        // We don't await the full analysis result here anymore
        uploadFileForAnalysis(
            req.file.path,
            analysis._id.toString(),
            category || 'other',
            webhookUrl
        ).catch(err => {
            console.error('Async AI Trigger Error:', err);
            // Optionally update analysis status to 'failed' if trigger fails
            Analysis.findByIdAndUpdate(analysis._id, {
                status: 'pending', // Revert to pending
                aiSummary: 'Failed to initiate AI analysis. Our team has been notified.'
            }).exec();
        });


        res.status(201).json({
            success: true,
            data: {
                analysisId: analysis._id,
                status: 'analyzing',
                message: 'Analysis started in background'
            }
        });
    } catch (error: any) {
        console.error('Upload and analyze error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAnalysisDetails = async (req: AuthRequest, res: Response) => {
    try {
        const analysis = await Analysis.findById(req.params.id)
            .populate('templateId')
            .populate('expertReview.lawyerId', 'name specialization');

        if (!analysis) {
            return res.status(404).json({ success: false, message: 'Analysis not found' });
        }

        // Check ownership
        if (analysis.userId.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.status(200).json({ success: true, data: analysis });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const redlineContract = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { originalClause, alternativeClause } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const analysis = await Analysis.findById(id);
        if (!analysis) {
            return res.status(404).json({ success: false, message: 'Analysis not found' });
        }

        // Check ownership
        if (analysis.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (!analysis.contractFilePath.endsWith('.docx')) {
            return res.status(400).json({ success: false, message: 'Redlining is only supported for DOCX files' });
        }

        const redlinedFileBuffer = await redlineContractWithAI(
            analysis.contractFilePath,
            originalClause,
            alternativeClause
        );

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=redlined_${path.basename(analysis.contractFilePath)}`);
        res.send(redlinedFileBuffer);

    } catch (error: any) {
        console.error('Redline error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

import path from 'path';
import mongoose from 'mongoose';

export const addRiskComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id, clauseIdx } = req.params;
        const { content, mentions } = req.body;
        const userId = req.user?._id;
        const userName = req.user?.name || 'Anonymous';

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        if (!content) {
            return res.status(400).json({ success: false, message: 'Comment content is required' });
        }

        const analysis = await Analysis.findById(id);
        if (!analysis) {
            return res.status(404).json({ success: false, message: 'Analysis not found' });
        }

        const idx = parseInt(clauseIdx as string);

        if (isNaN(idx) || idx < 0 || idx >= analysis.riskAssessments.length) {
            return res.status(400).json({ success: false, message: 'Invalid clause index' });
        }

        const newComment = {
            userId: userId as mongoose.Types.ObjectId,
            userName,
            content,
            mentions: Array.isArray(mentions) ? mentions : [],
            timestamp: new Date()
        };

        // Initialize comments array if it doesn't exist
        if (!analysis.riskAssessments[idx].comments) {
            analysis.riskAssessments[idx].comments = [];
        }

        analysis.riskAssessments[idx].comments!.push(newComment);
        await analysis.save();

        res.status(201).json({ success: true, data: newComment });
    } catch (error: any) {
        console.error('Add comment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const handleAnalysisWebhook = async (req: Request, res: Response) => {
    try {
        const {
            contract_id,
            status,
            overall_risk_score,
            executive_summary,
            risk_assessments,
            agent_logs,
            full_text,
            error,
            // New enhanced fields
            top_critical_issues,
            recommendation,
            recommendation_reasoning,
            action_items,
            risk_breakdown
        } = req.body;

        console.log(`WebHook received for contract: ${contract_id}, status: ${status}`);

        const analysis = await Analysis.findById(contract_id);
        if (!analysis) {
            return res.status(404).json({ success: false, message: 'Analysis not found' });
        }

        if (status === 'failed') {
            analysis.status = 'pending'; // Reset to allow retry
            analysis.aiSummary = `Analysis failed: ${error}`;
            await analysis.save();
            console.log(`❌ Analysis ${contract_id} marked as failed: ${error}`);
            return res.status(200).json({ success: true });
        }

        // Handle progress updates (status = 'analyzing')
        if (status === 'analyzing') {
            // Just update agent logs for progress display
            const mappedAgentLogs = (agent_logs || []).map((log: any) => ({
                agent: log.agent,
                action: log.action,
                message: log.message,
                timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
                node: log.node,
                data: log.data
            }));

            analysis.agentLogs = mappedAgentLogs;
            await analysis.save();
            console.log(`📡 Progress update for ${contract_id}`);
            return res.status(200).json({ success: true });
        }

        // Map AI result fields to camelCase with enhanced fields
        const mappedRiskAssessments = (risk_assessments || []).map((ra: any) => ({
            clauseId: ra.clause_id || ra.clauseId || `unknown_${Math.random().toString(36).substr(2, 9)}`,
            clauseText: ra.clause_text || ra.clauseText || '',
            riskLevel: ra.risk_level || ra.riskLevel || 'medium',
            riskType: ra.risk_type || ra.riskType || 'legal',
            riskCategory: ra.risk_category || ra.riskCategory || '',
            riskExplanation: ra.risk_explanation || ra.riskExplanation || '',
            potentialImpact: ra.potential_impact || ra.potentialImpact || '',
            worstCaseScenario: ra.worst_case_scenario || ra.worstCaseScenario || '',
            financialExposure: ra.financial_exposure || ra.financialExposure || '',
            estimatedLossRange: ra.estimated_loss_range || ra.estimatedLossRange || '',
            realWorldExample: ra.real_world_example || ra.realWorldExample || '',
            standardAlternative: ra.standard_alternative || ra.standardAlternative || '',
            legalReasoning: ra.legal_reasoning || ra.legalReasoning || ''
        }));

        const mappedAgentLogs = (agent_logs || []).map((log: any) => ({
            agent: log.agent,
            action: log.action,
            message: log.message,
            timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
            node: log.node,
            data: log.data
        }));

        // Map action items from snake_case
        const mappedActionItems = action_items ? {
            mustFix: action_items.must_fix || action_items.mustFix || [],
            shouldNegotiate: action_items.should_negotiate || action_items.shouldNegotiate || [],
            niceToHave: action_items.nice_to_have || action_items.niceToHave || []
        } : undefined;

        analysis.overallRiskScore = overall_risk_score || 0;
        analysis.riskAssessments = mappedRiskAssessments;
        analysis.aiSummary = executive_summary || '';
        analysis.fullText = full_text || '';
        analysis.status = 'completed';
        analysis.completedAt = new Date();
        analysis.agentLogs = mappedAgentLogs;

        // Enhanced summary fields
        analysis.topCriticalIssues = top_critical_issues || [];
        analysis.recommendation = recommendation || 'negotiate';
        analysis.recommendationReasoning = recommendation_reasoning || '';
        analysis.actionItems = mappedActionItems;
        analysis.riskBreakdown = risk_breakdown || { financial: 0, legal: 0, operational: 0, reputational: 0 };

        await analysis.save();

        console.log(`Successfully updated analysis ${contract_id} via WebHook`);
        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('WebHook Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
