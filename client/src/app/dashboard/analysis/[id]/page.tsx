'use client';

import { contractAPI } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface RiskAssessment {
    clauseId?: string;
    clauseText: string;
    riskLevel: string;
    riskType?: string;
    riskExplanation: string;
    standardAlternative?: string;
    worstCaseScenario?: string;
    financialExposure?: string;
}

interface Analysis {
    _id: string;
    contractFileName: string;
    overallRiskScore: number;
    riskAssessments: RiskAssessment[];
    aiSummary?: string;
    status: string;
    purchasedAt: string;
    recommendation?: string;
    topCriticalIssues?: string[];
    actionItems?: {
        mustFix?: string[];
        shouldNegotiate?: string[];
        niceToHave?: string[];
    };
}

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedClauses, setExpandedClauses] = useState<number[]>([]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchAnalysis = async () => {
            try {
                if (!params.id) return;
                const response = await contractAPI.getAnalysis(params.id as string);
                const data = response.data.data;
                setAnalysis(data);

                // Keep polling if still analyzing
                if (data && (data.status === 'analyzing' || data.status === 'pending')) {
                    if (!intervalId) {
                        intervalId = setInterval(fetchAnalysis, 3000);
                    }
                } else if (intervalId) {
                    clearInterval(intervalId);
                }
            } catch (error) {
                console.error('Failed to fetch analysis:', error);
                toast.error('Failed to load analysis');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [params.id]);

    const toggleClause = (idx: number) => {
        setExpandedClauses(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const getRiskColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            default: return 'bg-green-500/20 text-green-400 border-green-500/30';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 7) return 'text-red-400';
        if (score >= 4) return 'text-amber-400';
        return 'text-green-400';
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading analysis...</p>
            </div>
        );
    }

    // Analyzing state
    if (analysis && (analysis.status === 'analyzing' || analysis.status === 'pending')) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-8 text-center">
                    <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Analyzing Contract</h2>
                    <p className="text-slate-400 mb-2">{analysis.contractFileName}</p>
                    <p className="text-slate-500 text-sm">This may take 1-3 minutes...</p>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <p className="text-slate-400">Analysis not found</p>
                <Link href="/dashboard" className="text-indigo-400 hover:underline mt-2 inline-block">
                    ← Back to Dashboard
                </Link>
            </div>
        );
    }

    const score = analysis.overallRiskScore || 0;
    const recommendation = analysis.recommendation || (score >= 7 ? 'reject' : score >= 4 ? 'negotiate' : 'approve');

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-white transition">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white">{analysis.contractFileName}</h1>
                    <p className="text-slate-500 text-sm">
                        Analyzed on {new Date(analysis.purchasedAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Score & Recommendation */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm mb-1">Risk Score</p>
                        <p className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}/10</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-sm mb-1">Recommendation</p>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold
                            ${recommendation === 'approve' ? 'bg-green-500/20 text-green-400' :
                                recommendation === 'reject' ? 'bg-red-500/20 text-red-400' :
                                    'bg-amber-500/20 text-amber-400'}`}>
                            {recommendation === 'approve' && <CheckCircle className="w-5 h-5" />}
                            {recommendation === 'reject' && <XCircle className="w-5 h-5" />}
                            {recommendation === 'negotiate' && <AlertTriangle className="w-5 h-5" />}
                            <span className="capitalize">{recommendation}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            {analysis.aiSummary && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-3">Executive Summary</h2>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{analysis.aiSummary}</p>
                </div>
            )}

            {/* Top Issues */}
            {analysis.topCriticalIssues && analysis.topCriticalIssues.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-red-400 mb-3">Critical Issues</h2>
                    <ul className="space-y-2">
                        {analysis.topCriticalIssues.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-300">
                                <span className="text-red-400 font-bold">{idx + 1}.</span>
                                {issue}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Items */}
            {analysis.actionItems && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Action Items</h2>

                    {analysis.actionItems.mustFix && analysis.actionItems.mustFix.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-red-400 font-medium mb-2">Must Fix ({analysis.actionItems.mustFix.length})</h3>
                            <ul className="space-y-1">
                                {analysis.actionItems.mustFix.map((item, idx) => (
                                    <li key={idx} className="text-slate-300 text-sm pl-4 border-l-2 border-red-500/50">{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {analysis.actionItems.shouldNegotiate && analysis.actionItems.shouldNegotiate.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-amber-400 font-medium mb-2">Should Negotiate ({analysis.actionItems.shouldNegotiate.length})</h3>
                            <ul className="space-y-1">
                                {analysis.actionItems.shouldNegotiate.map((item, idx) => (
                                    <li key={idx} className="text-slate-300 text-sm pl-4 border-l-2 border-amber-500/50">{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {analysis.actionItems.niceToHave && analysis.actionItems.niceToHave.length > 0 && (
                        <div>
                            <h3 className="text-green-400 font-medium mb-2">Nice to Have ({analysis.actionItems.niceToHave.length})</h3>
                            <ul className="space-y-1">
                                {analysis.actionItems.niceToHave.map((item, idx) => (
                                    <li key={idx} className="text-slate-300 text-sm pl-4 border-l-2 border-green-500/50">{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Flagged Clauses */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Flagged Clauses ({analysis.riskAssessments.length})
                </h2>

                {analysis.riskAssessments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500/50" />
                        No risky clauses found
                    </div>
                ) : (
                    <div className="space-y-3">
                        {analysis.riskAssessments.map((risk, idx) => {
                            const isExpanded = expandedClauses.includes(idx);
                            const clauseText = risk.clauseText || '';

                            return (
                                <div key={idx} className="border border-slate-700 rounded-lg overflow-hidden">
                                    <div
                                        className="p-4 cursor-pointer hover:bg-slate-800/50 transition"
                                        onClick={() => toggleClause(idx)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getRiskColor(risk.riskLevel)}`}>
                                                        {risk.riskLevel?.toUpperCase()}
                                                    </span>
                                                    {risk.riskType && (
                                                        <span className="text-slate-500 text-xs">{risk.riskType}</span>
                                                    )}
                                                </div>
                                                <p className="text-slate-300 text-sm line-clamp-2">
                                                    "{clauseText.substring(0, 150)}{clauseText.length > 150 ? '...' : ''}"
                                                </p>
                                            </div>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-slate-700 p-4 bg-slate-900/50 space-y-4">
                                            <div>
                                                <h4 className="text-slate-400 text-xs font-medium mb-1">FULL CLAUSE</h4>
                                                <p className="text-slate-300 text-sm italic">"{clauseText}"</p>
                                            </div>

                                            <div>
                                                <h4 className="text-slate-400 text-xs font-medium mb-1">WHY IT'S RISKY</h4>
                                                <p className="text-slate-300 text-sm">{risk.riskExplanation}</p>
                                            </div>

                                            {risk.worstCaseScenario && (
                                                <div>
                                                    <h4 className="text-red-400 text-xs font-medium mb-1">WORST CASE</h4>
                                                    <p className="text-slate-300 text-sm">{risk.worstCaseScenario}</p>
                                                </div>
                                            )}

                                            {risk.standardAlternative && (
                                                <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                                    <h4 className="text-green-400 text-xs font-medium mb-1">SUGGESTED ALTERNATIVE</h4>
                                                    <p className="text-slate-300 text-sm italic">"{risk.standardAlternative}"</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
