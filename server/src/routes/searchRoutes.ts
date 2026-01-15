import express from 'express';
import { semanticSearch, chatWithHistory } from '../controllers/searchController.js';
import { protect } from '../middleware/authUser.js';

const router = express.Router();

router.post('/semantic', protect, semanticSearch);
router.post('/history-chat', protect, chatWithHistory);

export default router;
