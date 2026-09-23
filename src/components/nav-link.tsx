"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-field px-3 py-1.5 transition-colors ${
        active ? "bg-primary/8 font-medium text-primary" : "text-base-content/65 hover:bg-base-200 hover:text-base-content"
      }`}
    >
      {children}
    </Link>
  );
}
