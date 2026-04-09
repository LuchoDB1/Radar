import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secretKey = process.env.SUPABASE_SECRET_KEY;

// Cliente para lectura (frontend y server components)
export const supabase = createClient(url, publishableKey);

// Cliente para escritura (solo server-side, scheduled agent)
export const supabaseAdmin = secretKey
  ? createClient(url, secretKey)
  : supabase;
