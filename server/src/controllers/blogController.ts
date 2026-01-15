import { Request, Response } from 'express';
import BlogPost from '../models/BlogPost.js';

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

// Seed sample blog posts (for demo)
export const seedPosts = async (req: Request, res: Response) => {
    try {
        const samplePosts = [
            {
                title: "Analysis of New Tech Tax Laws: What Startups Need to Know",
                slug: "analysis-of-new-tech-tax-laws-what-startups-need-to-know",
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

### 3. Equity Compensation Implications
Stock option taxation sees major updates:
- ISOs maintain favorable treatment with new holding period rules
- RSU taxation at vesting remains standard
- New deferral elections available for private company employees

## Risk Assessment

Our analysis indicates **Medium-High** compliance risk for companies operating in multiple jurisdictions without updated tax strategies.

## Recommended Actions

1. Audit current R&D expense classification
2. Review international revenue allocation
3. Update equity compensation plans for new rules
4. Consult with cross-border tax specialists`,
                category: "Tax Law",
                tags: ["Startups", "Technology", "Tax Credits", "Equity"],
                readTime: 8
            },
            {
                title: "AI Contract Review: Best Practices for Enterprise Adoption",
                slug: "ai-contract-review-best-practices-for-enterprise-adoption",
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
- Missing protective provisions

### Accuracy Metrics
When compared to senior legal review:
- 94% agreement on high-risk clause identification
- 89% alignment on recommended alternatives
- 97% accuracy in clause extraction

## Implementation Framework

### Phase 1: Pilot Program
- Select 50-100 contracts for parallel review
- Measure time savings and accuracy
- Train legal team on AI insights

### Phase 2: Integration
- Connect to existing CLM systems
- Establish escalation workflows
- Define AI confidence thresholds

### Phase 3: Optimization
- Custom model training on company data
- Playbook integration
- Automated reporting dashboards

## ROI Analysis

Enterprises report average savings of:
- 75% reduction in initial review time
- 60% decrease in outside counsel spend
- 45% faster contract execution cycles`,
                category: "Legal Tech",
                tags: ["AI", "Contracts", "Enterprise", "Automation"],
                readTime: 10
            },
            {
                title: "Navigating SaaS Agreement Pitfalls: Common Clauses That Cost Millions",
                slug: "navigating-saas-agreement-pitfalls-common-clauses-that-cost-millions",
                excerpt: "A deep dive into the most dangerous SaaS contract clauses and how to negotiate balanced alternatives that protect your business.",
                content: `# The Hidden Dangers in Your SaaS Agreements

After analyzing 5,000+ SaaS contracts, our AI has identified patterns that lead to significant financial exposure.

## Top 5 Problematic Clauses

### 1. Unlimited Liability for Data Breaches
**Risk Level: Critical**

Many SaaS vendors include unlimited liability carve-outs for:
- Data protection failures
- Security incidents
- Regulatory violations

**Our Recommendation**: Cap liability at 12 months of fees with reasonable sub-limits.

### 2. Auto-Renewal with Price Escalation
**Risk Level: High**

Watch for:
- 30-day notice windows (should be 60-90 days)
- Uncapped price increases
- Multi-year commitment extensions

### 3. Broad Indemnification Requirements
**Risk Level: High**

Vendor-favorable indemnification often requires you to defend against:
- Third-party IP claims arising from your data
- Claims related to your use case
- Regulatory investigations

### 4. Termination for Convenience (One-Sided)
**Risk Level: Medium**

Vendors retaining unilateral termination rights while locking you in creates operational risk.

### 5. Vague Service Level Agreements
**Risk Level: Medium**

SLAs without:
- Clear availability definitions
- Meaningful credit structures
- Exclusion limitations

## Negotiation Strategies

1. Always request the vendor's "enterprise" or "negotiable" version
2. Benchmark against industry standards
3. Prioritize liability caps and termination rights
4. Document all verbal commitments in the agreement`,
                category: "Contract Analysis",
                tags: ["SaaS", "Negotiation", "Risk Management", "B2B"],
                readTime: 7
            }
        ];

        await BlogPost.deleteMany({});
        await BlogPost.insertMany(samplePosts);

        res.json({ success: true, message: 'Sample posts seeded successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
