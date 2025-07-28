
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || 'https://ptbovfurgindhzjvvlee.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Ym92ZnVyZ2luZGh6anZ2bGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODg1MzUsImV4cCI6MjA2OTA2NDUzNX0.pdcbp0aRCSU5cr1aPcV8V4PSKMA5sM5rQoZ2Qh9Z1JM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);