import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

const BASE_AI_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');
const AI_SERVICE_URL = BASE_AI_URL;

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
        const fileBuffer = fs.readFileSync(filePath);
        formData.append('file', fileBuffer, {
            filename: path.basename(filePath),
            contentType: 'application/pdf'
        });
        formData.append('contract_id', contractId);
        formData.append('category', category);
        formData.append('user_id', 'prod_user'); // Ensure user_id is passed

        if (webhookUrl) {
            formData.append('webhook_url', webhookUrl);
        }

        console.log(`📡 Axios: POST to ${AI_SERVICE_URL}/analyze/upload (${(fileBuffer.length / 1024).toFixed(1)} KB)`);

        const response = await axios.post(`${AI_SERVICE_URL}/analyze/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000 // 60s handoff
        });

        return response.data;
    } catch (error: any) {
        console.error('❌ AI Client Upload Error:', error.message);
        if (error.response) {
            console.error('   Response Status:', error.response.status);
            console.error('   Response Data:', JSON.stringify(error.response.data));
        } else if (error.request) {
            console.error('   No response received from AI service. Request was sent.');
            console.error('   Request Config:', error.config); // Add request config for more context
        } else {
            console.error('   Error during request setup:', error.message); // Catch other errors
        }
        throw error;
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

