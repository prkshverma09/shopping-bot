import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const apiKey = process.env.OPENAI_API_KEY || process.env.XAI_API_KEY;
const isConfigured = !!apiKey && apiKey !== 'your-openai-api-key';
export const openai = isConfigured
    ? new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || (process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : 'https://api.x.ai/v1'),
    })
    : null;
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
