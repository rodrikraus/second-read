"use client";

import { useEffect } from "react";

// Shown once, right after saving. It takes ?saved=1 out of the address bar,
// so reloading the page doesn't show it again.
export function SavedNotice() {
  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  return (
    <p role="status" className="alert alert-success alert-soft text-sm">
      Review saved.
    </p>
  );
}
