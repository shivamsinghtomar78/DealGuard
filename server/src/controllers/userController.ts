import { Request, Response } from 'express';
import User from '../models/User.js';
import Analysis from '../models/Analysis.js';
import { AuthRequest } from '../middleware/authUser.js';

const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
    const token = user.getSignedJwtToken();
    const options = {
        expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const
    };

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            username: user.username,
            company: user.company
        }
    });
};

export const signup = async (req: Request, res: Response) => {
    try {
        const { name, username, password, company } = req.body;

        // Validation constraints
        const usernameValid = username && username.length >= 3 && username.length <= 10;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
        const passwordValid = password && passwordRegex.test(password);

        if (!usernameValid || !passwordValid) {
            return res.status(411).json({ success: false, message: 'Invalid username or password format' });
        }

        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(403).json({ success: false, message: 'User already exists with this username' });
        }

        const user = await User.create({ name, username, password, company });

        const token = user.getSignedJwtToken();
        res.status(200).json({
            success: true,
            message: 'Signed up successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                company: user.company
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const signin = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(403).json({ success: false, message: 'Please provide username and password' });
        }

        const user = await User.findOne({ username }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(403).json({ success: false, message: 'Invalid credentials' });
        }

        const token = user.getSignedJwtToken();
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                company: user.company
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const logout = (req: Request, res: Response) => {
    res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?._id).populate('purchasedAnalyses');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyAnalyses = async (req: AuthRequest, res: Response) => {
    try {
        const analyses = await Analysis.find({ userId: req.user?._id }).populate('templateId').sort('-purchasedAt');
        res.status(200).json({ success: true, count: analyses.length, data: analyses });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
