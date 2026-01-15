import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Lawyer, { ILawyer } from '../models/Lawyer.js';

export interface LawyerAuthRequest extends Request {
    lawyer?: ILawyer;
}

export const protectLawyer = async (req: LawyerAuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.lawyerToken) {
        token = req.cookies.lawyerToken;
    }

    if (!token || token === 'none') {
        return res.status(401).json({ success: false, message: 'Not authorized - Lawyer only' });
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        if (decoded.role !== 'lawyer') {
            return res.status(403).json({ success: false, message: 'Access denied - Lawyer only' });
        }

        req.lawyer = await Lawyer.findById(decoded.id) || undefined;

        if (!req.lawyer) {
            return res.status(401).json({ success: false, message: 'Lawyer not found' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
};
