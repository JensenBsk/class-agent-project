import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { TrackerView } from "@/components/tracker/TrackerView";
import { SECTIONS } from "@/lib/sections";

const section = SECTIONS[3];

export const metadata: Metadata = { title: section.label };

// Member 4 (BadoGoat1): application tracker, next actions, reminders, approvals.
export default function Page() {
  return (
    <>
      <PageHeader
        title="Application tracker"
        description="Track deadlines, statuses and follow-ups. CareerLaunch suggests what to do next, and asks before doing anything for you."
      />
      <TrackerView />
    </>
  );
}
