import express from 'express';
import { getAllPosts, getPostBySlug, getFeaturedPosts, getCategories, seedPosts } from '../controllers/blogController.js';

const router = express.Router();

// Public routes
router.get('/posts', getAllPosts);
router.get('/posts/featured', getFeaturedPosts);
router.get('/posts/:slug', getPostBySlug);
router.get('/categories', getCategories);

// Admin/Dev route for seeding
router.post('/seed', seedPosts);

export default router;
