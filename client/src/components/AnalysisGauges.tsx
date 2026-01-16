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
    { id: 'generate_alternatives_and_reasoning', label: 'Process', icon: Sparkles },
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
        <div className="w-full bg-[#0d1117] border border-white/10 rounded-2xl p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-white">Analysis Progress</h3>
                    <p className="text-sm text-slate-400 mt-1">{completedCount} of {ANALYSIS_STEPS.length} steps complete</p>
                </div>
                <div className="text-3xl font-bold text-white tabular-nums">{Math.round(overallProgress)}%</div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-10">
                <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>

            {/* Horizontal Stepper - Larger */}
            <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-7 left-10 right-10 h-[3px] bg-white/10" />
                <motion.div
                    className="absolute top-7 left-10 h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `calc(${Math.max(0, (completedCount - 1) / (ANALYSIS_STEPS.length - 1)) * 100}% - 20px)` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />

                {ANALYSIS_STEPS.map((step, idx) => {
                    const isComplete = completedNodes.includes(step.id);
                    const isActive = activeNode === step.id;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="relative flex flex-col items-center z-10">
                            {/* Step Circle - LARGER */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`
                                    w-14 h-14 rounded-xl flex items-center justify-center
                                    transition-all duration-300
                                    ${isComplete
                                        ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40'
                                        : isActive
                                            ? 'bg-indigo-500/20 text-indigo-400 border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/30'
                                            : 'bg-white/5 text-slate-500 border-2 border-white/10'
                                    }
                                `}
                            >
                                {isComplete ? (
                                    <CheckCircle className="w-6 h-6" />
                                ) : (
                                    <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                                )}
                            </motion.div>

                            {/* Active Glow */}
                            {isActive && (
                                <motion.div
                                    className="absolute top-0 w-14 h-14 bg-indigo-500/40 rounded-xl blur-lg"
                                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}

                            {/* Label - LARGER */}
                            <span className={`
                                mt-4 text-sm font-semibold tracking-wide
                                ${isComplete ? 'text-emerald-400' : isActive ? 'text-white' : 'text-slate-500'}
                            `}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Risk Score Display (when complete) - LARGER */}
            {overallScore !== undefined && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 pt-8 border-t border-white/10 flex items-center justify-center"
                >
                    <div className="flex items-center gap-8">
                        <div className="relative w-28 h-28">
                            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 80 80">
                                <circle
                                    cx="40" cy="40" r="32"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    className="text-white/10"
                                />
                                <motion.circle
                                    cx="40" cy="40" r="32"
                                    fill="none"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    stroke={animatedScore >= 7 ? '#ef4444' : animatedScore >= 4 ? '#eab308' : '#22c55e'}
                                    strokeDasharray={201}
                                    initial={{ strokeDashoffset: 201 }}
                                    animate={{ strokeDashoffset: 201 - (201 * animatedScore / 10) }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-white">{animatedScore.toFixed(1)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-base font-medium text-slate-400">Risk Score</p>
                            <p className={`text-xl font-bold ${animatedScore >= 7 ? 'text-red-400' : animatedScore >= 4 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                {animatedScore >= 7 ? 'High Risk' : animatedScore >= 4 ? 'Medium Risk' : 'Low Risk'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
