import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/SectionPlaceholder";
import { SECTIONS } from "@/lib/sections";

const section = SECTIONS[4];

export const metadata: Metadata = { title: section.label };

// Member 3: replace SectionPlaceholder with the real feature.
export default function Page() {
  return <SectionPlaceholder section={section} />;
}
