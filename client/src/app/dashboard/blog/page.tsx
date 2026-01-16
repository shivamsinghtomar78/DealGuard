'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { blogAPI } from '@/lib/api';
import {
    FileText,
    Plus,
    Edit3,
    Trash2,
    Eye,
    EyeOff,
    Clock,
    ArrowLeft,
    MoreVertical,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    isPublished: boolean;
    views: number;
    readTime: number;
    createdAt: string;
    publishedAt?: string;
}

export default function MyPostsPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; post?: BlogPost }>({ show: false });
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        try {
            const response = await blogAPI.getMyPosts();
            setPosts(response.data.data || []);
        } catch (error: any) {
            if (error.response?.status === 401) {
                router.push('/login');
            } else {
                toast.error('Failed to load your posts');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.post) return;

        try {
            setIsDeleting(true);
            await blogAPI.deletePost(deleteModal.post._id);
            setPosts(posts.filter(p => p._id !== deleteModal.post?._id));
            toast.success('Post deleted successfully');
            setDeleteModal({ show: false });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete post');
        } finally {
            setIsDeleting(false);
        }
    };

    const togglePublish = async (post: BlogPost) => {
        try {
            await blogAPI.updatePost(post._id, { isPublished: !post.isPublished });
            setPosts(posts.map(p =>
                p._id === post._id ? { ...p, isPublished: !p.isPublished } : p
            ));
            toast.success(post.isPublished ? 'Post unpublished' : 'Post published');
        } catch (error: any) {
            toast.error('Failed to update post');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0c10] pt-16">
            <div className="max-w-5xl mx-auto px-8 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/blog">
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">My Posts</h1>
                            <p className="text-sm text-slate-500">{posts.length} posts</p>
                        </div>
                    </div>
                    <Link href="/dashboard/blog/create">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors">
                            <Plus className="w-4 h-4" />
                            New Post
                        </button>
                    </Link>
                </div>

                {/* Posts List */}
                {posts.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/5">
                        <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
                        <p className="text-slate-500 mb-6">Start sharing your legal insights with the community.</p>
                        <Link href="/dashboard/blog/create">
                            <button className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors">
                                <Plus className="w-4 h-4" />
                                Write Your First Post
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post, idx) => (
                            <motion.div
                                key={post._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-[#0d1117] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${post.isPublished
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'bg-amber-500/10 text-amber-400'
                                                }`}>
                                                {post.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                            <span className="text-[10px] text-slate-600">{post.category}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-1 truncate">{post.title}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-1">{post.excerpt}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {post.readTime} min
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" /> {post.views} views
                                            </span>
                                            <span>
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => togglePublish(post)}
                                            className={`p-2 rounded-lg transition-colors ${post.isPublished
                                                    ? 'text-slate-400 hover:bg-amber-500/10 hover:text-amber-400'
                                                    : 'text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                                                }`}
                                            title={post.isPublished ? 'Unpublish' : 'Publish'}
                                        >
                                            {post.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <Link href={`/dashboard/blog/edit/${post._id}`}>
                                            <button className="p-2 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 rounded-lg transition-colors">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => setDeleteModal({ show: true, post })}
                                            className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <Link href={`/blog/${post.slug}`}>
                                            <button className="p-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModal.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setDeleteModal({ show: false })}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#13171f] border border-white/10 rounded-2xl p-6 max-w-md w-full"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Delete Post</h3>
                            </div>
                            <p className="text-slate-400 mb-6">
                                Are you sure you want to delete "{deleteModal.post?.title}"? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal({ show: false })}
                                    className="flex-1 py-2.5 bg-white/5 text-slate-400 rounded-xl font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
