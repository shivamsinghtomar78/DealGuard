'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Clock,
    Eye,
    Calendar,
    Share2,
    BookOpen,
    Tag
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string[];
    author: {
        name: string;
        role: string;
    };
    readTime: number;
    views: number;
    publishedAt: string;
    seoTitle?: string;
    seoDescription?: string;
}

export default function BlogPostPage() {
    const params = useParams();
    const router = useRouter();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${baseUrl}/api/blog/posts/${params.slug}`);
                const data = await res.json();

                if (data.success) {
                    setPost(data.data);
                } else {
                    router.push('/blog');
                }
            } catch (error) {
                console.error('Failed to fetch post:', error);
                router.push('/blog');
            } finally {
                setIsLoading(false);
            }
        };

        if (params.slug) {
            fetchPost();
        }
    }, [params.slug, router]);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center bg-[#0a0c10]">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white">
            {/* Header */}
            <div className="relative py-16 px-8 bg-gradient-to-b from-indigo-900/20 to-transparent">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link href="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-8">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-bold">Back to Blog</span>
                        </Link>

                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wider">
                                {post.category}
                            </span>
                            <span className="text-slate-500 text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4" /> {post.readTime} min read
                            </span>
                            <span className="text-slate-500 text-sm flex items-center gap-2">
                                <Eye className="w-4 h-4" /> {post.views} views
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
                            {post.title}
                        </h1>

                        <p className="text-xl text-slate-400 leading-relaxed mb-8">
                            {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg font-bold">
                                    AI
                                </div>
                                <div>
                                    <p className="font-bold text-white">{post.author.name}</p>
                                    <p className="text-sm text-slate-500">{post.author.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">
                                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 pb-20">
                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="prose prose-invert prose-lg max-w-none 
                        prose-headings:font-black prose-headings:tracking-tight
                        prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl
                        prose-p:text-slate-300 prose-p:leading-relaxed
                        prose-strong:text-white prose-strong:font-bold
                        prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                        prose-ul:text-slate-300 prose-ol:text-slate-300
                        prose-li:marker:text-indigo-500
                        prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/5 prose-blockquote:rounded-r-xl prose-blockquote:py-2
                        prose-code:text-indigo-300 prose-code:bg-indigo-500/10 prose-code:px-2 prose-code:py-0.5 prose-code:rounded
                        prose-pre:bg-[#13171f] prose-pre:border prose-pre:border-white/10"
                >
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </motion.article>

                {/* Tags */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Tag className="w-4 h-4 text-slate-500" />
                        {post.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg text-xs font-medium"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 text-center"
                >
                    <BookOpen className="w-12 h-12 text-white/80 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Ready to Analyze Your Contracts?</h3>
                    <p className="text-indigo-200 mb-6 max-w-md mx-auto">
                        Get AI-powered risk assessment, clause extraction, and alternative suggestions in seconds.
                    </p>
                    <Link href="/dashboard/upload">
                        <button className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors">
                            Start Free Analysis
                        </button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
