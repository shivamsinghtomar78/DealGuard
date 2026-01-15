'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Clock,
    Eye,
    ArrowRight,
    TrendingUp,
    Tag,
    Search
} from 'lucide-react';

interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    tags: string[];
    author: {
        name: string;
        role: string;
    };
    readTime: number;
    views: number;
    publishedAt: string;
}

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

                const [postsRes, featuredRes, categoriesRes] = await Promise.all([
                    fetch(`${baseUrl}/api/blog/posts${selectedCategory ? `?category=${selectedCategory}` : ''}`),
                    fetch(`${baseUrl}/api/blog/posts/featured`),
                    fetch(`${baseUrl}/api/blog/categories`)
                ]);

                const postsData = await postsRes.json();
                const featuredData = await featuredRes.json();
                const categoriesData = await categoriesRes.json();

                setPosts(postsData.data || []);
                setFeaturedPosts(featuredData.data || []);
                setCategories(categoriesData.data || []);
            } catch (error) {
                console.error('Failed to fetch blog data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedCategory]);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center bg-[#0a0c10]">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white">
            {/* Hero Section */}
            <div className="relative py-20 px-8 bg-gradient-to-b from-indigo-900/20 to-transparent">
                <div className="max-w-6xl mx-auto text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
                    >
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Legal Intelligence Blog</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-black tracking-tight"
                    >
                        Hot Legal <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Insights</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-400 max-w-2xl mx-auto"
                    >
                        AI-powered analysis of trending legal topics, contract strategies, and compliance updates.
                    </motion.p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 pb-20">
                {/* Category Filter */}
                <div className="flex flex-wrap items-center gap-3 mb-12">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${!selectedCategory
                                ? 'bg-indigo-500 text-white'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                    >
                        All Topics
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${selectedCategory === cat
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Posts Grid */}
                    <div className="lg:col-span-2 space-y-8">
                        {posts.length === 0 ? (
                            <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
                                <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500">No posts found. Check back soon!</p>
                            </div>
                        ) : (
                            posts.map((post, idx) => (
                                <motion.div
                                    key={post._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Link href={`/blog/${post.slug}`}>
                                        <div className="group relative bg-[#13171f] rounded-3xl border border-white/5 hover:border-indigo-500/30 p-8 transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="space-y-4 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                            {post.category}
                                                        </span>
                                                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {post.readTime} min read
                                                        </span>
                                                    </div>

                                                    <h2 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                                                        {post.title}
                                                    </h2>

                                                    <p className="text-slate-400 leading-relaxed line-clamp-2">
                                                        {post.excerpt}
                                                    </p>

                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                                                                AI
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-white">{post.author.name}</p>
                                                                <p className="text-[10px] text-slate-500">{post.author.role}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-slate-500 text-xs">
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="w-3 h-3" /> {post.views}
                                                            </span>
                                                            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Trending Posts */}
                        <div className="bg-[#13171f] rounded-3xl border border-white/5 p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Trending</h3>
                            </div>
                            <div className="space-y-4">
                                {featuredPosts.slice(0, 3).map((post, idx) => (
                                    <Link key={post._id} href={`/blog/${post.slug}`}>
                                        <div className="group flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                            <span className="text-2xl font-black text-indigo-500/30">{idx + 1}</span>
                                            <div>
                                                <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                                                    {post.title}
                                                </h4>
                                                <p className="text-[10px] text-slate-500 mt-1">{post.views} views</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Tags Cloud */}
                        <div className="bg-[#13171f] rounded-3xl border border-white/5 p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Tag className="w-4 h-4 text-purple-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Topics</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['AI', 'Contracts', 'Tax Law', 'Startups', 'Compliance', 'SaaS', 'Risk', 'Enterprise'].map(tag => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg text-xs font-medium hover:bg-indigo-500/10 hover:text-indigo-400 cursor-pointer transition-colors"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 text-center">
                            <h3 className="text-lg font-bold text-white mb-2">Analyze Your Contracts</h3>
                            <p className="text-sm text-indigo-200 mb-4">Get AI-powered risk assessment in seconds.</p>
                            <Link href="/dashboard/upload">
                                <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors">
                                    Try DealGuard Free
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
