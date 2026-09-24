import type { CSSProperties } from "react";

// A stable hue per brand, computed from its slug, so a new brand needs no
// design work. Kept between green and magenta (150 to 330): red, orange and
// amber belong to scores and severity, and a brand must never look like a warning.
function brandHue(slug: string): number {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 150 + (hash % 180);
}

export function BrandChip({ slug, name }: { slug: string; name: string }) {
  return (
    <span
      style={{ "--brand-hue": brandHue(slug) } as CSSProperties}
      className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(95%_0.03_var(--brand-hue))] px-2 py-0.5 text-xs font-medium text-[oklch(36%_0.08_var(--brand-hue))]"
    >
      <span className="size-1.5 rounded-full bg-[oklch(55%_0.13_var(--brand-hue))]" aria-hidden="true" />
      {name}
    </span>
  );
}
