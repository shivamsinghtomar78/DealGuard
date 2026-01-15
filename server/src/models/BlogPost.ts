import mongoose, { Document, Schema } from 'mongoose';

export interface IBlogPost extends Document {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    category: string;
    tags: string[];
    author: {
        name: string;
        avatar?: string;
        role: string;
    };
    readTime: number;
    views: number;
    isPublished: boolean;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    seoTitle?: string;
    seoDescription?: string;
}

const BlogPostSchema: Schema = new Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: String,
    category: { type: String, required: true },
    tags: [String],
    author: {
        name: { type: String, default: 'DealGuard AI' },
        avatar: String,
        role: { type: String, default: 'Legal Intelligence Engine' }
    },
    readTime: { type: Number, default: 5 },
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    seoTitle: String,
    seoDescription: String
}, { timestamps: true });

// Generate slug from title
BlogPostSchema.pre('save', function (next) {
    if (this.isModified('title')) {
        this.slug = (this.title as string)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

export default mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);
