
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY;

// Create a fallback client for when environment variables are not available
const createFallbackClient = () => {
  return createClient('https://placeholder.supabase.co', 'placeholder-key');
};

export const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : createFallbackClient();