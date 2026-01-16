import mongoose, { Schema, Document } from 'mongoose';

export interface IRiskAssessment {
    clauseId?: string;
    clauseText: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskType?: 'financial' | 'legal' | 'operational' | 'reputational';
    riskCategory?: string;
    riskExplanation: string;
    potentialImpact?: string;
    worstCaseScenario?: string;
    financialExposure?: string;
    estimatedLossRange?: string;
    realWorldExample?: string;
    standardAlternative?: string;
    legalReasoning?: string;
    comments?: IComment[];
}

export interface IComment {
    _id?: string;
    userId: mongoose.Types.ObjectId;
    userName: string;
    content: string;
    mentions?: string[];
    timestamp: Date;
}

export interface IAgentLog {
    agent: string;
    action: string;
    message: string;
    timestamp: Date;
    node: string;
    data?: any;
}

export interface IActionItems {
    mustFix: string[];
    shouldNegotiate: string[];
    niceToHave: string[];
}

export interface IAnalysis extends Document {
    userId: mongoose.Types.ObjectId;
    templateId?: mongoose.Types.ObjectId;
    contractFileName: string;
    contractFilePath: string;
    overallRiskScore: number;
    riskAssessments: IRiskAssessment[];
    aiSummary?: string;
    engineVersion?: string;
    // Enhanced summary fields
    topCriticalIssues?: string[];
    recommendation?: 'approve' | 'negotiate' | 'reject';
    recommendationReasoning?: string;
    actionItems?: IActionItems;
    riskBreakdown?: {
        financial: number;
        legal: number;
        operational: number;
        reputational: number;
    };
    expertReview?: {
        lawyerId: mongoose.Types.ObjectId;
        comments: string;
        reviewedAt: Date;
    };
    status: 'pending' | 'analyzing' | 'completed' | 'expert-review';
    purchasedAt: Date;
    completedAt?: Date;
    fullText?: string;
    agentLogs: IAgentLog[];
}

const RiskAssessmentSchema: Schema = new Schema({
    clauseId: String,
    clauseText: String,
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
    },
    riskType: {
        type: String,
        enum: ['financial', 'legal', 'operational', 'reputational']
    },
    riskCategory: String,
    riskExplanation: String,
    potentialImpact: String,
    worstCaseScenario: String,
    financialExposure: String,
    estimatedLossRange: String,
    realWorldExample: String,
    standardAlternative: String,
    legalReasoning: String,
    comments: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        content: String,
        mentions: [String],
        timestamp: { type: Date, default: Date.now }
    }]
});

const AnalysisSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'ContractTemplate' },
    contractFileName: { type: String, required: true },
    contractFilePath: { type: String, required: true },
    overallRiskScore: { type: Number, min: 0, max: 10 },
    riskAssessments: [RiskAssessmentSchema],
    aiSummary: String,
    engineVersion: { type: String, default: '2.3.0' },
    // Enhanced summary fields
    topCriticalIssues: [String],
    recommendation: {
        type: String,
        enum: ['approve', 'negotiate', 'reject']
    },
    recommendationReasoning: String,
    actionItems: {
        mustFix: [String],
        shouldNegotiate: [String],
        niceToHave: [String]
    },
    riskBreakdown: {
        financial: { type: Number, default: 0 },
        legal: { type: Number, default: 0 },
        operational: { type: Number, default: 0 },
        reputational: { type: Number, default: 0 }
    },
    expertReview: {
        lawyerId: { type: Schema.Types.ObjectId, ref: 'Lawyer' },
        comments: String,
        reviewedAt: Date
    },
    status: {
        type: String,
        enum: ['pending', 'analyzing', 'completed', 'expert-review'],
        default: 'pending'
    },
    purchasedAt: { type: Date, default: Date.now },
    completedAt: Date,
    fullText: String,
    agentLogs: [{
        agent: String,
        action: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
        node: String,
        data: Schema.Types.Mixed
    }]
});

export default mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
