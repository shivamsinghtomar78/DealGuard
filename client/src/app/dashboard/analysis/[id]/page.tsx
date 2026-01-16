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
    BrainCircuit
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
    riskExplanation: string;
    standardAlternative?: string;
    legalReasoning?: string;
    // Defensive fallbacks for raw AI data
    clause_id?: string;
    clause_text?: string;
    risk_level?: string;
    risk_explanation?: string;
    standard_alternative?: string;
    legal_reasoning?: string;
    comments?: Comment[];
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

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchAnalysis = async () => {
            try {
                if (!params.id) return;
                const response = await contractAPI.getAnalysis(params.id as string);
                const data = response.data.data;

                // Add defensive mapping logic if database returned stale structure
                if (data && data.riskAssessments) {
                    data.riskAssessments = data.riskAssessments.map((ra: any) => ({
                        ...ra,
                        clauseText: ra.clauseText || ra.clause_text || '',
                        riskLevel: ra.riskLevel || ra.risk_level || 'medium',
                        riskExplanation: ra.riskExplanation || ra.risk_explanation || '',
                        standardAlternative: ra.standardAlternative || ra.standard_alternative || '',
                        legalReasoning: ra.legalReasoning || ra.legal_reasoning || ''
                    }));
                }

                setAnalysis(data);

                // If analysis is still in progress, set up polling
                if (data && (data.status === 'analyzing' || data.status === 'pending')) {
                    if (!intervalId) {
                        intervalId = setInterval(fetchAnalysis, 3000); // Poll every 3 seconds
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

            // Create a download link for the blob
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

            // In a real app, you might want to open this in a new tab
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

    const isAnalyzing = analysis ? (analysis.status === 'analyzing' || analysis.status === 'pending') : false;

    if (isLoading || isAnalyzing) {
        return (
            <div className="min-h-screen bg-[#0a0c10] pt-16">
                <div className="max-w-4xl mx-auto px-8 py-12">
                    {/* Header */}
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

                    {/* Progress Section */}
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

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-300 font-sans selection:bg-indigo-500/30">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-screen flex flex-col pt-16 bg-[#0a0c10] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-hidden"
            >
                {/* Elite Header - Compact for Split View */}
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
                                <span className="text-white">
                                    Contract Analysis
                                </span>
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

                    {/* Right Panel: Discovery Stream */}
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
                            {/* Summary Metrics Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="bg-[#13171f] border-white/5 p-6 rounded-3xl flex items-center justify-between group">
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Risk Score</p>
                                        <p className="text-4xl font-black text-white tracking-tighter tabular-nums">{riskScore}</p>
                                    </div>
                                    <div className="relative w-16 h-16">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle className="text-white/5" strokeWidth="4" stroke="currentColor" fill="transparent" r="28" cx="32" cy="32" />
                                            <circle
                                                className="text-indigo-500" strokeWidth="4" strokeDasharray={176}
                                                strokeDashoffset={176 - (176 * riskScore) / 10} strokeLinecap="round"
                                                stroke="currentColor" fill="transparent" r="28" cx="32" cy="32"
                                            />
                                        </svg>
                                    </div>
                                </Card>
                                <Card className="bg-[#13171f] border-white/5 p-6 rounded-3xl group">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Assessment</p>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase inline-block ${riskScore >= 7 ? 'bg-rose-500/20 text-rose-400' : riskScore >= 4 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        {riskScore >= 7 ? 'High Risk' : riskScore >= 4 ? 'Medium Risk' : 'Low Risk'}
                                    </div>
                                </Card>
                            </div>

                            {/* Executive Summary Mini */}
                            {executiveSummary && (
                                <Card className="bg-indigo-500/5 border-indigo-500/20 p-6 rounded-3xl">
                                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wide mb-4">
                                        <Zap className="w-3 h-3" /> Synthesis
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed italic">{executiveSummary.substring(0, 200)}...</p>
                                </Card>
                            )}

                            {/* Discovery Stream */}
                            <div className="space-y-6">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-3">
                                    Flagged Clauses
                                    <span className="h-[1px] flex-1 bg-white/5" />
                                </h2>

                                {analysis.riskAssessments.map((risk, idx) => {
                                    const styles = getRiskStyles(risk.riskLevel || risk.risk_level || 'medium');
                                    const isExpanded = expandedCards.includes(idx);
                                    const isActive = activeHighlight === (risk.clauseText || risk.clause_text);
                                    const Icon = styles.icon;

                                    const clauseText = risk.clauseText || risk.clause_text || '';
                                    const riskExplanation = risk.riskExplanation || risk.risk_explanation || '';
                                    const legalReasoning = risk.legalReasoning || risk.legal_reasoning || '';
                                    const standardAlt = risk.standardAlternative || risk.standard_alternative || '';

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + (idx * 0.1) }}
                                            className="group"
                                            onMouseEnter={() => setActiveHighlight(clauseText)}
                                            onMouseLeave={() => !isExpanded && setActiveHighlight(undefined)}
                                        >
                                            <div className={`relative bg-[#13171f] rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 overflow-hidden ${styles.glow} ${isActive ? 'ring-2 ring-indigo-500/40 scale-[1.01]' : ''}`}>
                                                <div
                                                    className="p-10 cursor-pointer"
                                                    onClick={() => {
                                                        toggleCard(idx);
                                                        setActiveHighlight(clauseText);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start gap-8">
                                                        <div className="space-y-6 flex-1">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${styles.bg} ${styles.color} ${styles.border}`}>
                                                                    {(risk.riskLevel || risk.risk_level || 'medium').toUpperCase()} RISK
                                                                </div>
                                                                <span className="text-[10px] font-medium text-slate-600">Clause #{idx + 1}</span>
                                                            </div>

                                                            {/* High Fidelity Clause Display */}
                                                            <div className="relative pl-6 border-l-2 border-slate-800 group-hover:border-indigo-500/30 transition-colors">
                                                                <p className="text-2xl font-serif italic text-white/90 leading-relaxed selection:bg-indigo-500/40">
                                                                    {clauseText ? `"${clauseText}"` : <span className="text-slate-700 italic">No clause text detected in primary segment.</span>}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className={`p-5 rounded-2xl ${styles.bg} ${styles.color} shadow-lg transition-transform group-hover:rotate-12`}>
                                                            <Icon className="w-8 h-8" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-8">
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-medium text-slate-600">Identified Issue</span>
                                                                <p className="text-xs text-slate-400">Click to view details and suggested fix</p>
                                                            </div>
                                                        </div>
                                                        <button className="flex items-center gap-2 text-indigo-400 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.2em]">
                                                            {isExpanded ? 'Show Less' : 'View Details'}
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                                                            <div className="p-10 space-y-10">
                                                                <div className="grid md:grid-cols-2 gap-10">
                                                                    {/* Expert Assessment */}
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wide">
                                                                            <Zap className="w-3 h-3" /> Risk Analysis
                                                                        </div>
                                                                        <div className="bg-[#13171f] p-8 rounded-[2rem] border border-white/5 shadow-inner">
                                                                            <p className="text-sm leading-[1.8] text-slate-400 font-medium">
                                                                                {riskExplanation || "Data reconciliation incomplete. Synthesizing risk nodes..."}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Legal reasoning */}
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wide">
                                                                            <Gavel className="w-3 h-3" /> Legal Context
                                                                        </div>
                                                                        <div className="bg-[#13171f] p-8 rounded-[2rem] border border-white/5 shadow-inner">
                                                                            <p className="text-sm leading-[1.8] text-slate-400 font-medium whitespace-pre-wrap italic">
                                                                                {legalReasoning || "Standard legal frameworks apply. Further regulatory verification recommended."}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Premium Alternative Display */}
                                                                {standardAlt && (
                                                                    <motion.div
                                                                        initial={{ y: 20, opacity: 0 }}
                                                                        animate={{ y: 0, opacity: 1 }}
                                                                        className="relative pt-6"
                                                                    >
                                                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-[2.5rem] blur opacity-10" />
                                                                        <div className="relative bg-[#13171f] border border-emerald-500/20 p-10 rounded-[2.5rem] shadow-2xl">
                                                                            <div className="flex items-center justify-between mb-8">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                                                                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wide">Suggested Alternative</h4>
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
                                                                                            Apply Alternative
                                                                                        </>
                                                                                    )}
                                                                                </Button>
                                                                            </div>
                                                                            <div className="bg-[#0a0c10] p-8 rounded-2xl border border-white/5 font-serif text-lg text-white/80 leading-relaxed italic select-all">
                                                                                "{standardAlt}"
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}

                                                                {/* Comment Thread */}
                                                                <CommentThread
                                                                    analysisId={analysis._id}
                                                                    clauseIdx={idx}
                                                                    comments={risk.comments || []}
                                                                    onCommentAdded={(newComment) => {
                                                                        // Update local state
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

                            {analysis.riskAssessments.length === 0 && (
                                <div className="flex flex-col items-center justify-center p-20 bg-[#13171f] rounded-[3rem] border border-white/5 space-y-6">
                                    <ShieldCheck className="w-20 h-20 text-emerald-500 opacity-40" />
                                    <h3 className="text-xl font-bold text-white text-center">No Issues Found</h3>
                                    <p className="text-slate-500 text-center">This contract appears to be low risk.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
