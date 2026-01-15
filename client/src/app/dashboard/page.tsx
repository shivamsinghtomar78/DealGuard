'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileUp,
    ShieldCheck,
    Zap,
    Cpu,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { contractAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { toast } from 'sonner';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function DashboardPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
        },
        maxSize: 50 * 1024 * 1024, // 50MB
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file) return;

        try {
            setIsUploading(true);
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 5, 95));
            }, 800);

            const formData = new FormData();
            formData.append('contract', file);
            formData.append('category', 'other');

            const response = await contractAPI.uploadAndAnalyze(formData);

            clearInterval(progressInterval);
            setUploadProgress(100);
            toast.success('AI Analysis sequence complete.');

            setTimeout(() => {
                router.push(`/dashboard/analysis/${response.data.data.analysisId}`);
            }, 800);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Analysis interface failure. Please retry.');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto space-y-16 py-12"
        >
            {/* Hero Header */}
            <motion.div variants={fadeInUp} className="text-center space-y-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                    <Zap className="w-3 h-3 fill-current" />
                    Elite Neural Engine V2.1
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent">
                    Secure Legal Intelligence.
                </h1>

                <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                    Upload your contracts for advanced AI-driven risk mitigation,
                    <span className="text-indigo-400"> sub-second </span> clause extraction, and semantic analysis.
                </p>
            </motion.div>

            {/* Main Upload Portal */}
            <motion.div variants={fadeInUp} className="max-w-4xl mx-auto relative group">
                {/* Visual Flair */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

                <Card variant="glass" className="relative p-1 rounded-[2.2rem] overflow-hidden border-white/5 bg-black/40 backdrop-blur-3xl">
                    <div
                        {...getRootProps()}
                        className={`
                            relative border-2 border-dashed rounded-[2rem] p-12 md:p-20 text-center cursor-pointer transition-all duration-500
                            flex flex-col items-center justify-center min-h-[400px]
                            ${isDragActive ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]' : 'border-white/10 hover:border-indigo-500/40 hover:bg-white/[0.02]'}
                            ${file ? 'border-indigo-500/50 bg-indigo-500/[0.02]' : ''}
                        `}
                    >
                        <input {...getInputProps()} />

                        <AnimatePresence mode="wait">
                            {!file ? (
                                <motion.div
                                    key="upload-prompt"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className="space-y-8"
                                >
                                    <div className="relative inline-block">
                                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
                                        <div className="relative p-8 bg-slate-900 border border-white/10 rounded-3xl group-hover:scale-110 group-hover:border-indigo-500/30 transition-all duration-500">
                                            <FileUp className="w-16 h-16 text-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-3xl font-bold text-white">
                                            {isDragActive ? 'Release to Initiate' : 'Drop Contract Here'}
                                        </p>
                                        <p className="text-slate-500 font-medium text-lg">
                                            Deep-scan PDF or DOCX files up to 50MB
                                        </p>
                                    </div>

                                    <div className="flex justify-center gap-3 pt-4">
                                        {['PDF', 'DOCX', 'MAX 50MB'].map((tag) => (
                                            <span key={tag} className="px-3 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="file-ready"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full max-w-xl space-y-10"
                                >
                                    <div className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-6 text-left group/file">
                                        <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                            <FileText className="w-10 h-10 text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xl font-bold text-white truncate">{file.name}</p>
                                            <p className="text-indigo-400/60 font-medium tracking-wide">{(file.size / 1024 / 1024).toFixed(2)} MB • READY FOR SCAN</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                            className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                        >
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {!isUploading ? (
                                        <Button
                                            size="lg"
                                            className="w-full h-16 text-xl font-black rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] group/btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpload();
                                            }}
                                        >
                                            <Cpu className="w-6 h-6 mr-3 group-hover/btn:rotate-180 transition-transform duration-700" />
                                            INITIALIZE ANALYSIS
                                        </Button>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Loader size="sm" className="text-indigo-500" />
                                                    <span className="text-white font-bold tracking-widest uppercase text-xs">Processing Neural Layers...</span>
                                                </div>
                                                <span className="text-indigo-400 font-black text-lg">{uploadProgress}%</span>
                                            </div>
                                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${uploadProgress}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-500 font-bold tracking-tighter uppercase">
                                                <span>Extracting Context</span>
                                                <span>Rating Risks</span>
                                                <span>Generating Reasoning</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>
            </motion.div>

            {/* Enterprise Features */}
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        title: 'Contextual Analysis',
                        description: 'AI understands not just the words, but the legal intent behind every provision.',
                        icon: Sparkles,
                        color: 'text-blue-400'
                    },
                    {
                        title: 'Risk Shield',
                        description: 'Instant identification of high-liability clauses with detailed mitigation roadmaps.',
                        icon: ShieldCheck,
                        color: 'text-indigo-400'
                    },
                    {
                        title: 'Elite Alternatives',
                        description: 'Benchmarked alternative language provided by legal models trained on elite contracts.',
                        icon: Zap,
                        color: 'text-purple-400'
                    },
                ].map((feature, idx) => (
                    <motion.div
                        key={idx}
                        variants={fadeInUp}
                        transition={{ delay: 0.2 + (idx * 0.1) }}
                        className="group"
                    >
                        <Card className="h-full border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 hover:border-indigo-500/30 transition-all duration-300 group-hover:-translate-y-2">
                            <div className={`p-4 rounded-2xl bg-white/[0.03] border border-white/5 w-fit mb-6 group-hover:scale-110 transition-transform`}>
                                <feature.icon className={`w-8 h-8 ${feature.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">
                                {feature.description}
                            </p>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

