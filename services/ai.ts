import { GoogleGenAI } from "@google/genai";

export interface LLMConfig {
    provider: string;
    apiKey: string;
    model: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    parts?: any[]; // For multimodal
}

export class AIService {
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = config;
    }

    async generateContent(systemPrompt: string, userPrompt: string, history: ChatMessage[] = []): Promise<string> {
        if (!this.config.apiKey) {
            throw new Error("API Key is missing");
        }

        if (this.config.provider === 'google') {
            // Support Custom Base URL for Google GenAI
            
            // HACK: To support custom Base URL with Google SDK, we might need to patch fetch or use a different approach.
            // But since the user is using a proxy that mimics Google API structure (v1beta/models/...), 
            // and the error is "API_KEY_INVALID" from "generativelanguage.googleapis.com", 
            // it means the SDK is IGNORING your custom Base URL and hitting Google official endpoint directly.
            
            // Solution: If a custom baseUrl is present, we should probably NOT use GoogleGenAI SDK 
            // or configure it to use the custom endpoint.
            // The current @google/genai SDK is new and might not expose baseUrl easily.
            
            // Let's implement a direct REST fallback if baseUrl is custom.
            if (this.config.baseUrl && !this.config.baseUrl.includes('googleapis.com')) {
                return this.generateContentViaRest(systemPrompt, userPrompt, history);
            }

            const aiClient = new GoogleGenAI({ apiKey: this.config.apiKey });
            
            // Map history to Google format
            const googleHistory = history.map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));

            const chat = aiClient.chats.create({
                model: this.config.model,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: this.config.temperature || 0.7,
                    maxOutputTokens: this.config.maxTokens || 40960,
                },
                history: googleHistory
            });

            // Wrap string in expected Content structure to avoid "ContentUnion is required" error
            const result = await chat.sendMessage({
                message: [{ text: userPrompt }]
            });
            return result.text || '';
        } else {
            // Placeholder for other providers (OpenAI, etc.)
            // In a real implementation, we would use fetch/axios to call OpenAI-compatible endpoints
            console.warn("Provider not fully supported in this utility yet, falling back to mock for demo if needed.");
            
            // Simple Mock for demo if no Google key but other provider selected (or handle via specific SDKs)
            return `[AI Response] (${this.config.provider} not implemented in shared service yet). Content: ${userPrompt.substring(0, 50)}...`;
        }
    }

    private async generateContentViaRest(systemPrompt: string, userPrompt: string, history: ChatMessage[]): Promise<string> {
        // Fallback to fetch for custom Base URLs (e.g. proxies)
        // Construct the URL. If baseUrl ends with slash, remove it.
        const baseUrl = this.config.baseUrl?.replace(/\/$/, '') || 'https://generativelanguage.googleapis.com';
        
        let endpoint = '';
        
        if (baseUrl.includes(':generateContent')) {
            // User provided full endpoint URL in baseUrl field
            endpoint = baseUrl;
        } else {
            // Construct standard path
            const modelName = this.config.model.startsWith('models/') ? this.config.model : `models/${this.config.model}`;
            
            // Check if baseUrl already has /v1beta
            // The user input might be like "https://api.gptsapi.net/v1beta/models/gemini-3-flash-preview:generateContent"
            // Wait, if user inputs full URL in baseUrl, the previous check :generateContent handles it.
            
            // If user inputs "https://api.gptsapi.net/v1beta/models/gemini-3-flash-preview:generateContent" 
            // BUT without :generateContent at end? Unlikely.
            
            // If user inputs "https://api.gptsapi.net"
            if (baseUrl.includes('/v1beta')) {
                 // e.g. https://api.gptsapi.net/v1beta
                 // We should append models/model:generateContent if not present
                 if (baseUrl.includes('/models/')) {
                     // e.g. https://api.gptsapi.net/v1beta/models/gemini-3-flash-preview
                     endpoint = `${baseUrl}:generateContent`;
                 } else {
                     endpoint = `${baseUrl}/${modelName}:generateContent`;
                 }
            } else {
                 // e.g. https://api.gptsapi.net
                 endpoint = `${baseUrl}/v1beta/${modelName}:generateContent`;
            }
        }
        
        // Clean up double slashes (except http://)
        endpoint = endpoint.replace(/([^:]\/)\/+/g, "$1");

        const contents = [
             // System prompt is handled via 'system_instruction' field in Google API, NOT in 'contents'
             ...history.map(m => ({
                 role: m.role,
                 parts: [{ text: m.content }]
             })),
             {
                 role: 'user',
                 parts: [{ text: userPrompt }]
             }
        ];

        const payload: any = {
            contents: contents,
            generationConfig: {
                temperature: this.config.temperature || 0.7,
                maxOutputTokens: this.config.maxTokens || 4096
            }
        };
        
        // Only add systemInstruction if supported and present
        if (systemPrompt) {
            payload.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.config.apiKey // Key in header as per user curl example
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            // Extract text from response
            // Response structure: { candidates: [ { content: { parts: [ { text: "..." } ] } } ] }
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error: any) {
            console.error('REST API Call Failed:', error);
            throw error;
        }
    }
}
