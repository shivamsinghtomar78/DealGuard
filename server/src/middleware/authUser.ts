import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';

export interface AuthRequest extends Request {
    user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token || token === 'none') {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = await User.findById(decoded.id) || undefined;

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
};
