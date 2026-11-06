import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StateMessage } from "@/components/StateMessage";
import { SECTIONS } from "@/lib/sections";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Your internship plan"
        description="Work through these steps in order. You stay in control: nothing is submitted or sent without your approval."
      />

      <section aria-labelledby="next-action-heading" className="card">
        <h2 id="next-action-heading">Next action</h2>
        {/* Member 4: replace with the next-action engine's recommendation. */}
        <StateMessage
          variant="empty"
          title="Start by creating your profile"
          action={
            <Link className="button" href="/profile">
              Create profile
            </Link>
          }
        >
          Once we know your skills and preferences, we can find and rank internships for you.
        </StateMessage>
      </section>

      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading">Steps</h2>
        <ol className="step-list">
          {SECTIONS.map((section) => (
            <li key={section.href}>
              <Link href={section.href} className="step-card">
                <span className="step-card__title">{section.label}</span>
                <span className="step-card__text">{section.description}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
