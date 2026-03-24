const BACKEND_URL = '/api';

export async function analyzeContract(documentText) {
    try {
        const response = await fetch(`${BACKEND_URL}/ai/analyze-contract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_text: documentText })
        });
        if (!response.ok) throw new Error('AI analysis failed');
        return await response.json();
    } catch (err) {
        console.error('AI analysis error:', err);
        return {
            status: 'error',
            riskScore: 'Medium',
            missingTerms: [],
            extractedClauses: {}
        };
    }
}

export async function extractClausesFromEmail(emailText) {
    try {
        const response = await fetch(`${BACKEND_URL}/ai/extract-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email_text: emailText })
        });
        if (!response.ok) throw new Error('Email extraction failed');
        return await response.json();
    } catch (err) {
        console.error('Email extraction error:', err);
        return null;
    }
}

export async function generateCASNotes(contractId) {
    try {
        const response = await fetch(`${BACKEND_URL}/ai/generate-cas-notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contract_id: contractId })
        });
        if (!response.ok) throw new Error('CAS notes generation failed');
        return await response.json();
    } catch (err) {
        console.error('CAS notes error:', err);
        return null;
    }
}

export async function extractFromFile(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${BACKEND_URL}/ai/extract-file`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('File extraction failed');
        return await response.json();
    } catch (err) {
        console.error('File extraction error:', err);
        return null;
    }
}
