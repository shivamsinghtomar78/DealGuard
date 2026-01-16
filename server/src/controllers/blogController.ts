import { Request, Response } from 'express';
import BlogPost from '../models/BlogPost.js';
import { AuthRequest } from '../middleware/authUser.js';

// Get all published blog posts
export const getAllPosts = async (req: Request, res: Response) => {
    try {
        const { category, tag, limit = 10, page = 1 } = req.query;

        const filter: any = { isPublished: true };
        if (category) filter.category = category;
        if (tag) filter.tags = tag;

        const posts = await BlogPost.find(filter)
            .sort({ publishedAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .select('-content');

        const total = await BlogPost.countDocuments(filter);

        res.json({
            success: true,
            data: posts,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single post by slug
export const getPostBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;

        const post = await BlogPost.findOneAndUpdate(
            { slug, isPublished: true },
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.json({ success: true, data: post });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get featured/trending posts
export const getFeaturedPosts = async (req: Request, res: Response) => {
    try {
        const posts = await BlogPost.find({ isPublished: true })
            .sort({ views: -1 })
            .limit(5)
            .select('-content');

        res.json({ success: true, data: posts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await BlogPost.distinct('category', { isPublished: true });
        res.json({ success: true, data: categories });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a new blog post (authenticated user)
export const createPost = async (req: AuthRequest, res: Response) => {
    try {
        const { title, excerpt, content, category, tags, isPublished = true } = req.body;

        if (!title || !excerpt || !content || !category) {
            return res.status(400).json({
                success: false,
                message: 'Title, excerpt, content, and category are required'
            });
        }

        // Calculate read time (approx 200 words per minute)
        const wordCount = content.split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        const post = await BlogPost.create({
            title,
            excerpt,
            content,
            category,
            tags: tags || [],
            userId: req.user?._id,
            authorType: 'user',
            author: {
                name: req.user?.name || 'Community Member',
                role: 'Legal Community Contributor'
            },
            readTime,
            isPublished,
            publishedAt: isPublished ? new Date() : undefined
        });

        res.status(201).json({ success: true, data: post });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get current user's posts
export const getMyPosts = async (req: AuthRequest, res: Response) => {
    try {
        const posts = await BlogPost.find({ userId: req.user?._id })
            .sort({ createdAt: -1 })
            .select('-content');

        res.json({ success: true, data: posts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a post (only owner)
export const updatePost = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, excerpt, content, category, tags, isPublished } = req.body;

        const post = await BlogPost.findById(id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.userId?.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
        }

        // Update fields
        if (title) post.title = title;
        if (excerpt) post.excerpt = excerpt;
        if (content) {
            post.content = content;
            // Recalculate read time
            const wordCount = content.split(/\s+/).length;
            post.readTime = Math.max(1, Math.ceil(wordCount / 200));
        }
        if (category) post.category = category;
        if (tags) post.tags = tags;
        if (typeof isPublished === 'boolean') {
            post.isPublished = isPublished;
            if (isPublished && !post.publishedAt) {
                post.publishedAt = new Date();
            }
        }

        await post.save();

        res.json({ success: true, data: post });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a post (only owner)
export const deletePost = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const post = await BlogPost.findById(id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.userId?.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();

        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Seed sample blog posts (for demo)
export const seedPosts = async (req: Request, res: Response) => {
    try {
        const samplePosts = [
            {
                title: "Analysis of New Tech Tax Laws: What Startups Need to Know",
                excerpt: "Our AI engine breaks down the latest tech tax regulations and their impact on SaaS businesses, venture funding, and equity compensation.",
                content: `# The Shifting Landscape of Tech Taxation

The technology sector faces unprecedented regulatory changes in 2024. Our neural legal engine has analyzed over 500 recent tax rulings to bring you actionable insights.

## Key Takeaways

### 1. Digital Services Tax (DST)
Many jurisdictions are implementing DST at rates between 2-7% of revenue. This affects:
- SaaS companies with cross-border customers
- Digital advertising platforms
- E-commerce marketplaces

### 2. R&D Tax Credit Changes
The new regulations modify how startups can claim R&D credits:
- Software development costs must be amortized over 5 years
- Cloud computing expenses now qualify under specific conditions
- AI/ML research gets enhanced credit rates

## Risk Assessment

Our analysis indicates **Medium-High** compliance risk for companies operating in multiple jurisdictions without updated tax strategies.`,
                category: "Tax Law",
                tags: ["Startups", "Technology", "Tax Credits"],
                authorType: 'ai',
                readTime: 8
            },
            {
                title: "AI Contract Review: Best Practices for Enterprise Adoption",
                excerpt: "How leading enterprises are leveraging AI-powered contract analysis to reduce legal review time by 80% while improving risk detection.",
                content: `# Enterprise AI Contract Review: A Comprehensive Guide

The adoption of AI in legal operations has reached an inflection point. Here's what our analysis of 10,000+ enterprise contracts reveals.

## The Current State

Traditional contract review processes suffer from:
- 40+ hours average review time per complex agreement
- 23% of risky clauses missed by manual review
- Inconsistent risk assessment across legal teams

## AI-Powered Transformation

### Speed Improvements
Our neural engine processes contracts in under 60 seconds, identifying:
- Non-standard clauses
- Hidden liability exposures
- Missing protective provisions`,
                category: "Legal Tech",
                tags: ["AI", "Contracts", "Enterprise"],
                authorType: 'ai',
                readTime: 10
            }
        ];

        await BlogPost.deleteMany({ authorType: 'ai' }); // Only delete AI posts
        await BlogPost.insertMany(samplePosts);

        res.json({ success: true, message: 'Sample posts seeded successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
