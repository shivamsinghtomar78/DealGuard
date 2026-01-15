'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface Comment {
    _id?: string;
    userId: string;
    userName: string;
    content: string;
    mentions?: string[];
    timestamp: Date;
}

interface CommentThreadProps {
    analysisId: string;
    clauseIdx: number;
    comments: Comment[];
    onCommentAdded: (newComment: Comment) => void;
}

export default function CommentThread({ analysisId, clauseIdx, comments, onCommentAdded }: CommentThreadProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setIsSubmitting(true);

        // Extract @mentions
        const mentionRegex = /@(\w+)/g;
        const mentions: string[] = [];
        let match;
        while ((match = mentionRegex.exec(newComment)) !== null) {
            mentions.push(match[1]);
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/contracts/analysis/${analysisId}/risk/${clauseIdx}/comment`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ content: newComment, mentions })
                }
            );

            if (response.ok) {
                const data = await response.json();
                onCommentAdded(data.data);
                setNewComment('');
            }
        } catch (error) {
            console.error('Failed to post comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Highlight @mentions in content
    const renderContent = (content: string) => {
        return content.split(/(@\w+)/g).map((part, i) => {
            if (part.startsWith('@')) {
                return (
                    <span key={i} className="text-indigo-400 font-semibold hover:underline cursor-pointer">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="mt-4 border-t border-white/5 pt-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors group"
            >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="font-bold uppercase tracking-widest">
                    {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                </span>
                <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    className="ml-1 text-[8px]"
                >
                    ▼
                </motion.span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                            {comments.map((comment, i) => (
                                <div
                                    key={comment._id || i}
                                    className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-white">{comment.userName}</span>
                                            <span className="text-[9px] text-slate-600">
                                                {new Date(comment.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            {renderContent(comment.content)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-xs text-slate-600 text-center py-4">No comments yet. Be the first!</p>
                            )}
                        </div>

                        {/* New Comment Input */}
                        <div className="mt-4 flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                placeholder="Add a comment... (use @mention)"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                            />
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !newComment.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 h-10 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
