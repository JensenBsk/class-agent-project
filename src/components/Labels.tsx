/**
 * Trust labels required by the brief. Use them anywhere mock data or
 * AI-generated text is shown.
 *   - Internship.isMock === true        -> <MockDataLabel />
 *   - ResumeDraft/CoverLetterDraft.isAiGenerated === true -> <AiGeneratedLabel />
 */

export function MockDataLabel() {
  return (
    <span className="label label--mock" title="This is sample data, not a real listing.">
      Mock data
    </span>
  );
}

export function AiGeneratedLabel() {
  return (
    <span className="label label--ai" title="Written by the AI. Review it before you use it.">
      AI-generated: review before use
    </span>
  );
}
