import Link from "next/link";
import { StateMessage } from "@/components/StateMessage";
import { HomeNextAction } from "@/components/tracker/HomeNextAction";
import { SECTIONS } from "@/lib/sections";
import { Welcome } from "./_home/Welcome";

export default function HomePage() {
  return (
    <>
      <Welcome />

      <h2 className="home-plan-title">Your internship plan</h2>
      <p className="page-header__lead">
        Work through these steps in order. You stay in control: nothing is submitted or sent without your approval.
      </p>

      <section aria-labelledby="next-action-heading" className="card">
        <h2 id="next-action-heading">Next action</h2>
        {/* Member 4: the tracker's top recommendation, or the fallback below if nothing is tracked yet. */}
        <HomeNextAction
          fallback={
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
          }
        />
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
