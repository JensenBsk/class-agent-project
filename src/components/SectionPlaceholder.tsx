import { PageHeader } from "./PageHeader";
import { StateMessage } from "./StateMessage";
import type { Section } from "@/lib/sections";

/**
 * Temporary page body used until the owning member replaces it with the real
 * feature. Delete the import from your page when you start building.
 */
export function SectionPlaceholder({ section }: { section: Section }) {
  return (
    <>
      <PageHeader title={section.label} description={section.description} />
      <StateMessage variant="empty" title="Nothing here yet">
        This section is being built by {section.owner}.
      </StateMessage>
    </>
  );
}
