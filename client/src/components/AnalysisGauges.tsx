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
    color: string;
    glowColor: string;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
    { id: 'extract_clauses', label: 'Clause Extraction', icon: FileText, color: 'text-blue-400', glowColor: 'shadow-blue-500/50' },
    { id: 'analyze_risks', label: 'Risk Analysis', icon: ShieldAlert, color: 'text-amber-400', glowColor: 'shadow-amber-500/50' },
    { id: 'generate_alternatives', label: 'Alternative Synthesis', icon: Sparkles, color: 'text-purple-400', glowColor: 'shadow-purple-500/50' },
    { id: 'legal_reasoning', label: 'Legal Reasoning', icon: Gavel, color: 'text-indigo-400', glowColor: 'shadow-indigo-500/50' },
    { id: 'calculate_risk_score', label: 'Score Calculation', icon: Calculator, color: 'text-cyan-400', glowColor: 'shadow-cyan-500/50' },
    { id: 'generate_summary', label: 'Summary Generation', icon: FileCheck, color: 'text-emerald-400', glowColor: 'shadow-emerald-500/50' },
];

interface AnalysisGaugesProps {
    completedNodes: string[];
    activeNode?: string;
    overallScore?: number;
}

export default function AnalysisGauges({ completedNodes, activeNode, overallScore }: AnalysisGaugesProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    // Animate the overall score dial
    useEffect(() => {
        if (overallScore !== undefined) {
            const duration = 1500;
            const startTime = Date.now();
            const startValue = animatedScore;
            const endValue = overallScore;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
                setAnimatedScore(startValue + (endValue - startValue) * eased);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }
    }, [overallScore]);

    const getStepProgress = (stepId: string) => {
        if (completedNodes.includes(stepId)) return 100;
        if (activeNode === stepId) return 50;
        return 0;
    };

    const completedCount = ANALYSIS_STEPS.filter(s => completedNodes.includes(s.id)).length;
    const overallProgress = (completedCount / ANALYSIS_STEPS.length) * 100;

    return (
        <div className="w-full bg-[#0a0c10] border border-white/5 rounded-[2rem] p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Analysis Progression</h3>
                    <p className="text-xs text-slate-600 mt-1">6-Layer Neural Assessment</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-white">{completedCount}</span>
                    <span className="text-sm text-slate-600 font-bold"> / 6</span>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest">Layers Complete</p>
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            </div>

            {/* Step Gauges Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ANALYSIS_STEPS.map((step, idx) => {
                    const progress = getStepProgress(step.id);
                    const isActive = activeNode === step.id;
                    const isComplete = completedNodes.includes(step.id);
                    const Icon = step.icon;

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative p-4 rounded-2xl border transition-all duration-500 ${isComplete
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : isActive
                                        ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg ' + step.glowColor
                                        : 'bg-white/[0.02] border-white/5'
                                }`}
                        >
                            {/* Circular Gauge */}
                            <div className="flex items-center gap-4">
                                <div className="relative w-12 h-12">
                                    {/* Background Circle */}
                                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                        <circle
                                            cx="18" cy="18" r="15"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            className="text-white/5"
                                        />
                                        {/* Progress Circle */}
                                        <motion.circle
                                            cx="18" cy="18" r="15"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            className={isComplete ? 'text-emerald-400' : step.color}
                                            strokeDasharray={94.2}
                                            initial={{ strokeDashoffset: 94.2 }}
                                            animate={{ strokeDashoffset: 94.2 - (94.2 * progress / 100) }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                        />
                                    </svg>
                                    {/* Center Icon */}
                                    <div className={`absolute inset-0 flex items-center justify-center ${isComplete ? 'text-emerald-400' : isActive ? step.color : 'text-slate-600'}`}>
                                        {isComplete ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-[10px] font-black uppercase tracking-wider truncate ${isComplete ? 'text-emerald-400' : isActive ? 'text-white' : 'text-slate-500'
                                        }`}>
                                        {step.label}
                                    </p>
                                    <p className="text-[9px] text-slate-600 mt-0.5">
                                        {isComplete ? 'Complete' : isActive ? 'Processing...' : 'Pending'}
                                    </p>
                                </div>
                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <motion.div
                                    className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 -z-10"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Risk Score Dial (only shown when complete) */}
            {overallScore !== undefined && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center pt-6 border-t border-white/5"
                >
                    <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-white/5"
                            />
                            <motion.circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                strokeWidth="8"
                                strokeLinecap="round"
                                stroke={`url(#scoreGradient)`}
                                strokeDasharray={251.2}
                                initial={{ strokeDashoffset: 251.2 }}
                                animate={{ strokeDashoffset: 251.2 - (251.2 * animatedScore / 10) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#22c55e" />
                                    <stop offset="50%" stopColor="#eab308" />
                                    <stop offset="100%" stopColor="#ef4444" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{animatedScore.toFixed(1)}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Risk Score</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
