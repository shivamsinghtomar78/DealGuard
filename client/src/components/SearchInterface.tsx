'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaRobot, FaFileContract, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { searchAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface SearchResult {
    text: string;
    metadata: {
        contract_name: string;
        category: string;
        analysis_id: string;
    };
    score: number;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
}

export default function SearchInterface() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [activeTab, setActiveTab] = useState<'search' | 'chat'>('search');

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const response = await searchAPI.semanticSearch(query);
            setResults(response.data.data);
            setActiveTab('search');
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);
        setActiveTab('chat');

        try {
            const response = await searchAPI.chatWithHistory(input);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.data.answer,
                sources: response.data.data.sources
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            toast.error('Failed to get answer');
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full bg-[#0a0c10]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'search' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}
                    >
                        <FaSearch size={14} />
                        <span className="text-sm font-medium">Semantic Search</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'chat' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:text-white'}`}
                    >
                        <FaRobot size={14} />
                        <span className="text-sm font-medium">History Chat</span>
                    </button>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 italic">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>Pinecone Cloud Active</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'search' ? (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-6 h-full flex flex-col"
                        >
                            <form onSubmit={handleSearch} className="relative mb-6">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search across all your contracts (e.g., 'termination clauses in service agreements')"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                                />
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </form>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {results.length === 0 && !isSearching && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <FaFileContract className="text-gray-600" size={32} />
                                        </div>
                                        <h3 className="text-white font-medium mb-2">Instant Semantic Search</h3>
                                        <p className="text-gray-500 text-sm max-w-xs">Ask anything about your entire contract history. We'll find the exact clauses across all documents.</p>
                                    </div>
                                )}

                                {results.map((res, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                                                    {res.metadata.category}
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">{res.metadata.contract_name}</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-gray-600">
                                                Match: {(res.score * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-300 line-clamp-3 group-hover:line-clamp-none transition-all duration-300 italic">
                                            "{res.text}"
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col h-full"
                        >
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
                            >
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                                            <FaRobot className="text-purple-400" size={32} />
                                        </div>
                                        <h3 className="text-white font-medium mb-2">Chat with your History</h3>
                                        <p className="text-gray-500 text-sm max-w-xs">AI-powered insights across all your contracts. Ask questions like "Summarize my liability across all SaaS agreements."</p>
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 border border-white/10 text-gray-200 rounded-tl-none'}`}>
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Citations</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Array.from(new Set(msg.sources.map(s => s.contract_name))).map((source, i) => (
                                                            <span key={i} className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400">
                                                                {source}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/10 border border-white/10 text-gray-200 rounded-2xl rounded-tl-none p-4 flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                            <span className="text-xs text-gray-500">Retrieving sources...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleChat} className="p-4 bg-white/5 border-t border-white/5 relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Message contract history..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-16 text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600 shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isThinking}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    <FaPaperPlane size={14} />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
