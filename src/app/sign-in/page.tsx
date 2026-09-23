import type { Metadata } from "next";
import { signInAs } from "@/lib/auth/actions";
import { demoAccounts } from "@/lib/auth/demo-accounts";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = { title: "Sign in" };

const errors: Record<string, string> = {
  "unknown-account": "That is not one of the demo accounts.",
  "sign-in-failed":
    "Supabase refused the sign-in. Check the local database is running and seeded: npm run db:reset.",
};

type Account = (typeof demoAccounts)[number];

function AccountList({ title, accounts }: { title: string; accounts: Account[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-base-content/50">{title}</h2>
      <ul className="divide-y divide-base-300 overflow-hidden rounded-box border border-base-300 bg-base-100">
        {accounts.map((account) => (
          <li key={account.email}>
            <form action={signInAs}>
              <input type="hidden" name="email" value={account.email} />
              <button
                type="submit"
                className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-base-200"
              >
                <span className="flex-1">
                  <span className="block font-medium">{account.name}</span>
                  <span className="block text-sm text-base-content/60">{account.description}</span>
                </span>
                <span className="text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  Continue →
                </span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? errors[error] : undefined;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-4">
        <Wordmark />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Who are you today?</h1>
          <p className="text-base-content/70">
            Sign-in is stubbed for the demo. Pick a person and you get a real session as them, and the
            database decides what they can see.
          </p>
        </div>
      </header>

      {message && (
        <div role="alert" className="alert alert-error alert-soft">
          {message}
        </div>
      )}

      <AccountList title="Team leads" accounts={demoAccounts.filter((a) => a.role === "Team lead")} />
      <AccountList title="Specialists" accounts={demoAccounts.filter((a) => a.role === "Specialist")} />
    </main>
  );
}
