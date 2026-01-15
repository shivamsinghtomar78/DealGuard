'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ZoomIn, ZoomOut, Maximize2, Eye, FileCode } from 'lucide-react';

interface DocumentViewerProps {
    text: string;
    activeHighlight?: string;
    fileName: string;
    fileUrl?: string;
}

export default function DocumentViewer({ text, activeHighlight, fileName, fileUrl }: DocumentViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<'text' | 'visual'>('text');

    const renderedContent = useMemo(() => {
        if (!activeHighlight || !text) {
            return text.split('\n').map((line, i) => (
                <p key={i} className="mb-4 leading-relaxed whitespace-pre-wrap">{line}</p>
            ));
        }

        const target = activeHighlight.trim();
        const index = text.indexOf(target);

        if (index === -1) {
            return text.split('\n').map((line, i) => (
                <p key={i} className="mb-4 leading-relaxed whitespace-pre-wrap">{line}</p>
            ));
        }

        const before = text.substring(0, index);
        const match = text.substring(index, index + target.length);
        const after = text.substring(index + target.length);

        return (
            <div className="whitespace-pre-wrap">
                {before}
                <motion.span
                    initial={{ backgroundColor: 'transparent' }}
                    animate={{
                        backgroundColor: 'rgba(99, 102, 241, 0.3)',
                        border: '1px solid rgba(99, 102, 241, 0.5)'
                    }}
                    className="rounded px-1 text-white font-medium inline"
                    id="active-highlight-element"
                >
                    {match}
                </motion.span>
                {after}
            </div>
        );
    }, [text, activeHighlight]);

    useEffect(() => {
        if (activeHighlight && viewMode === 'text') {
            const element = document.getElementById('active-highlight-element');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeHighlight, viewMode]);

    return (
        <div className="flex flex-col h-full bg-[#0d1117]/50 border-r border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg"><FileText className="w-4 h-4 text-indigo-400" /></div>
                    <div>
                        <p className="text-xs font-bold text-white truncate max-w-[150px]">{fileName}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Source Document</p>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setViewMode('text')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <FileCode className="w-3 h-3" /> Text
                    </button>
                    <button
                        onClick={() => setViewMode('visual')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'visual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Eye className="w-3 h-3" /> Visual
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-[#050608]">
                {viewMode === 'text' ? (
                    <div className="h-full overflow-auto p-8 custom-scrollbar">
                        <div
                            ref={containerRef}
                            className="max-w-3xl mx-auto p-12 bg-[#0a0c10] border border-white/5 shadow-2xl rounded-sm min-h-screen text-slate-400 font-serif text-lg leading-[1.8] relative"
                        >
                            <div className="relative z-10">{renderedContent}</div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full w-full bg-[#050608]">
                        {fileUrl ? (
                            <iframe
                                src={`${fileUrl}#toolbar=0`}
                                className="w-full h-full border-none opacity-90 invert grayscale hue-rotate-180 brightness-75 contrast-125"
                                title="Contract Preview"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-600">
                                <FileText className="w-16 h-16 opacity-20" />
                                <p className="text-xs font-black uppercase tracking-widest">Original File Unavailable</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
