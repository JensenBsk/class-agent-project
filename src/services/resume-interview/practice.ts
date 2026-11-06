// Practice-mode feedback. Simple, deterministic checks based on the STAR
// method. It never predicts hiring outcomes (rule R12).

import { getQuestionBank, type QuestionBank } from "./data";
import { normalize, wordCount } from "./text";
import type { AnswerFeedback } from "./types";

type StarPart = keyof AnswerFeedback["starCoverage"];
const PARTS: StarPart[] = ["situation", "task", "action", "result"];

function countWord(text: string, word: string): number {
  return (text.match(new RegExp(`(?<![a-z'])${word}(?![a-z'])`, "g")) ?? []).length;
}

export function givePracticeFeedback(answerText: string, bank: QuestionBank = getQuestionBank()): AnswerFeedback {
  const h = bank.feedbackHeuristics;
  const text = normalize(answerText);
  const words = wordCount(answerText);
  const disclaimer = h.disclaimer;

  if (!words) {
    return {
      starCoverage: { situation: false, task: false, action: false, result: false },
      strengths: [],
      improvements: ["Write an answer first, then ask for feedback."],
      wordCount: 0,
      disclaimer,
    };
  }

  const signals = h.starSignals as Record<StarPart, string[]>;
  const starCoverage = Object.fromEntries(
    PARTS.map((p) => [p, signals[p].some((s) => text.includes(s))]),
  ) as AnswerFeedback["starCoverage"];

  const strengths: string[] = [];
  const improvements: string[] = [];
  for (const p of PARTS) {
    const step = bank.starGuide.steps.find((s) => s.name.toLowerCase() === p)!;
    if (starCoverage[p]) strengths.push(`You covered the ${step.name}.`);
    else improvements.push(`Add the ${step.name}: ${step.prompt}`);
  }

  const { min, max } = bank.starGuide.targetLengthWords;
  let lengthNote: string | undefined;
  for (const rule of h.lengthRules) {
    if ("maxWords" in rule && rule.maxWords !== undefined && words <= rule.maxWords) lengthNote = rule.note;
    if ("minWords" in rule && rule.minWords !== undefined && words >= rule.minWords) lengthNote = rule.note;
  }
  if (!lengthNote && words >= min && words <= max) strengths.push(`Good length (about ${words} words).`);
  else if (!lengthNote) lengthNote = `About ${words} words. Aim for ${min} to ${max}.`;

  const weCount = countWord(text, "we");
  const iCount = countWord(text, "i");
  if (weCount >= 3 && weCount > iCount) improvements.push(h.weakPhrases.find((w) => w.phrase === "we")!.note);
  if (text.includes("i don't know") || text.includes("i dont know")) {
    improvements.push(h.weakPhrases.find((w) => w.phrase === "i don't know")!.note);
  }

  // Safety net for rule R12: feedback must never sound like a hiring prediction.
  const forbidden = h.forbiddenInFeedback.map(normalize);
  const safe = (list: string[]) => list.filter((s) => !forbidden.some((f) => normalize(s).includes(f)));

  return {
    starCoverage,
    strengths: safe(strengths),
    improvements: safe(improvements),
    lengthNote,
    wordCount: words,
    disclaimer,
  };
}
