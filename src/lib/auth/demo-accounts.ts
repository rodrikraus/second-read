// Authentication is stubbed: anyone may pick anyone on this list. The list
// only says who can be picked. What each person can see is decided by
// brand_memberships and row level security, and the descriptions below are
// there to help you choose, nothing reads them.
export const demoAccounts = [
  {
    email: "marta@second-read.test",
    name: "Marta Ruiz",
    role: "Team lead",
    description: "Leads Voltra and Boxwell. Starts the day with the review queue.",
  },
  {
    email: "nuria@second-read.test",
    name: "Nuria Campos",
    role: "Team lead",
    description: "Leads Oddbird Coffee.",
  },
  {
    email: "dani@second-read.test",
    name: "Dani Ortega",
    role: "Specialist",
    description: "Writes for Voltra (Marta) and Oddbird (Nuria).",
  },
  {
    email: "sofia@second-read.test",
    name: "Sofía Méndez",
    role: "Specialist",
    description: "Writes for Voltra and Boxwell.",
  },
  {
    email: "leo@second-read.test",
    name: "Leo Varela",
    role: "Specialist",
    description: "Writes for Boxwell (Marta) and Oddbird (Nuria).",
  },
] as const;

export function isDemoAccount(email: string): boolean {
  return demoAccounts.some((account) => account.email === email);
}
