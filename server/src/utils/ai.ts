import axios from 'axios';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const analyzeContract = async (contractText: string, templateClauses: any[]) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API Key is not configured');
    }

    const prompt = `
    Analyze the following contract text against the provided standard clauses.
    For each standard clause, identify if there is a corresponding clause in the contract.
    If yes, evaluate its risk level (low, medium, high, critical) and explain why.
    Suggest a standard alternative and provide legal reasoning.
    Also, provide an overall risk score from 1 to 10 and a brief AI summary.

    Standard Clauses:
    ${JSON.stringify(templateClauses)}

    Contract Text:
    ${contractText}

    Return the result in JSON format with the following structure:
    {
      "overallRiskScore": number,
      "aiSummary": "string",
      "riskAssessments": [
        {
          "clauseText": "text from contract",
          "riskLevel": "low|medium|high|critical",
          "riskExplanation": "why it is risky",
          "standardAlternative": "suggested improvement",
          "legalReasoning": "legal basis"
        }
      ]
    }
  `;

    try {
        const response = await axios.post(`${GEMINI_API_URL}?key=${apiKey}`, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const result = response.data.candidates[0].content.parts[0].text;
        return JSON.parse(result);
    } catch (error: any) {
        console.error('AI Analysis Error:', error.response?.data || error.message);
        throw new Error('Failed to analyze contract with AI');
    }
};
