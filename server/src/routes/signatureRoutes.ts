import express from 'express';
import { exportToDocuSign } from '../controllers/signatureController.js';
import { protect } from '../middleware/authUser.js';

const router = express.Router();

router.post('/export-docusign/:id', protect, exportToDocuSign);

export default router;
