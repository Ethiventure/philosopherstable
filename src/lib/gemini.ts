import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

const DEFAULT_MODEL = 'gemini-2.0-flash';

let cachedClient: { key: string; client: GoogleGenerativeAI } | null = null;

function getClient(apiKey: string): GoogleGenerativeAI {
  if (cachedClient && cachedClient.key === apiKey) {
    return cachedClient.client;
  }
  const client = new GoogleGenerativeAI(apiKey);
  cachedClient = { key: apiKey, client };
  return client;
}

export async function generateContent(
  prompt: string,
  config: GeminiConfig,
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('No Gemini API key provided');
  }

  const client = getClient(config.apiKey);
  const model = client.getGenerativeModel({
    model: config.model || DEFAULT_MODEL,
    generationConfig: {
      temperature: 0.85,
      topP: 0.92,
      maxOutputTokens: 2048,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) {
    throw new Error('Gemini returned empty response');
  }
  return text.trim();
}

export function hasApiKey(): boolean {
  const key = localStorage.getItem('gemini_api_key');
  return Boolean(key && key.trim().length > 10);
}

export function getApiKey(): string {
  return localStorage.getItem('gemini_api_key') ?? '';
}

export function setApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem('gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('gemini_api_key');
  }
}

export function getModel(): string {
  return localStorage.getItem('gemini_model') || DEFAULT_MODEL;
}

export function setModel(model: string): void {
  if (model.trim()) {
    localStorage.setItem('gemini_model', model.trim());
  } else {
    localStorage.removeItem('gemini_model');
  }
}
