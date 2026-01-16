'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    ShieldAlert,
    Sparkles,
    Gavel,
    Calculator,
    FileCheck,
    CheckCircle
} from 'lucide-react';

interface AnalysisStep {
    id: string;
    label: string;
    icon: any;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
    { id: 'extract_clauses', label: 'Extract', icon: FileText },
    { id: 'analyze_risks', label: 'Analyze', icon: ShieldAlert },
    { id: 'generate_alternatives', label: 'Alternatives', icon: Sparkles },
    { id: 'apply_legal_reasoning', label: 'Reasoning', icon: Gavel },
    { id: 'calculate_risk_score', label: 'Score', icon: Calculator },
    { id: 'generate_summary', label: 'Summary', icon: FileCheck },
];

interface AnalysisGaugesProps {
    completedNodes: string[];
    activeNode?: string;
    overallScore?: number;
}

export default function AnalysisGauges({ completedNodes, activeNode, overallScore }: AnalysisGaugesProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        if (overallScore !== undefined) {
            const duration = 1500;
            const startTime = Date.now();
            const startValue = animatedScore;
            const endValue = overallScore;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setAnimatedScore(startValue + (endValue - startValue) * eased);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }
    }, [overallScore]);

    const completedCount = ANALYSIS_STEPS.filter(s => completedNodes.includes(s.id)).length;
    const overallProgress = (completedCount / ANALYSIS_STEPS.length) * 100;

    return (
        <div className="w-full bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-white">Analysis Progress</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{completedCount} of {ANALYSIS_STEPS.length} steps complete</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <span className="text-2xl font-bold text-white tabular-nums">{Math.round(overallProgress)}%</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-8">
                <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>

            {/* Horizontal Stepper */}
            <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-8 right-8 h-[2px] bg-white/[0.06]" />
                <motion.div
                    className="absolute top-5 left-8 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `calc(${Math.max(0, (completedCount - 1) / (ANALYSIS_STEPS.length - 1)) * 100}% - 16px)` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />

                {ANALYSIS_STEPS.map((step, idx) => {
                    const isComplete = completedNodes.includes(step.id);
                    const isActive = activeNode === step.id;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="relative flex flex-col items-center z-10">
                            {/* Step Circle */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center
                                    transition-all duration-300
                                    ${isComplete
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : isActive
                                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-lg shadow-indigo-500/20'
                                            : 'bg-white/[0.04] text-slate-600 border border-white/[0.06]'
                                    }
                                `}
                            >
                                {isComplete ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                                )}
                            </motion.div>

                            {/* Active Glow */}
                            {isActive && (
                                <motion.div
                                    className="absolute top-0 w-10 h-10 bg-indigo-500/30 rounded-xl blur-md"
                                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}

                            {/* Label */}
                            <span className={`
                                mt-3 text-[10px] font-medium tracking-wide
                                ${isComplete ? 'text-emerald-400' : isActive ? 'text-white' : 'text-slate-600'}
                            `}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Risk Score Display (when complete) */}
            {overallScore !== undefined && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-center"
                >
                    <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                <circle
                                    cx="40" cy="40" r="32"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    className="text-white/[0.06]"
                                />
                                <motion.circle
                                    cx="40" cy="40" r="32"
                                    fill="none"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    stroke={animatedScore >= 7 ? '#ef4444' : animatedScore >= 4 ? '#eab308' : '#22c55e'}
                                    strokeDasharray={201}
                                    initial={{ strokeDashoffset: 201 }}
                                    animate={{ strokeDashoffset: 201 - (201 * animatedScore / 10) }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white">{animatedScore.toFixed(1)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-400">Risk Score</p>
                            <p className={`text-sm font-semibold ${animatedScore >= 7 ? 'text-red-400' : animatedScore >= 4 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                {animatedScore >= 7 ? 'High Risk' : animatedScore >= 4 ? 'Medium Risk' : 'Low Risk'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
