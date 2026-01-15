import express from 'express';
import { signup, signin, logout, getProfile, getMyAnalyses } from '../controllers/userController.js';
import { protect } from '../middleware/authUser.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.get('/my-analyses', protect, getMyAnalyses);

export default router;
