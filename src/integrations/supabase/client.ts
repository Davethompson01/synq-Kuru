
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}



export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);