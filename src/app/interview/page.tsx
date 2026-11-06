import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SECTIONS } from "@/lib/sections";
import { InterviewWorkspace } from "./InterviewWorkspace";

const section = SECTIONS[4];

export const metadata: Metadata = { title: section.label };

// Member 3 (kcarrsdsu): interview preparation and practice. Logic: src/services/resume-interview.
export default function Page() {
  return (
    <>
      <PageHeader title={section.label} description={section.description} />
      <InterviewWorkspace />
    </>
  );
}
