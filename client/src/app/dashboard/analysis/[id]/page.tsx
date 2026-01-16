'use client';

import { contractAPI, signatureAPI } from '@/lib/api';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DocumentViewer from '@/components/DocumentViewer';
import AgentVisualizer, { AgentLog } from '@/components/AgentVisualizer';
import CommentThread, { Comment } from '@/components/CommentThread';
import AnalysisGauges from '@/components/AnalysisGauges';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle,
    ShieldAlert,
    ShieldCheck,
    FileText,
    ArrowLeft,
    Lightbulb,
    Scale,
    Gavel,
    Info,
    ChevronDown,
    ChevronUp,
    Download,
    Share2,
    Calendar,
    Clock,
    Zap,
    ExternalLink,
    MousePointer2,
    BrainCircuit,
    DollarSign,
    AlertOctagon,
    CheckSquare,
    XCircle,
    TrendingUp,
    Briefcase,
    Building2,
    Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { toast } from 'sonner';

interface RiskAssessment {
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
    // Defensive fallbacks for raw AI data
    clause_id?: string;
    clause_text?: string;
    risk_level?: string;
    risk_type?: string;
    risk_explanation?: string;
    standard_alternative?: string;
    legal_reasoning?: string;
    worst_case_scenario?: string;
    financial_exposure?: string;
    real_world_example?: string;
    comments?: Comment[];
}

interface ActionItems {
    mustFix: string[];
    shouldNegotiate: string[];
    niceToHave: string[];
}

interface Analysis {
    _id: string;
    contractFileName: string;
    overallRiskScore: number;
    riskAssessments: RiskAssessment[];
    aiSummary?: string;
    status: string;
    purchasedAt: string;
    fullText?: string;
    contractFilePath?: string;
    agentLogs?: AgentLog[];
    // Enhanced fields
    topCriticalIssues?: string[];
    recommendation?: 'approve' | 'negotiate' | 'reject';
    recommendationReasoning?: string;
    actionItems?: ActionItems;
    riskBreakdown?: {
        financial: number;
        legal: number;
        operational: number;
        reputational: number;
    };
    // Fallbacks
    overall_risk_score?: number;
    executive_summary?: string;
}

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedlining, setIsRedlining] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [expandedCards, setExpandedCards] = useState<number[]>([]);
    const [activeHighlight, setActiveHighlight] = useState<string | undefined>(undefined);
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [activeTab, setActiveTab] = useState<'risks' | 'actions'>('risks');

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchAnalysis = async () => {
            try {
                if (!params.id) return;
                const response = await contractAPI.getAnalysis(params.id as string);
                const data = response.data.data;

                // Add defensive mapping logic
                if (data && data.riskAssessments) {
                    data.riskAssessments = data.riskAssessments.map((ra: any) => ({
                        ...ra,
                        clauseText: ra.clauseText || ra.clause_text || '',
                        riskLevel: ra.riskLevel || ra.risk_level || 'medium',
                        riskType: ra.riskType || ra.risk_type || 'legal',
                        riskExplanation: ra.riskExplanation || ra.risk_explanation || '',
                        worstCaseScenario: ra.worstCaseScenario || ra.worst_case_scenario || '',
                        financialExposure: ra.financialExposure || ra.financial_exposure || '',
                        realWorldExample: ra.realWorldExample || ra.real_world_example || '',
                        standardAlternative: ra.standardAlternative || ra.standard_alternative || '',
                        legalReasoning: ra.legalReasoning || ra.legal_reasoning || ''
                    }));
                }

                setAnalysis(data);

                if (data && (data.status === 'analyzing' || data.status === 'pending')) {
                    if (!intervalId) {
                        intervalId = setInterval(fetchAnalysis, 3000);
                    }
                } else if (intervalId) {
                    clearInterval(intervalId);
                }

            } catch (error) {
                console.error('Failed to fetch analysis:', error);
                if (!analysis) {
                    toast.error('Failed to load analysis details.');
                    router.push('/dashboard/contracts');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [params.id, router, analysis?.status]);

    const toggleCard = (idx: number) => {
        setExpandedCards(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const handleApplyAlternative = async (originalClause: string, alternativeClause: string, idx: number) => {
        if (!params.id) return;

        try {
            setIsRedlining(`cl-${idx}`);
            toast.loading('Generating redlined document...', { id: 'redlining' });

            const response = await contractAPI.redlineContract(
                params.id as string,
                originalClause,
                alternativeClause
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `redlined_${analysis?.contractFileName || 'contract.docx'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Redlined document generated successfully!', { id: 'redlining' });
        } catch (error: any) {
            console.error('Redlining failed:', error);
            toast.error(error.response?.data?.message || 'Failed to generate redlined document', { id: 'redlining' });
        } finally {
            setIsRedlining(null);
        }
    };

    const handleExportToDocuSign = async () => {
        if (!params.id) return;

        try {
            setIsExporting(true);
            toast.loading('Preparing DocuSign envelope...', { id: 'docusign' });

            const response = await signatureAPI.exportToDocuSign(params.id as string);
            const { signingUrl } = response.data.data;

            toast.success('Contract exported to DocuSign!', { id: 'docusign' });

            setTimeout(() => {
                window.open(signingUrl, '_blank');
            }, 1000);

        } catch (error: any) {
            console.error('DocuSign export failed:', error);
            toast.error(error.response?.data?.message || 'Failed to export to DocuSign', { id: 'docusign' });
        } finally {
            setIsExporting(false);
        }
    };

    const getRiskStyles = (level: string) => {
        const l = level?.toLowerCase();
        switch (l) {
            case 'critical': return {
                color: 'text-rose-400',
                bg: 'bg-rose-500/10',
                border: 'border-rose-500/30',
                glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
                icon: AlertTriangle
            };
            case 'high': return {
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
                border: 'border-orange-500/30',
                glow: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]',
                icon: ShieldAlert
            };
            case 'medium': return {
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/30',
                glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
                icon: Info
            };
            default: return {
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/30',
                glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
                icon: ShieldCheck
            };
        }
    };

    const getRiskTypeIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'financial': return DollarSign;
            case 'legal': return Gavel;
            case 'operational': return Briefcase;
            case 'reputational': return Users;
            default: return Scale;
        }
    };

    const getRiskTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'financial': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            case 'legal': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
            case 'operational': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
            case 'reputational': return 'text-pink-400 bg-pink-500/10 border-pink-500/30';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
        }
    };

    const getRecommendationStyles = (rec: string) => {
        switch (rec?.toLowerCase()) {
            case 'approve': return {
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/20',
                border: 'border-emerald-500/40',
                icon: CheckCircle,
                label: 'Approve'
            };
            case 'reject': return {
                color: 'text-rose-400',
                bg: 'bg-rose-500/20',
                border: 'border-rose-500/40',
                icon: XCircle,
                label: 'Reject'
            };
            default: return {
                color: 'text-amber-400',
                bg: 'bg-amber-500/20',
                border: 'border-amber-500/40',
                icon: AlertOctagon,
                label: 'Negotiate'
            };
        }
    };

    const isAnalyzing = analysis ? (analysis.status === 'analyzing' || analysis.status === 'pending') : false;

    if (isLoading || isAnalyzing) {
        return (
            <div className="min-h-screen bg-[#0a0c10] pt-16">
                <div className="max-w-4xl mx-auto px-8 py-12">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="relative">
                                <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-indigo-500" />
                                </div>
                            </div>
                            <h1 className="text-xl font-semibold text-white">Analyzing Contract</h1>
                        </div>
                        <p className="text-sm text-slate-500">
                            {analysis?.contractFileName || 'Processing your document...'}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <AnalysisGauges
                            completedNodes={(analysis?.agentLogs || []).filter(l => l.action === 'completed').map(l => l.node)}
                            activeNode={(analysis?.agentLogs || []).find(l => l.action === 'extracting' || l.action === 'analyzing' || l.action === 'generating' || l.action === 'reasoning')?.node || 'extract_clauses'}
                        />
                        <AgentVisualizer logs={analysis?.agentLogs || []} isAnalyzing={true} />
                    </div>
                </div>
            </div>
        );
    }

    if (!analysis) return null;

    const riskScore = analysis.overallRiskScore || analysis.overall_risk_score || 0;
    const executiveSummary = analysis.aiSummary || analysis.executive_summary || '';
    const recommendation = analysis.recommendation || 'negotiate';
    const recStyles = getRecommendationStyles(recommendation);
    const RecIcon = recStyles.icon;
    const riskBreakdown = analysis.riskBreakdown || { financial: 0, legal: 0, operational: 0, reputational: 0 };
    const actionItems = analysis.actionItems || { mustFix: [], shouldNegotiate: [], niceToHave: [] };
    const topIssues = analysis.topCriticalIssues || [];

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-300 font-sans selection:bg-indigo-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-screen flex flex-col pt-16 bg-[#0a0c10] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-4 border-b border-white/5 bg-black/40 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.back()}
                            className="p-2 text-indigo-400/60 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                                <span className="text-white">Contract Analysis</span>
                                <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500 font-mono">
                                    {analysis.contractFileName}
                                </Badge>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className={`bg-white/5 border-white/10 hover:bg-white/10 rounded-xl gap-2 h-10 px-4 text-xs shadow-2xl transition-all ${showVisualizer ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'text-slate-400'}`}
                            onClick={() => setShowVisualizer(!showVisualizer)}
                        >
                            <BrainCircuit className="w-4 h-4" /> {showVisualizer ? 'Hide Thoughts' : 'Agent Thoughts'}
                        </Button>
                        <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl gap-2 h-10 px-4 text-xs shadow-2xl">
                            <Download className="w-3 h-3" /> Export Report
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] gap-2 h-10 px-6 text-xs"
                            onClick={handleExportToDocuSign}
                            disabled={isExporting}
                        >
                            {isExporting ? <Loader size="xs" /> : <><Share2 className="w-3 h-3" /> Send to DocuSign</>}
                        </Button>
                    </div>
                </div>

                {/* Split View Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Document Viewer */}
                    <div className="w-1/2 h-full border-r border-white/5">
                        <DocumentViewer
                            text={analysis.fullText || ''}
                            activeHighlight={activeHighlight}
                            fileName={analysis.contractFileName}
                            fileUrl={analysis.contractFilePath ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${analysis.contractFilePath.replace(/\\/g, '/')}` : undefined}
                        />
                    </div>

                    {/* Right Panel: Analysis */}
                    <div className="w-1/2 h-full overflow-y-auto custom-scrollbar bg-[#050608]/30">
                        <AnimatePresence>
                            {showVisualizer && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="p-8 border-b border-white/5 bg-[#0a0c10]/50"
                                >
                                    <AgentVisualizer logs={analysis.agentLogs || []} isAnalyzing={false} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-8 space-y-8">
                            {/* Recommendation Banner */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`${recStyles.bg} ${recStyles.border} border p-6 rounded-2xl flex items-center justify-between`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${recStyles.bg}`}>
                                        <RecIcon className={`w-6 h-6 ${recStyles.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Recommendation</p>
                                        <p className={`text-2xl font-black ${recStyles.color}`}>{recStyles.label}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Risk Score</p>
                                    <p className={`text-4xl font-black tabular-nums ${riskScore >= 7 ? 'text-rose-400' : riskScore >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {riskScore}/10
                                    </p>
                                </div>
                            </motion.div>

                            {/* Top Critical Issues */}
                            {topIssues.length > 0 && (
                                <Card className="bg-rose-500/5 border-rose-500/20 p-6 rounded-2xl">
                                    <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wide mb-4">
                                        <AlertOctagon className="w-4 h-4" /> Top Critical Issues
                                    </div>
                                    <div className="space-y-3">
                                        {topIssues.slice(0, 3).map((issue, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-rose-500/10 rounded-xl">
                                                <span className="text-rose-400 font-bold text-sm">{idx + 1}.</span>
                                                <p className="text-sm text-slate-300">{issue}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Risk Breakdown */}
                            <div className="grid grid-cols-4 gap-3">
                                {Object.entries(riskBreakdown).map(([type, count]) => {
                                    const TypeIcon = getRiskTypeIcon(type);
                                    const typeColor = getRiskTypeColor(type);
                                    return (
                                        <Card key={type} className={`${typeColor} border p-4 rounded-xl text-center`}>
                                            <TypeIcon className="w-5 h-5 mx-auto mb-2" />
                                            <p className="text-2xl font-black">{count}</p>
                                            <p className="text-[10px] uppercase tracking-wide opacity-70">{type}</p>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Executive Summary */}
                            {executiveSummary && (
                                <Card className="bg-indigo-500/5 border-indigo-500/20 p-6 rounded-2xl">
                                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wide mb-4">
                                        <Zap className="w-3 h-3" /> Executive Summary
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{executiveSummary}</p>
                                </Card>
                            )}

                            {/* Tabs: Risks / Action Items */}
                            <div className="flex gap-2 border-b border-white/5 pb-2">
                                <button
                                    onClick={() => setActiveTab('risks')}
                                    className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all ${activeTab === 'risks' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Flagged Clauses ({analysis.riskAssessments.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('actions')}
                                    className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all ${activeTab === 'actions' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Action Items
                                </button>
                            </div>

                            {/* Action Items Tab */}
                            {activeTab === 'actions' && (
                                <div className="space-y-6">
                                    {/* Must Fix */}
                                    {actionItems.mustFix?.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wide mb-3">
                                                <XCircle className="w-4 h-4" /> Must Fix Before Signing ({actionItems.mustFix.length})
                                            </div>
                                            <div className="space-y-2">
                                                {actionItems.mustFix.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                                        <CheckSquare className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-slate-300">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Should Negotiate */}
                                    {actionItems.shouldNegotiate?.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wide mb-3">
                                                <AlertTriangle className="w-4 h-4" /> Should Negotiate ({actionItems.shouldNegotiate.length})
                                            </div>
                                            <div className="space-y-2">
                                                {actionItems.shouldNegotiate.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                        <CheckSquare className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-slate-300">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Nice to Have */}
                                    {actionItems.niceToHave?.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wide mb-3">
                                                <CheckCircle className="w-4 h-4" /> Nice to Have ({actionItems.niceToHave.length})
                                            </div>
                                            <div className="space-y-2">
                                                {actionItems.niceToHave.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                        <CheckSquare className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-slate-300">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Risks Tab */}
                            {activeTab === 'risks' && (
                                <div className="space-y-6">
                                    {analysis.riskAssessments.map((risk, idx) => {
                                        const styles = getRiskStyles(risk.riskLevel || risk.risk_level || 'medium');
                                        const isExpanded = expandedCards.includes(idx);
                                        const isActive = activeHighlight === (risk.clauseText || risk.clause_text);
                                        const Icon = styles.icon;
                                        const riskType = risk.riskType || risk.risk_type || 'legal';
                                        const TypeIcon = getRiskTypeIcon(riskType);
                                        const typeColor = getRiskTypeColor(riskType);

                                        const clauseText = risk.clauseText || risk.clause_text || '';
                                        const riskExplanation = risk.riskExplanation || risk.risk_explanation || '';
                                        const legalReasoning = risk.legalReasoning || risk.legal_reasoning || '';
                                        const standardAlt = risk.standardAlternative || risk.standard_alternative || '';
                                        const worstCase = risk.worstCaseScenario || risk.worst_case_scenario || '';
                                        const financialExposure = risk.financialExposure || risk.financial_exposure || '';
                                        const realWorldExample = risk.realWorldExample || risk.real_world_example || '';

                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + (idx * 0.05) }}
                                                className="group"
                                                onMouseEnter={() => setActiveHighlight(clauseText)}
                                                onMouseLeave={() => !isExpanded && setActiveHighlight(undefined)}
                                            >
                                                <div className={`relative bg-[#13171f] rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden ${isActive ? 'ring-2 ring-indigo-500/40' : ''}`}>
                                                    <div
                                                        className="p-6 cursor-pointer"
                                                        onClick={() => {
                                                            toggleCard(idx);
                                                            setActiveHighlight(clauseText);
                                                        }}
                                                    >
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="space-y-3 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${styles.bg} ${styles.color} ${styles.border}`}>
                                                                        {(risk.riskLevel || risk.risk_level || 'medium').toUpperCase()}
                                                                    </div>
                                                                    <div className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase border flex items-center gap-1 ${typeColor}`}>
                                                                        <TypeIcon className="w-3 h-3" />
                                                                        {riskType}
                                                                    </div>
                                                                    {financialExposure && financialExposure !== 'None' && (
                                                                        <div className="px-3 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                                            <DollarSign className="w-3 h-3" />
                                                                            {financialExposure}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <p className="text-sm text-white/90 leading-relaxed line-clamp-2">
                                                                    {clauseText ? `"${clauseText.substring(0, 150)}${clauseText.length > 150 ? '...' : ''}"` : 'No clause text detected'}
                                                                </p>

                                                                <p className="text-xs text-slate-500 line-clamp-1">{riskExplanation.substring(0, 100)}...</p>
                                                            </div>
                                                            <div className={`p-3 rounded-xl ${styles.bg} ${styles.color}`}>
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex items-center justify-between">
                                                            <span className="text-[10px] text-slate-600">Clause #{idx + 1}</span>
                                                            <button className="flex items-center gap-1 text-indigo-400 hover:text-white transition-all font-semibold text-[10px] uppercase tracking-wider">
                                                                {isExpanded ? 'Show Less' : 'View Details'}
                                                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="bg-[#0e1117] border-t border-white/5"
                                                            >
                                                                <div className="p-6 space-y-6">
                                                                    {/* Full Clause */}
                                                                    <div className="p-4 bg-[#13171f] rounded-xl border border-white/5">
                                                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Full Clause</p>
                                                                        <p className="text-sm text-white/80 italic">"{clauseText}"</p>
                                                                    </div>

                                                                    <div className="grid md:grid-cols-2 gap-4">
                                                                        {/* Risk Analysis */}
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wide">
                                                                                <Zap className="w-3 h-3" /> Risk Analysis
                                                                            </div>
                                                                            <div className="bg-[#13171f] p-4 rounded-xl border border-white/5">
                                                                                <p className="text-sm text-slate-400">{riskExplanation}</p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Legal Context */}
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wide">
                                                                                <Gavel className="w-3 h-3" /> Legal Context
                                                                            </div>
                                                                            <div className="bg-[#13171f] p-4 rounded-xl border border-white/5">
                                                                                <p className="text-sm text-slate-400 whitespace-pre-wrap">{legalReasoning || 'Standard legal frameworks apply.'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Worst Case & Example Row */}
                                                                    {(worstCase || realWorldExample) && (
                                                                        <div className="grid md:grid-cols-2 gap-4">
                                                                            {worstCase && (
                                                                                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                                                                                    <p className="text-xs text-rose-400 uppercase tracking-wide mb-2 font-semibold">Worst Case Scenario</p>
                                                                                    <p className="text-sm text-slate-400">{worstCase}</p>
                                                                                </div>
                                                                            )}
                                                                            {realWorldExample && (
                                                                                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                                                                    <p className="text-xs text-amber-400 uppercase tracking-wide mb-2 font-semibold">Real World Example</p>
                                                                                    <p className="text-sm text-slate-400">{realWorldExample}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Alternative */}
                                                                    {standardAlt && (
                                                                        <div className="relative">
                                                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-10" />
                                                                            <div className="relative bg-[#13171f] border border-emerald-500/20 p-6 rounded-2xl">
                                                                                <div className="flex items-center justify-between mb-4">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                                                                                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <h4 className="text-emerald-400 font-bold text-xs uppercase">Suggested Alternative</h4>
                                                                                            <p className="text-[10px] text-slate-500">Industry standard wording</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        disabled={isRedlining === `cl-${idx}`}
                                                                                        className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl font-bold gap-2"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleApplyAlternative(clauseText, standardAlt, idx);
                                                                                        }}
                                                                                    >
                                                                                        {isRedlining === `cl-${idx}` ? (
                                                                                            <>
                                                                                                <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                                                                Processing...
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <MousePointer2 className="w-3 h-3" />
                                                                                                Apply
                                                                                            </>
                                                                                        )}
                                                                                    </Button>
                                                                                </div>
                                                                                <div className="bg-[#0a0c10] p-4 rounded-xl border border-white/5 text-sm text-white/80 italic">
                                                                                    "{standardAlt}"
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Comments */}
                                                                    <CommentThread
                                                                        analysisId={analysis._id}
                                                                        clauseIdx={idx}
                                                                        comments={risk.comments || []}
                                                                        onCommentAdded={(newComment) => {
                                                                            const updatedAnalysis = { ...analysis };
                                                                            if (!updatedAnalysis.riskAssessments[idx].comments) {
                                                                                updatedAnalysis.riskAssessments[idx].comments = [];
                                                                            }
                                                                            updatedAnalysis.riskAssessments[idx].comments!.push(newComment);
                                                                            setAnalysis(updatedAnalysis);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            {analysis.riskAssessments.length === 0 && (
                                <div className="flex flex-col items-center justify-center p-12 bg-[#13171f] rounded-2xl border border-white/5 space-y-4">
                                    <ShieldCheck className="w-16 h-16 text-emerald-500 opacity-40" />
                                    <h3 className="text-lg font-bold text-white text-center">No Issues Found</h3>
                                    <p className="text-slate-500 text-center text-sm">This contract appears to be low risk.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
