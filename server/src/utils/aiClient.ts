import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Sends a file to the AI service for analysis using multipart/form-data.
 * This is the preferred method for separate deployments where the services 
 * do not share a filesystem.
 */
export const uploadFileForAnalysis = async (
    filePath: string,
    contractId: string,
    category: string,
    webhookUrl?: string
) => {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        formData.append('contract_id', contractId);
        formData.append('category', category);
        if (webhookUrl) {
            formData.append('webhook_url', webhookUrl);
        }

        const response = await axios.post(`${AI_SERVICE_URL}/analyze/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        return response.data;
    } catch (error: any) {
        console.error('AI Upload Analysis Error:', error.response?.data || error.message);
        throw new Error('Failed to upload and analyze contract with AI service');
    }
};

/**
 * Legacy/Local-only method that sends a file path.
 * @deprecated Use uploadFileForAnalysis for separate deployments.
 */
export const analyzeContractWithAI = async (filePath: string, contractId: string, category: string, webhookUrl?: string) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/analyze/text`, {
            contract_id: contractId,
            file_path: filePath,
            category: category,
            user_id: 'temp_user',
            deep_analysis: true,
            webhook_url: webhookUrl
        });

        return response.data;
    } catch (error: any) {
        console.error('AI Analysis Error:', error.response?.data || error.message);
        throw new Error('Failed to analyze contract with AI service');
    }
};

/**
 * Sends a redlining request to the AI service.
 * Note: Currently this still uses file_path which implies the AI service 
 * needs access to the file. For true separation, the redlining agent 
 * should either use S3 or accept the file content.
 */
export const redlineContractWithAI = async (filePath: string, originalClause: string, alternativeClause: string) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/analyze/redline`, {
            file_path: filePath,
            original_clause: originalClause,
            alternative_clause: alternativeClause
        }, {
            responseType: 'arraybuffer'
        });

        return response.data;
    } catch (error: any) {
        console.error('AI Redlining Error:', error.response?.data || error.message);
        throw new Error('Failed to redline contract with AI service');
    }
};

