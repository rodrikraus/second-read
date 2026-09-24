import { redirect } from "next/navigation";
import { getViewer } from "@/lib/data/viewer";

// Leads start at the review queue, specialists at their own feedback.
export default async function Home() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");

  redirect(viewer.leads.length > 0 ? "/review" : "/feedback");
}
