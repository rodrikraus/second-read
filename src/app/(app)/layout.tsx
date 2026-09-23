import { redirect } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { getViewer } from "@/lib/data/viewer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");

  return (
    <>
      <TopBar viewer={viewer} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </>
  );
}
