import Link from "next/link";
import type { Viewer } from "@/lib/data/viewer";
import { NavLink } from "@/components/nav-link";
import { UserSwitcher } from "@/components/user-switcher";
import { Wordmark } from "@/components/wordmark";

export function TopBar({ viewer }: { viewer: Viewer }) {
  const isLead = viewer.leads.length > 0;

  return (
    <header className="border-b border-base-300 bg-base-100">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          {isLead && <NavLink href="/review">Review</NavLink>}
          {viewer.leads.map((brand) => (
            <NavLink key={brand.id} href={`/brands/${brand.slug}`}>
              {brand.name}
            </NavLink>
          ))}
          {viewer.writesFor.length > 0 && <NavLink href="/feedback">My feedback</NavLink>}
        </nav>
        <div className="ml-auto">
          <UserSwitcher viewer={viewer} />
        </div>
      </div>
    </header>
  );
}
