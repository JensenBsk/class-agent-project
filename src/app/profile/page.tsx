import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SECTIONS } from "@/lib/sections";
import { ProfileForm } from "./ProfileForm";

const section = SECTIONS[0];

export const metadata: Metadata = { title: section.label };

// Member 2: profile creation (brief Stage 1).
export default function Page() {
  return (
    <>
      <PageHeader title="Your profile" description={section.description} />
      <ProfileForm />
    </>
  );
}
