"use client";

import { useFormStatus } from "react-dom";

// A submit button that says "Saving…" while its form is being sent.
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? "Saving…" : children}
    </button>
  );
}
