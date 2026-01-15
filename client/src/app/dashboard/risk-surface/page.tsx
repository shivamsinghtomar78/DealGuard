'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, AlertTriangle, ShieldCheck, Zap, Activity, Info, ArrowRight } from 'lucide-react';
import { contractAPI } from '@/lib/api';
import RiskHeatmap3D from '@/components/RiskHeatmap3D';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import Link from 'next/link';

interface RiskNode {
    id: string;
    name: string;
    riskScore: number;
    color: string;
}

export default function RiskSurfacePage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredNode, setHoveredNode] = useState<RiskNode | null>(null);

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const response = await contractAPI.getMyContracts();
                setContracts(response.data.data);
            } catch (error) {
                console.error('Failed to fetch contracts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchContracts();
    }, []);

    const stats = {
        total: contracts.length,
        highRisk: contracts.filter(c => c.overallRiskScore >= 7).length,
        avgRisk: contracts.length > 0
            ? (contracts.reduce((acc, c) => acc + c.overallRiskScore, 0) / contracts.length).toFixed(1)
            : 0,
        mitigated: contracts.filter(c => c.status === 'completed').length
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                <Loader size="lg" className="text-indigo-500" />
                <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">
                    Mapping Neural Risk Surface...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Globe className="w-3 h-3" />
                        Spatial Risk Analysis
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white">Repository Risk Surface</h1>
                    <p className="text-slate-400 font-medium">Visualizing the semantic vulnerability cloud across your contract ecosystem.</p>
                </div>

                <div className="flex gap-4">
                    <div className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Avg Risk Index</p>
                        <p className="text-2xl font-black text-white">{stats.avgRisk}</p>
                    </div>
                    <div className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Exposure Points</p>
                        <p className="text-2xl font-black text-red-500">{stats.highRisk}</p>
                    </div>
                </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="grid lg:grid-cols-4 gap-8">
                <Card variant="glass" className="lg:col-span-3 h-[650px] relative overflow-hidden bg-black/40 border-white/5 p-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                    <RiskHeatmap3D
                        contracts={contracts}
                        onNodeHover={(node: any) => setHoveredNode(node)}
                    />

                    {/* Cursor Reveal UI */}
                    <AnimatePresence>
                        {hoveredNode && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="absolute top-6 right-6 w-72 p-6 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="p-2 bg-white/5 rounded-lg">
                                            <Activity className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <Badge variant={hoveredNode.riskScore >= 7 ? 'danger' : hoveredNode.riskScore >= 4 ? 'warning' : 'success'} className="px-2 py-0.5">
                                            Score: {hoveredNode.riskScore}
                                        </Badge>
                                    </div>

                                    <div>
                                        <h3 className="text-white font-bold leading-tight line-clamp-2">{hoveredNode.name}</h3>
                                        <p className="text-slate-500 text-xs mt-1 font-medium italic">Semantic Cluster: Liability</p>
                                    </div>

                                    <Link
                                        href={`/dashboard/analysis/${hoveredNode.id}`}
                                        className="flex items-center justify-between w-full p-3 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-xl text-indigo-400 text-xs font-bold transition-all group"
                                    >
                                        View Deep Scan
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Overlay Tip */}
                    <div className="absolute top-6 left-6 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <Info className="w-3 h-3" />
                        Interact with nodes to view metadata
                    </div>
                </Card>

                {/* Sidebar Metrics */}
                <div className="space-y-6">
                    <Card className="bg-white/[0.02] border-white/5 p-6 space-y-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-400" />
                            Risk Distribution
                        </h3>

                        <div className="space-y-4">
                            {[
                                { label: 'High Exposure', count: stats.highRisk, color: 'bg-red-500', icon: AlertTriangle },
                                { label: 'Moderate Risk', count: contracts.filter(c => c.overallRiskScore >= 4 && c.overallRiskScore < 7).length, color: 'bg-amber-500', icon: Activity },
                                { label: 'Secured/Low', count: contracts.filter(c => c.overallRiskScore < 4).length, color: 'bg-emerald-500', icon: ShieldCheck },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-md ${item.color}/10`}>
                                            <item.icon className={`w-3.5 h-3.5 ${item.color.replace('bg-', 'text-')}`} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-black text-white">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="bg-indigo-600/10 border-indigo-500/20 p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                            <ShieldCheck className="w-16 h-16 text-indigo-400" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <h3 className="text-white font-bold tracking-tight">System Integrity</h3>
                            <p className="text-indigo-300 text-xs font-medium leading-relaxed">
                                AI has successfully de-risked <span className="text-white font-black">{stats.mitigated}</span> contracts in the current session.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
