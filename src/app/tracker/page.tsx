import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/SectionPlaceholder";
import { SECTIONS } from "@/lib/sections";

const section = SECTIONS[3];

export const metadata: Metadata = { title: section.label };

// Member 4: replace SectionPlaceholder with the real feature.
export default function Page() {
  return <SectionPlaceholder section={section} />;
}
