import express from 'express';
import { signup, login, logout, createTemplate, getMyTemplates } from '../controllers/lawyerController.js';
import { protectLawyer } from '../middleware/authLawyer.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/create-template', protectLawyer, createTemplate);
router.get('/my-templates', protectLawyer, getMyTemplates);

export default router;
