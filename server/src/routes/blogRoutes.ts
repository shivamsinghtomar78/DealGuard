import express from 'express';
import {
    getAllPosts,
    getPostBySlug,
    getFeaturedPosts,
    getCategories,
    seedPosts,
    createPost,
    getMyPosts,
    updatePost,
    deletePost
} from '../controllers/blogController.js';
import { protect } from '../middleware/authUser.js';

const router = express.Router();

// Public routes
router.get('/posts', getAllPosts);
router.get('/posts/featured', getFeaturedPosts);
router.get('/categories', getCategories);

// Protected routes (must come before :slug to avoid conflicts)
router.get('/posts/my', protect, getMyPosts);
router.post('/posts', protect, createPost);
router.put('/posts/:id', protect, updatePost);
router.delete('/posts/:id', protect, deletePost);

// Public route with slug param (must be last)
router.get('/posts/:slug', getPostBySlug);

// Admin/Dev route for seeding
router.post('/seed', seedPosts);

export default router;
