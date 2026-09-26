import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:3000';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
    db: {
        schema: 'public',
    },
    global: {
        fetch: (url, options) => {
            // If standalone PostgREST is mounted at root, strip /rest/v1
            const normalizedUrl = typeof url === 'string' ? url.replace('/rest/v1/', '/') : url;
            return fetch(normalizedUrl, options);
        },
    },
});
