import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SECTIONS } from "@/lib/sections";
import { InternshipsView } from "./InternshipsView";

const section = SECTIONS[1];

export const metadata: Metadata = { title: section.label };

// Member 2: internship discovery + explainable ranking (brief Stages 2–3).
export default function Page() {
  return (
    <>
      <PageHeader
        title="Ranked internships"
        description="Every score is explained: what you already meet, what's missing, and what to do next. All listings here are fictional mock data."
      />
      <InternshipsView />
    </>
  );
}
