// Member 3: draft approval and export, using Member 4's approval gate (spec tests T8–T10, T12).
import { describe, expect, it } from "vitest";
import { AgentActivityLog, ApprovalRequiredError } from "@/agents/tracker";
import {
  approvalActionText,
  approveDraft,
  confirmFlag,
  DraftApprovalError,
  editDraft,
  exportDraft,
  generateResumeDraft,
  getDemoProfile,
  getMockInternships,
  rejectDraft,
} from "@/services/resume-interview";

const maya = getDemoProfile();
const [brightline] = getMockInternships("2026-11-06");

function setup() {
  const log = new AgentActivityLog();
  const draft = generateResumeDraft(maya, brightline);
  const ask = (d = draft, action = approvalActionText(d, brightline)) => {
    const task = log.startTask(maya.id, "draft_resume", `Drafted a résumé for ${brightline.title}`, d.id);
    return log.requestApproval(maya.id, task.id, action, { relatedId: d.id, relatedVersion: d.version });
  };
  return { log, draft, ask };
}

describe("approving drafts", () => {
  it("approves only after the student approves the request", async () => {
    const { log, draft, ask } = setup();
    const req = ask();
    expect(req.action).toBe("Approve résumé draft v1 for Data Analyst Intern at Brightline Analytics (fictional)");
    log.approve(maya.id, req.id);
    const approved = await approveDraft(draft, { log, userProfileId: maya.id, requestId: req.id });
    expect(approved.status).toBe("approved");
    expect(draft.status).toBe("draft");
  });

  it("T8: a pending blocking flag stops approval, even with an approved request", async () => {
    const { log, draft, ask } = setup();
    const blocked = editDraft(draft, `${draft.content}\n- Tutored [X] students`, { profile: maya });
    const req = ask(blocked);
    log.approve(maya.id, req.id);
    await expect(approveDraft(blocked, { log, userProfileId: maya.id, requestId: req.id })).rejects.toThrow(
      DraftApprovalError,
    );
  });

  it("T9: the agent can't approve on its own: a pending or missing request is refused", async () => {
    const { log, draft, ask } = setup();
    const req = ask();
    await expect(approveDraft(draft, { log, userProfileId: maya.id, requestId: req.id })).rejects.toThrow(
      ApprovalRequiredError,
    );
    await expect(approveDraft(draft, { log, userProfileId: maya.id, requestId: undefined })).rejects.toThrow(
      ApprovalRequiredError,
    );
  });

  it("T9: an approval for version 1 doesn't approve version 2", async () => {
    const { log, draft, ask } = setup();
    const req = ask(draft);
    log.approve(maya.id, req.id);
    const v2 = editDraft(draft, draft.content.replace("Train new baristas", "Trained new baristas"), {
      profile: maya,
    });
    await expect(approveDraft(v2, { log, userProfileId: maya.id, requestId: req.id })).rejects.toThrow(
      ApprovalRequiredError,
    );
  });

  it("T10: editing an approved draft makes a new version and keeps the old one", async () => {
    const { log, draft, ask } = setup();
    const req = ask();
    log.approve(maya.id, req.id);
    const approved = await approveDraft(draft, { log, userProfileId: maya.id, requestId: req.id });
    const resumeBefore = maya.resumeText;

    const v2 = editDraft(approved, approved.content.replace("Train new baristas", "Trained new baristas"), {
      profile: maya,
    });
    expect(v2.version).toBe(2);
    expect(v2.status).toBe("draft");
    expect(approved.status).toBe("approved");
    expect(approved.content).not.toContain("Trained new baristas");
    expect(maya.resumeText).toBe(resumeBefore);
  });

  it("a confirmed claim is labeled confirmed by the student and no longer blocks", async () => {
    const { log, draft, ask } = setup();
    const edited = editDraft(draft, draft.content.replace("Train new baristas", "Trained 3 new baristas"), {
      profile: maya,
    });
    // "3" appears in Maya's profile ("3 days a week"), so pick a number that doesn't.
    const withNew = editDraft(edited, edited.content.replace("Trained 3", "Trained 12"), { profile: maya });
    const flag = withNew.verificationFlags.find((f) => f.claim === "12")!;
    const confirmed = confirmFlag(withNew, flag.id);
    expect(confirmed.verificationFlags.find((f) => f.id === flag.id)!.resolution).toBe("confirmed_by_user");
    expect(confirmed.claimsToVerify).not.toContain("12");

    const req = ask(confirmed);
    log.approve(maya.id, req.id);
    await expect(approveDraft(confirmed, { log, userProfileId: maya.id, requestId: req.id })).resolves.toMatchObject({
      status: "approved",
    });
  });

  it("placeholders can't be confirmed away", () => {
    const { draft } = setup();
    const edited = editDraft(draft, `${draft.content}\n- Tutored [X] students`, { profile: maya });
    const flag = edited.verificationFlags.find((f) => f.reason === "metric_placeholder")!;
    expect(() => confirmFlag(edited, flag.id)).toThrow(/placeholder/);
  });

  it("the student can reject a draft", () => {
    const { draft } = setup();
    expect(rejectDraft(draft).status).toBe("rejected");
  });
});

describe("T12: exporting", () => {
  it("copying needs an approved draft AND its own approval, used once", async () => {
    const { log, draft, ask } = setup();
    const copy = (text: string) => text.length;
    await expect(exportDraft(draft, { log, userProfileId: maya.id, requestId: undefined }, copy)).rejects.toThrow(
      DraftApprovalError,
    );

    const approveReq = ask();
    log.approve(maya.id, approveReq.id);
    const approved = await approveDraft(draft, { log, userProfileId: maya.id, requestId: approveReq.id });

    await expect(exportDraft(approved, { log, userProfileId: maya.id, requestId: undefined }, copy)).rejects.toThrow(
      ApprovalRequiredError,
    );

    const exportReq = ask(approved, "Copy approved résumé v1 to your clipboard");
    log.approve(maya.id, exportReq.id);
    await expect(
      exportDraft(approved, { log, userProfileId: maya.id, requestId: exportReq.id }, copy),
    ).resolves.toBe(approved.content.length);
    await expect(
      exportDraft(approved, { log, userProfileId: maya.id, requestId: exportReq.id }, copy),
    ).rejects.toThrow(/already used/);
  });
});
