import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
export const authAPI = {
    signup: (data: { name: string; email: string; password: string; company?: string }) =>
        apiClient.post('/v1/signup', data),


    signin: (data: { email: string; password: string }) =>
        apiClient.post('/v1/signin', data),

    login: (data: { email: string; password: string }) =>
        apiClient.post('/v1/signin', data), // Keep login as alias for backward compatibility or refactor pages


    logout: () =>
        apiClient.post('/v1/logout'),

    getProfile: () =>
        apiClient.get('/users/profile'),
};

// Contract endpoints
export const contractAPI = {
    uploadAndAnalyze: (formData: FormData) =>
        apiClient.post('/contracts/upload-analyze', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    getMyContracts: () =>
        apiClient.get('/contracts/my-contracts'),

    getAnalysis: (id: string) =>
        apiClient.get(`/contracts/analysis/${id}`),

    getTemplates: () =>
        apiClient.get('/contracts/templates'),

    redlineContract: (id: string, originalClause: string, alternativeClause: string) =>
        apiClient.post(`/contracts/redline/${id}`, { originalClause, alternativeClause }, {
            responseType: 'blob'
        }),
};

// Signature endpoints
export const signatureAPI = {
    exportToDocuSign: (analysisId: string) =>
        apiClient.post(`/signatures/export-docusign/${analysisId}`),
};

// Search & RAG endpoints
export const searchAPI = {
    semanticSearch: (query: string, limit: number = 5, category?: string) =>
        apiClient.post('/search/semantic', { query, limit, category }),

    chatWithHistory: (message: string, contextLimit: number = 5) =>
        apiClient.post('/search/history-chat', { message, contextLimit }),
};

export default apiClient;
