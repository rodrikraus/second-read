import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type BrandRef = { id: string; slug: string; name: string };

export type Viewer = {
  personId: string;
  fullName: string;
  firstName: string;
  email: string;
  // Brands this person leads, and brands they write for.
  leads: BrandRef[];
  writesFor: BrandRef[];
};

// Who is signed in, and what their memberships say they do. This decides what
// the navigation offers. It never decides what data a query returns; row
// level security does that, whatever this function says.
//
// null means "no session". A failed query throws instead, so it shows up as
// an error rather than as a silent trip back to the sign-in page.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const authUserId = claims?.claims.sub;
  if (!authUserId) return null;

  const { data: person, error } = await supabase
    .from("people")
    .select("id, full_name, email, brand_memberships(role, brands(id, slug, name))")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) throw new Error(`Could not load the signed-in person: ${error.message}`);
  if (!person) return null;

  const memberships = person.brand_memberships.flatMap((m) =>
    m.brands ? [{ role: m.role, brand: m.brands }] : [],
  );
  const byName = (a: BrandRef, b: BrandRef) => a.name.localeCompare(b.name);

  return {
    personId: person.id,
    fullName: person.full_name,
    firstName: person.full_name.split(" ")[0],
    email: person.email,
    leads: memberships.filter((m) => m.role === "lead").map((m) => m.brand).sort(byName),
    writesFor: memberships.filter((m) => m.role === "specialist").map((m) => m.brand).sort(byName),
  };
});
