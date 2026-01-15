import express from 'express';
import { getAllTemplates, getTemplate, getMyContracts, getAnalysis } from '../controllers/contractController.js';
import { uploadAndAnalyze, handleAnalysisWebhook, getAnalysisDetails, redlineContract, addRiskComment } from '../controllers/analysisController.js';
import { protect } from '../middleware/authUser.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/templates', getAllTemplates);
router.get('/template/:id', getTemplate);
router.get('/my-contracts', protect, getMyContracts);
router.get('/analysis/:id', protect, getAnalysis);

// AI Analysis routes
router.post('/upload-analyze', protect, upload.single('contract'), uploadAndAnalyze);
router.get('/analysis-details/:id', protect, getAnalysisDetails);
router.post('/analysis/:id/risk/:clauseIdx/comment', protect, addRiskComment);
router.post('/webhook/analysis', handleAnalysisWebhook);

router.post('/redline/:id', protect, redlineContract);
export default router;
