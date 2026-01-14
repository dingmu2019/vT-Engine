"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.isSupabaseConfigured = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '';
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '').trim();
// Helper to validate URL
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isSupabaseConfigured = Boolean(supabaseUrl && isValidUrl(supabaseUrl) && supabaseKey);
let client;
if (exports.isSupabaseConfigured) {
    client = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
}
else {
    console.warn('Supabase not configured. Using Mock Client (No-op).');
    // Create a Proxy to mock Supabase client interface safely
    // This prevents "undefined is not a function" errors if store.ts calls methods blindly
    // But store.ts should check isSupabaseConfigured first.
    // For safety, we return a client that always returns { error: ... }
    // Using a placeholder URL to create a real client instance but it will fail on requests.
    // However, to avoid network timeouts, we should prefer store.ts to skip calls.
    // We still export a valid client object structure to satisfy type checking.
    client = (0, supabase_js_1.createClient)('https://placeholder.supabase.co', 'placeholder');
}
exports.supabase = client;
