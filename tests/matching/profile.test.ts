import { describe, expect, it } from "vitest";
import {
  STORAGE_KEYS,
  createProfileStore,
  demoProfile,
  memoryStorage,
  normalizeProfile,
  normalizeWorkAuthorization,
  reviewProfile,
} from "@/services/matching/profile";

const TODAY = new Date("2026-11-06T12:00:00Z");

describe("normalizeProfile", () => {
  it("cleans form input into the shared UserProfile shape", () => {
    const p = normalizeProfile(
      {
        name: "  Maya ",
        skills: "Python, SQL,  , python; Excel",
        gpa: "",
        salaryExpectation: "18",
        remotePreference: "nonsense",
        workAuthorization: { authorizedToWork: "true", needsSponsorship: "false" },
        experience: [{ title: "Tutor", organization: "", type: "volunteer", skills: "tutoring" }, { title: "", organization: "" }],
      },
      TODAY,
    );
    expect(p.name).toBe("Maya");
    expect(p.skills).toEqual(["Python", "SQL", "Excel"]);
    expect(p).not.toHaveProperty("gpa");
    expect(p.salaryExpectation).toBe(18);
    expect(p.remotePreference).toBe("no_preference");
    expect(p.workAuthorization).toEqual({ authorizedToWork: true, needsSponsorship: false });
    expect(p.experience).toEqual([{ type: "volunteer", title: "Tutor", organization: "", skills: ["tutoring"] }]);
    expect(p.createdAt).toBe(TODAY.toISOString());
  });

  it("reads work authorization written as a sentence", () => {
    expect(normalizeWorkAuthorization("Authorized to work in the US")).toEqual({ authorizedToWork: true, needsSponsorship: false });
    expect(normalizeWorkAuthorization("I will need visa sponsorship")).toEqual({ authorizedToWork: null, needsSponsorship: true });
    expect(normalizeWorkAuthorization("I do not need sponsorship")).toEqual({ authorizedToWork: null, needsSponsorship: false });
    expect(normalizeWorkAuthorization("")).toEqual({ authorizedToWork: null, needsSponsorship: null });
  });
});

describe("demoProfile (Member 3's Maya)", () => {
  it("is the one demo user and is ready to match with no questions", () => {
    const maya = demoProfile(TODAY);
    expect(maya.id).toBe("mock-profile-maya");
    expect(maya.name).toBe("Maya Rivera");
    expect(maya).not.toHaveProperty("gpa");
    const review = reviewProfile(maya, TODAY);
    expect(review).toMatchObject({ ready: true, errors: [], missing: [], conflicts: [] });
  });
});

describe("reviewProfile", () => {
  it("asks only the follow-up questions matching needs", () => {
    const r = reviewProfile(normalizeProfile({}, TODAY), TODAY);
    expect(r.ready).toBe(false);
    expect(r.missing.map((m) => m.field).sort()).toEqual(["major", "name", "preferredLocations", "skills", "workAuthorization"]);
  });
  it("doesn't ask remote-only users for cities", () => {
    const r = reviewProfile(normalizeProfile({ remotePreference: "remote" }, TODAY), TODAY);
    expect(r.missing.some((m) => m.field === "preferredLocations")).toBe(false);
  });
  it("reports invalid values as errors", () => {
    const r = reviewProfile(normalizeProfile({ ...demoProfile(TODAY), gpa: 5.2, graduationDate: "May 2028", salaryExpectation: -1 }, TODAY), TODAY);
    expect(r.errors.map((e) => e.field).sort()).toEqual(["gpa", "graduationDate", "salaryExpectation"]);
    expect(r.ready).toBe(false);
  });
  it("detects conflicting answers", () => {
    const r = reviewProfile(
      normalizeProfile(
        { ...demoProfile(TODAY), graduationDate: "2024-05-15", remotePreference: "remote", workAuthorization: { authorizedToWork: false, needsSponsorship: false } },
        TODAY,
      ),
      TODAY,
    );
    expect(r.conflicts.map((c) => c.field).sort()).toEqual(["graduationDate", "remotePreference", "workAuthorization"]);
  });
});

describe("createProfileStore", () => {
  it("saves, undoes one change, and deletes everything including the selection", () => {
    const storage = memoryStorage();
    const store = createProfileStore(storage);
    expect(store.load()).toBeNull();
    store.save({ ...demoProfile(TODAY), major: "A" });
    store.save({ ...demoProfile(TODAY), major: "B" });
    expect(store.load()?.major).toBe("B");
    expect(store.undo()?.major).toBe("A");
    expect(store.load()?.major).toBe("A");
    expect(store.canUndo()).toBe(false);
    storage.setItem(STORAGE_KEYS.selectedInternshipId, "mock-int-001");
    store.reset();
    expect(store.load()).toBeNull();
    expect(storage.getItem(STORAGE_KEYS.selectedInternshipId)).toBeNull();
  });

  it("survives corrupted or blocked storage", () => {
    const corrupted = memoryStorage();
    corrupted.setItem(STORAGE_KEYS.profile, "{not json");
    expect(createProfileStore(corrupted).load()).toBeNull();

    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {},
    };
    const store = createProfileStore(blocked);
    expect(store.load()).toBeNull();
    expect(store.save(demoProfile(TODAY))).toBe(false);
  });

  it("re-normalizes old or partial saved data instead of crashing", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEYS.profile, JSON.stringify({ id: "x", name: "Old", remotePreference: "any" }));
    const p = createProfileStore(storage).load();
    expect(p?.skills).toEqual([]);
    expect(p?.remotePreference).toBe("no_preference");
  });
});
