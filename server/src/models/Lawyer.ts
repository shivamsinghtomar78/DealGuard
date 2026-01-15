import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface ILawyer extends Document {
    name: string;
    email: string;
    password: string;
    licenseNumber: string;
    specialization: string[];
    verified: boolean;
    createdTemplates: mongoose.Types.ObjectId[];
    createdAt: Date;
    comparePassword(password: string): Promise<boolean>;
    getSignedJwtToken(): string;
}

const LawyerSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    licenseNumber: { type: String, required: true, unique: true },
    specialization: {
        type: [String],
        enum: ['corporate', 'employment', 'intellectual-property', 'real-estate', 'general'],
        default: ['general']
    },
    verified: { type: Boolean, default: false },
    createdTemplates: [{ type: Schema.Types.ObjectId, ref: 'ContractTemplate' }],
    createdAt: { type: Date, default: Date.now }
});

LawyerSchema.pre<ILawyer>('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
});

LawyerSchema.methods.comparePassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

LawyerSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: 'lawyer' }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '7d'
    });
};

export default mongoose.model<ILawyer>('Lawyer', LawyerSchema);
