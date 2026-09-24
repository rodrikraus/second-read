import { DismissibleDetails } from "@/components/dismissible-details";
import { demoAccounts } from "@/lib/auth/demo-accounts";
import { signInAs, signOut } from "@/lib/auth/actions";
import type { Viewer } from "@/lib/data/viewer";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

// What the database says this person does, not what the demo list claims.
function describe(viewer: Viewer) {
  if (viewer.leads.length > 0) return `Lead · ${viewer.leads.map((b) => b.name).join(", ")}`;
  return `Specialist · ${viewer.writesFor.map((b) => b.name).join(", ")}`;
}

export function UserSwitcher({ viewer }: { viewer: Viewer }) {
  return (
    <DismissibleDetails className="dropdown dropdown-end">
      <summary
        aria-label={`Account menu: ${viewer.fullName}`}
        className="flex cursor-pointer list-none items-center gap-3 rounded-field px-2 py-1 hover:bg-base-200"
      >
        <span className="grid size-8 place-items-center rounded-full bg-neutral text-xs font-semibold text-neutral-content">
          {initials(viewer.fullName)}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium">{viewer.fullName}</span>
          <span className="block text-xs text-base-content/60">{describe(viewer)}</span>
        </span>
        <svg viewBox="0 0 16 16" className="size-4 text-base-content/50" aria-hidden="true">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </summary>

      <div className="dropdown-content z-20 mt-2 w-80 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
        <p className="px-3 pt-2 pb-1 text-xs font-medium uppercase tracking-wide text-base-content/50">
          View as
        </p>
        <ul>
          {demoAccounts.map((account) => {
            const current = account.email === viewer.email;
            return (
              <li key={account.email}>
                <form action={signInAs}>
                  <input type="hidden" name="email" value={account.email} />
                  <button
                    type="submit"
                    disabled={current}
                    className="flex w-full items-baseline justify-between gap-3 rounded-field px-3 py-2 text-left hover:bg-base-200 disabled:cursor-default disabled:bg-base-200"
                  >
                    <span className="text-sm font-medium">{account.name}</span>
                    <span className="text-xs text-base-content/60">{current ? "You" : account.role}</span>
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 border-t border-base-300 pt-1">
          <form action={signOut}>
            <button type="submit" className="w-full rounded-field px-3 py-2 text-left text-sm text-base-content/70 hover:bg-base-200">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </DismissibleDetails>
  );
}
