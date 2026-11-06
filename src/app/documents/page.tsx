import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SECTIONS } from "@/lib/sections";
import { DocumentsWorkspace } from "./DocumentsWorkspace";

const section = SECTIONS[2];

export const metadata: Metadata = { title: section.label };

// Member 3 (kcarrsdsu): résumé and cover-letter drafts. Logic: src/services/resume-interview.
export default function Page() {
  return (
    <>
      <PageHeader title={section.label} description={section.description} />
      <DocumentsWorkspace />
    </>
  );
}
