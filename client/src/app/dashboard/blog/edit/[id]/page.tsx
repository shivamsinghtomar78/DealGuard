'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { blogAPI } from '@/lib/api';
import {
    ArrowLeft,
    Save,
    Eye,
    FileText,
    Tag,
    Folder,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = [
    'Contract Analysis',
    'Legal Tech',
    'Tax Law',
    'Compliance',
    'Risk Management',
    'Corporate Law',
    'Intellectual Property',
    'Employment Law',
    'Data Privacy',
    'Other'
];

export default function EditBlogPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        category: '',
        tags: '',
        isPublished: true
    });

    useEffect(() => {
        const fetchPost = async () => {
            try {
                // We need to get the post by ID, but our API uses slug
                // For editing, we'll need to fetch from my posts and find by ID
                const response = await blogAPI.getMyPosts();
                const posts = response.data.data || [];
                const post = posts.find((p: any) => p._id === postId);

                if (!post) {
                    toast.error('Post not found');
                    router.push('/dashboard/blog');
                    return;
                }

                // If post doesn't have full content, fetch it by slug
                if (!post.content) {
                    const fullPost = await blogAPI.getPost(post.slug);
                    Object.assign(post, fullPost.data.data);
                }

                setFormData({
                    title: post.title || '',
                    excerpt: post.excerpt || '',
                    content: post.content || '',
                    category: post.category || '',
                    tags: (post.tags || []).join(', '),
                    isPublished: post.isPublished ?? true
                });
            } catch (error: any) {
                toast.error('Failed to load post');
                router.push('/dashboard/blog');
            } finally {
                setIsLoading(false);
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.excerpt || !formData.content || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsSubmitting(true);

            const tagsArray = formData.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            await blogAPI.updatePost(postId, {
                title: formData.title,
                excerpt: formData.excerpt,
                content: formData.content,
                category: formData.category,
                tags: tagsArray,
                isPublished: formData.isPublished
            });

            toast.success('Post updated successfully!');
            router.push('/dashboard/blog');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update post');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0c10] pt-16">
            <div className="max-w-4xl mx-auto px-8 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Edit Post</h1>
                            <p className="text-sm text-slate-500">Update your blog post</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showPreview
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        {showPreview ? 'Edit' : 'Preview'}
                    </button>
                </div>

                {showPreview ? (
                    /* Preview Mode */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-8"
                    >
                        <div className="mb-6">
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-semibold">
                                {formData.category || 'Category'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4">
                            {formData.title || 'Your Title'}
                        </h1>
                        <p className="text-lg text-slate-400 mb-8">
                            {formData.excerpt || 'Your excerpt will appear here...'}
                        </p>
                        <div className="prose prose-invert prose-lg max-w-none">
                            <ReactMarkdown>
                                {formData.content || '*Start writing your content...*'}
                            </ReactMarkdown>
                        </div>
                    </motion.div>
                ) : (
                    /* Edit Mode */
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                <FileText className="w-4 h-4" />
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter an engaging title..."
                                className="w-full px-4 py-3 bg-[#0d1117] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Excerpt *
                            </label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleChange}
                                placeholder="Write a brief summary..."
                                rows={2}
                                className="w-full px-4 py-3 bg-[#0d1117] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                <Folder className="w-4 h-4" />
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[#0d1117] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                            >
                                <option value="" className="bg-[#0d1117]">Select a category</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat} className="bg-[#0d1117]">{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                <Tag className="w-4 h-4" />
                                Tags (comma separated)
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="e.g. Contracts, AI, Compliance"
                                className="w-full px-4 py-3 bg-[#0d1117] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Content * (Markdown supported)
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="Write your blog post content here..."
                                rows={15}
                                className="w-full px-4 py-3 bg-[#0d1117] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none font-mono text-sm"
                            />
                        </div>

                        {/* Publish Option */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isPublished"
                                name="isPublished"
                                checked={formData.isPublished}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500"
                            />
                            <label htmlFor="isPublished" className="text-sm text-slate-400">
                                Published (uncheck to save as draft)
                            </label>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl font-medium hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
