import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "@/lib/supabase/env";

// The only way the app reaches the database: as the signed-in person, with the
// publishable key. Row level security decides what comes back. There is no
// service-role client anywhere in the request path.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseEnv.url, supabaseEnv.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. The proxy has already
          // refreshed the session for this request, so there is nothing to do.
        }
      },
    },
  });
}
