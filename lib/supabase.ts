import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const secretKey = process.env.SUPABASE_SECRET_KEY;

// Cliente para lectura (frontend y server components)
export const supabase = createClient(url, anonKey);

// Cliente para escritura (solo server-side, cron)
export const supabaseAdmin = secretKey
  ? createClient(url, secretKey)
  : supabase;
