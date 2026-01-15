import mongoose, { Schema, Document } from 'mongoose';

export interface IClause {
    clauseName: string;
    description?: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    standardAlternative?: string;
    legalReasoning?: string;
}

export interface IContractTemplate extends Document {
    title: string;
    description: string;
    category: 'employment' | 'nda' | 'service-agreement' | 'partnership' | 'lease' | 'other';
    price: number;
    clauses: IClause[];
    createdBy: mongoose.Types.ObjectId;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ClauseSchema: Schema = new Schema({
    clauseName: { type: String, required: true },
    description: String,
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    standardAlternative: String,
    legalReasoning: String
});

const ContractTemplateSchema: Schema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['employment', 'nda', 'service-agreement', 'partnership', 'lease', 'other'],
        required: true
    },
    price: { type: Number, required: true, min: 0 },
    clauses: [ClauseSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'Lawyer', required: true },
    isPublished: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

ContractTemplateSchema.pre<IContractTemplate>('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model<IContractTemplate>('ContractTemplate', ContractTemplateSchema);
