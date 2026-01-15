'use client';

import { contractAPI } from '@/lib/api';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    AlertTriangle,
    CheckCircle,
    Clock,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    SearchX,
    Calendar,
    ShieldAlert
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import Link from 'next/link';
import { toast } from 'sonner';

interface Contract {
    _id: string;
    contractFileName: string;
    status: 'pending' | 'analyzing' | 'completed' | 'expert-review';
    overallRiskScore: number;
    purchasedAt: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const response = await contractAPI.getMyContracts();
                setContracts(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch contracts:', error);
                toast.error('Failed to load your contracts.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContracts();
    }, []);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
            case 'analyzing':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse';
            case 'expert-review':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default:
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'from-red-500 to-orange-500';
        if (score >= 5) return 'from-amber-400 to-orange-400';
        return 'from-emerald-400 to-teal-500';
    };

    const filteredContracts = contracts.filter(c =>
        c.contractFileName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <Loader size="lg" className="text-indigo-500" />
                <p className="text-slate-400 font-medium animate-pulse text-sm tracking-widest uppercase">Loading Repository</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px w-8 bg-indigo-500/50" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold">Document Vault</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        Contract Repository
                    </h1>
                    <p className="text-slate-500 max-w-md">
                        A centralized ledger of your analyzed legal documents with AI-powered risk scoring.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Link href="/dashboard">
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-[0_0_20px_rgba(79,70,229,0.3)] group">
                            <ArrowUpRight className="w-4 h-4 mr-2 group-hover:rotate-45 transition-transform" />
                            Analyze New Contract
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Search and Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group"
            >
                <div className="absolute inset-0 bg-indigo-500/5 blur-xl group-focus-within:bg-indigo-500/10 transition-colors pointer-events-none rounded-full" />
                <div className="relative flex items-center gap-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find a contract by filename..."
                            className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <Button variant="ghost" size="sm" className="hidden sm:flex text-slate-400 hover:text-white hover:bg-white/5 gap-2">
                        <Filter className="w-4 h-4" />
                        Sort by Date
                    </Button>
                </div>
            </motion.div>

            {/* Contracts Grid */}
            <AnimatePresence mode="popLayout">
                {filteredContracts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center py-24 px-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]"
                    >
                        <div className="p-6 rounded-full bg-indigo-500/5 mb-6">
                            <SearchX className="w-12 h-12 text-indigo-500/40" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {searchTerm ? 'No matches found' : 'Your vault is empty'}
                        </h3>
                        <p className="text-slate-500 text-center max-w-xs mb-8">
                            {searchTerm
                                ? `We couldn't find any contracts matching "${searchTerm}". Try refining your search.`
                                : "You haven't analyzed any contracts yet. Get started by uploading your first document."}
                        </p>
                        {!searchTerm && (
                            <Link href="/dashboard">
                                <Button variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
                                    Go to Upload
                                </Button>
                            </Link>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid gap-4"
                    >
                        {filteredContracts.map((contract) => (
                            <motion.div
                                key={contract._id}
                                variants={itemVariants}
                                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                className="group"
                            >
                                <Link href={`/dashboard/analysis/${contract._id}`}>
                                    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm p-5 transition-all hover:border-indigo-500/30 hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(79,70,229,0.05)]">
                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/[0.02] group-hover:to-purple-500/[0.02] transition-all" />

                                        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                            {/* File Info */}
                                            <div className="flex items-center gap-5 flex-1 min-w-0 w-full">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-indigo-500 blur-md opacity-0 group-hover:opacity-20 transition-opacity" />
                                                    <div className="relative p-4 rounded-xl bg-slate-900 border border-white/5 text-indigo-400 group-hover:text-indigo-300 group-hover:scale-105 transition-all">
                                                        <FileText className="w-7 h-7" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-lg text-white mb-1.5 truncate group-hover:text-indigo-100 transition-colors">
                                                        {contract.contractFileName}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(contract.purchasedAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                        <div className="h-1 w-1 rounded-full bg-slate-700 hidden sm:block" />
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {new Date(contract.purchasedAt).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status and Score */}
                                            <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                                                <div className="flex items-center gap-6">
                                                    <Badge className={`${getStatusStyles(contract.status)} border px-3 py-1 text-[10px] font-bold uppercase tracking-wider`}>
                                                        {contract.status.replace('-', ' ')}
                                                    </Badge>

                                                    {contract.status === 'completed' && (
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Risk Level</span>
                                                                <ShieldAlert className={`w-3 h-3 ${contract.overallRiskScore >= 7 ? 'text-red-500' : 'text-emerald-500'}`} />
                                                            </div>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className={`text-2xl font-black bg-gradient-to-br ${getScoreColor(contract.overallRiskScore)} bg-clip-text text-transparent`}>
                                                                    {contract.overallRiskScore}
                                                                </span>
                                                                <span className="text-xs text-slate-600 font-bold">/10</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2 rounded-full border border-white/5 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-all">
                                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
