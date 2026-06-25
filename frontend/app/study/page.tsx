import { redirect } from "next/navigation";

// The placeholder TFT Study shell is superseded by the fundamentals-first
// /learn experience. Keep the old route working for any saved links.
export default function StudyPage() {
  redirect("/learn");
}
