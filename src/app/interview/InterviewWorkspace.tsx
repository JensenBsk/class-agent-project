"use client";

// Member 3 (kcarrsdsu): interview preparation and practice mode.
// Logic lives in src/services/resume-interview; this file is only the UI.

import { useEffect, useMemo, useRef, useState } from "react";
import { AgentActivityLog } from "@/agents/tracker";
import { MockDataLabel } from "@/components/Labels";
import { StateMessage } from "@/components/StateMessage";
import {
  buildInterviewPlan,
  getQuestionBank,
  givePracticeFeedback,
  type InterviewPlanRecord,
  type PracticeAnswer,
  type QuestionDetail,
} from "@/services/resume-interview";
import { InternshipPicker, styles, useDemoContext } from "../_resume-interview/shared";

const STAR_PARTS = [
  ["situation", "Situation"],
  ["task", "Task"],
  ["action", "Action"],
  ["result", "Result"],
] as const;

export function InterviewWorkspace() {
  const ctx = useDemoContext();
  const { profile, internship, ready } = ctx;
  const log = useRef(new AgentActivityLog()).current;
  const bank = useMemo(() => getQuestionBank(), []);
  const [plan, setPlan] = useState<InterviewPlanRecord | null>(null);

  useEffect(() => {
    if (!ready) return;
    const next = buildInterviewPlan(profile, internship, { bank });
    const task = log.startTask(profile.id, "prepare_interview", `Prepared interview questions for ${internship.title}`, next.id);
    log.completeTask(profile.id, task.id);
    setPlan(next);
  }, [ready, profile, internship, bank, log]);

  if (!ready || !plan || plan.internshipId !== internship.id) {
    return <StateMessage variant="loading" title="Preparing your interview plan…" />;
  }

  const byType = (type: QuestionDetail["type"]) => plan.questionDetails.filter((q) => q.type === type);

  return (
    <>
      <InternshipPicker ctx={ctx} id="interview-internship" />

      <section className="card" aria-labelledby="company-heading">
        <h2 id="company-heading">About the company</h2>
        <p>
          {plan.companySummaryIsMock ? <MockDataLabel /> : null} {plan.companySummary}
        </p>
        <p className={`${styles.small} ${styles.muted}`}>{plan.companySummaryDisclaimer}</p>
      </section>

      <section className="card" aria-labelledby="star-heading">
        <h2 id="star-heading">How to answer: the STAR method</h2>
        <p>{bank.starGuide.summary}</p>
        <dl className={styles.star}>
          {bank.starGuide.steps.map((s) => (
            <div key={s.letter}>
              <dt>
                {s.letter} — {s.name}
              </dt>
              <dd>
                {s.prompt} <span className={styles.muted}>{s.tip}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card" aria-labelledby="behavioral-heading">
        <h2 id="behavioral-heading">Behavioral questions</h2>
        <p className={`${styles.small} ${styles.muted}`}>
          Talking points are built only from your real experience. You fill in the result.
        </p>
        <ul className={styles.plainList}>
          {byType("behavioral").map((q) => {
            const star = plan.starDetails.find((s) => s.question === q.text);
            return (
              <li key={q.text} className={styles.item}>
                <p>
                  <strong>{q.text}</strong>
                </p>
                <p className={`${styles.small} ${styles.muted}`}>Why they ask: {q.whyAsked}</p>
                {star ? (
                  <details className={styles.details}>
                    <summary>Talking points: {star.experienceLabel}</summary>
                    <dl className={styles.star}>
                      <dt>Situation</dt>
                      <dd>{star.situation}</dd>
                      <dt>Task</dt>
                      <dd>{star.task}</dd>
                      <dt>Action</dt>
                      <dd>{star.action}</dd>
                      <dt>Result</dt>
                      <dd>{star.result}</dd>
                    </dl>
                  </details>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card" aria-labelledby="technical-heading">
        <h2 id="technical-heading">Technical and skill questions</h2>
        <ul className={styles.plainList}>
          {byType("technical").map((q) => (
            <li key={q.text} className={styles.item}>
              <p>
                <strong>{q.text}</strong>{" "}
                {q.isGap ? <span className={`${styles.badge} ${styles.badgeWarning}`}>Skill you&apos;re still building</span> : null}
              </p>
              <p className={`${styles.small} ${styles.muted}`}>
                {q.relatedRequirement ? `From the listing: ${q.relatedRequirement}. ` : ""}
                {q.whyAsked}
              </p>
              {q.isGap ? <p className={styles.quote}>{plan.gapAnswerTip}</p> : null}
            </li>
          ))}
        </ul>
        {byType("technical").length === 0 ? (
          <StateMessage variant="empty" title="No skill questions for this listing" />
        ) : null}
      </section>

      <section className="card" aria-labelledby="role-heading">
        <h2 id="role-heading">Questions about you and the role</h2>
        <ul className={styles.list}>
          {byType("role").map((q) => (
            <li key={q.text}>
              {q.text} <span className={`${styles.small} ${styles.muted}`}>{q.whyAsked}</span>
            </li>
          ))}
        </ul>
      </section>

      <Practice key={internship.id} plan={plan} />

      <section className="card" aria-labelledby="ask-heading">
        <h2 id="ask-heading">Questions you can ask them</h2>
        <ul className={styles.list}>
          {plan.questionsToAsk.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Practice({ plan }: { plan: InterviewPlanRecord }) {
  const questions = plan.questionDetails.filter((q) => q.type !== "role" || q.bankId === "rq-1");
  const [question, setQuestion] = useState(questions[0]?.text ?? "");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<PracticeAnswer[]>([]);
  const latest = history[0];

  const submit = () => {
    const feedback = givePracticeFeedback(answer);
    setHistory((h) => [{ question, answerText: answer, feedback, answeredAt: new Date().toISOString() }, ...h]);
  };

  return (
    <section className="card" aria-labelledby="practice-heading">
      <h2 id="practice-heading">Practice mode</h2>
      <p className={`${styles.small} ${styles.muted}`}>
        Type an answer and get feedback on its structure. Your answers stay on this page.
      </p>
      <div className={styles.field}>
        <label htmlFor="practice-question">Question</label>
        <select
          id="practice-question"
          className={styles.select}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        >
          {questions.map((q) => (
            <option key={q.text} value={q.text}>
              {q.text}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field} style={{ marginTop: "var(--space-3)" }}>
        <label htmlFor="practice-answer">Your answer</label>
        <textarea
          id="practice-answer"
          className={styles.textarea}
          style={{ minHeight: "10rem", fontFamily: "inherit", fontSize: "1rem" }}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>
      <div className={styles.actions}>
        <button type="button" className="button" disabled={!answer.trim()} onClick={submit}>
          Get feedback
        </button>
      </div>

      {latest ? (
        <div aria-live="polite" style={{ marginTop: "var(--space-4)" }}>
          <h3>Feedback</h3>
          <ul className={styles.check} aria-label="STAR parts covered">
            {STAR_PARTS.map(([key, label]) => (
              <li key={key} data-ok={latest.feedback.starCoverage[key]}>
                {latest.feedback.starCoverage[key] ? "✓" : "○"} {label}
                <span className={styles.srOnly}>{latest.feedback.starCoverage[key] ? " covered" : " missing"}</span>
              </li>
            ))}
          </ul>
          {latest.feedback.strengths.length ? (
            <>
              <h4>What worked</h4>
              <ul className={styles.list}>
                {latest.feedback.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          ) : null}
          {latest.feedback.improvements.length || latest.feedback.lengthNote ? (
            <>
              <h4>To improve</h4>
              <ul className={styles.list}>
                {latest.feedback.lengthNote ? <li>{latest.feedback.lengthNote}</li> : null}
                {latest.feedback.improvements.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          ) : null}
          <p className={`${styles.small} ${styles.muted}`}>{latest.feedback.disclaimer}</p>
        </div>
      ) : null}

      {history.length > 1 ? (
        <details className={styles.details}>
          <summary>Earlier answers ({history.length - 1})</summary>
          <ul className={styles.list}>
            {history.slice(1).map((h) => (
              <li key={h.answeredAt} className={styles.small}>
                <strong>{h.question}</strong> — {h.feedback.wordCount} words,{" "}
                {STAR_PARTS.filter(([k]) => h.feedback.starCoverage[k]).length}/4 STAR parts
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
