import { Request, Response } from 'express';
import Lawyer from '../models/Lawyer.js';
import ContractTemplate from '../models/ContractTemplate.js';
import { LawyerAuthRequest } from '../middleware/authLawyer.js';

const sendTokenResponse = (lawyer: any, statusCode: number, res: Response) => {
    const token = lawyer.getSignedJwtToken();
    const options = {
        expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const
    };

    res.status(statusCode).cookie('lawyerToken', token, options).json({
        success: true,
        token,
        lawyer: {
            id: lawyer._id,
            name: lawyer.name,
            email: lawyer.email,
            specialization: lawyer.specialization
        }
    });
};

export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password, licenseNumber, specialization } = req.body;
        const lawyerExists = await Lawyer.findOne({ email });
        if (lawyerExists) return res.status(400).json({ success: false, message: 'Lawyer already exists' });

        const lawyer = await Lawyer.create({ name, email, password, licenseNumber, specialization });
        sendTokenResponse(lawyer, 201, res);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

        const lawyer = await Lawyer.findOne({ email }).select('+password');
        if (!lawyer || !(await lawyer.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        sendTokenResponse(lawyer, 200, res);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const logout = (req: Request, res: Response) => {
    res.cookie('lawyerToken', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const createTemplate = async (req: LawyerAuthRequest, res: Response) => {
    try {
        const { title, description, category, price, clauses } = req.body;
        const template = await ContractTemplate.create({
            title, description, category, price, clauses, createdBy: req.lawyer?._id
        });

        await Lawyer.findByIdAndUpdate(req.lawyer?._id, { $push: { createdTemplates: template._id } });
        res.status(201).json({ success: true, data: template });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyTemplates = async (req: LawyerAuthRequest, res: Response) => {
    try {
        const templates = await ContractTemplate.find({ createdBy: req.lawyer?._id }).sort('-createdAt');
        res.status(200).json({ success: true, count: templates.length, data: templates });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
