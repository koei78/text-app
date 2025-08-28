import { createClient } from "@supabase/supabase-js"

export const getSupabaseServer = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !service) {
    throw new Error("Supabase environment variables are not set")
  }
  return createClient(url, service, { auth: { persistSession: false } })
}
