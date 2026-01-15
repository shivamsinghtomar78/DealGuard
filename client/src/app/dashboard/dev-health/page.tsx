'use client';

import React from 'react';
import DevHealthDashboard from '@/components/DevHealthDashboard';
import { motion } from 'framer-motion';
import { ShieldCheck, Server, LineChart } from 'lucide-react';

export default function DevHealthPage() {
    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">System Integrity Level 01</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500">
                        Dev Health Center
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                        Continuous monitoring of DealGuard's distributed infrastructure. This dashboard
                        consolidates telemetry from Sentry, LangSmith, and internal health probes.
                    </p>
                </motion.div>

                {/* Decorative background glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4 text-indigo-400">
                        <Server size={20} />
                        <h3 className="font-bold">Infrastructure</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Node.js Runtime</span>
                            <span className="text-slate-300 font-mono">v18.0.0+</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">FastAPI Engine</span>
                            <span className="text-slate-300 font-mono">v0.100+</span>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4 text-emerald-400">
                        <LineChart size={20} />
                        <h3 className="font-bold">AI Observability</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Tracing Pool</span>
                            <span className="text-slate-300 font-mono">LangSmith V2</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Error Capture</span>
                            <span className="text-slate-300 font-mono">Sentry SDK</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Health Dashboard */}
            <DevHealthDashboard />
        </div>
    );
}
