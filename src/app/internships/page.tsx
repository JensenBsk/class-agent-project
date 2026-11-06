import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/SectionPlaceholder";
import { SECTIONS } from "@/lib/sections";

const section = SECTIONS[1];

export const metadata: Metadata = { title: section.label };

// Member 2: replace SectionPlaceholder with the real feature.
export default function Page() {
  return <SectionPlaceholder section={section} />;
}
