import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    username: string;
    password: string;
    company: string;
    purchasedAnalyses: mongoose.Types.ObjectId[];
    createdAt: Date;
    comparePassword(password: string): Promise<boolean>;
    getSignedJwtToken(): string;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 10 },
    password: { type: String, required: true, select: false },
    company: { type: String, default: '' },
    purchasedAnalyses: [{ type: Schema.Types.ObjectId, ref: 'Analysis' }],
    createdAt: { type: Date, default: Date.now }
});

UserSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '7d'
    });
};

export default mongoose.model<IUser>('User', UserSchema);
