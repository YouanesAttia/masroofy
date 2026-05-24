import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
    "Copy .env.example to .env and fill in your project URL and anon key.\n" +
    "Find them at: https://supabase.com/dashboard → your project → Project Settings → API"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);