import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_INTERNSHIPS } from '../src/data/internships.mock.js';
import { MAYA_PROFILE } from '../src/data/sampleProfile.mock.js';
import { rankInternships, scoreInternship, pickMatchingFields, labelFor, WEIGHTS } from '../src/services/matchingService.js';
import { MATCHING_PROFILE_FIELDS } from '../src/models/schemas.js';

const TODAY = '2026-11-06';
const byId = (id) => MOCK_INTERNSHIPS.find((i) => i.id === id);
const clone = (o) => structuredClone(o);

test('weights add up to 100', () => {
  assert.equal(Object.values(WEIGHTS).reduce((a, b) => a + b, 0), 100);
});

test('score is 0–100 and equals the sum of factor points', () => {
  for (const internship of MOCK_INTERNSHIPS) {
    const m = scoreInternship(MAYA_PROFILE, internship, { today: TODAY });
    assert.ok(m.score >= 0 && m.score <= 100, `${internship.id} score ${m.score}`);
    const sum = Math.round(m.factors.reduce((s, f) => s + f.points, 0));
    assert.equal(m.score, sum);
    for (const f of m.factors) {
      assert.ok(f.points <= f.weight, `${f.key} over weight`);
      assert.ok(f.explanation.length > 0, `${f.key} has no explanation`);
    }
  }
});

test('every score is explained: factors, reasons, matched/missing, next steps', () => {
  const m = scoreInternship(MAYA_PROFILE, byId('mock-001'), { today: TODAY });
  assert.equal(m.factors.length, Object.keys(WEIGHTS).length);
  assert.ok(m.reasons.length > 0);
  assert.ok(m.nextSteps.length > 0);
  assert.ok(m.matchedQualifications.every((q) => q.evidence));
  assert.deepEqual(m.missingQualifications, []);
});

test('Maya ranks the Chicago data analyst role first', () => {
  const ranked = rankInternships(MAYA_PROFILE, MOCK_INTERNSHIPS, { today: TODAY });
  assert.equal(ranked[0].internship.id, 'mock-001');
  assert.equal(ranked[0].match.label, 'Strong match');
});

test('missing qualifications are classified critical / trainable / nice-to-have', () => {
  const m = scoreInternship(MAYA_PROFILE, byId('mock-003'), { today: TODAY });
  const sev = Object.fromEntries(m.missingQualifications.map((q) => [q.label, q.severity]));
  assert.equal(sev['Data structures and algorithms coursework'], 'critical');
  assert.equal(sev['JavaScript or TypeScript'], 'trainable');
  assert.equal(sev['React'], 'nice-to-have');
  assert.ok(m.nextSteps.some((s) => s.includes('stretch application')));
});

test('suggestions never tell the user to claim a skill they lack', () => {
  for (const internship of MOCK_INTERNSHIPS) {
    const m = scoreInternship(MAYA_PROFILE, internship, { today: TODAY });
    for (const q of m.missingQualifications) {
      assert.doesNotMatch(q.suggestion, /\b(just add|claim|pretend|say you have)\b/i);
      if (q.severity === 'trainable') assert.match(q.suggestion, /only add it .* after you've actually done it/i);
    }
  }
});

test('expired listings are marked expired and ranked last', () => {
  const ranked = rankInternships(MAYA_PROFILE, MOCK_INTERNSHIPS, { today: TODAY });
  const expired = ranked.find((r) => r.internship.id === 'mock-010');
  assert.equal(expired.match.eligibility.status, 'expired');
  assert.equal(ranked.at(-1).internship.id, 'mock-010');
});

test('needing sponsorship blocks roles without sponsorship, with an explanation', () => {
  const needsVisa = { ...clone(MAYA_PROFILE), workAuthorization: { authorizedToWork: false, needsSponsorship: true } };
  const blocked = scoreInternship(needsVisa, byId('mock-001'), { today: TODAY });
  assert.equal(blocked.eligibility.status, 'blocked');
  assert.ok(blocked.eligibility.reasons[0].includes('sponsorship'));
  const ok = scoreInternship(needsVisa, byId('mock-003'), { today: TODAY });
  assert.equal(ok.eligibility.status, 'eligible');
  const ranked = rankInternships(needsVisa, MOCK_INTERNSHIPS, { today: TODAY });
  assert.equal(ranked[0].match.eligibility.status, 'eligible');
});

test('remote-only users get zero location points for on-site roles', () => {
  const remote = { ...clone(MAYA_PROFILE), remotePreference: 'remote', preferredLocations: [] };
  const loc = (id) => scoreInternship(remote, byId(id), { today: TODAY }).factors.find((f) => f.key === 'location');
  assert.equal(loc('mock-002').points, 0);
  assert.equal(loc('mock-003').points, WEIGHTS.location);
});

test('compensation below the minimum lowers the score, unlisted pay is flagged', () => {
  const picky = { ...clone(MAYA_PROFILE), minHourlyRate: 30 };
  const comp = (p, id) => scoreInternship(p, byId(id), { today: TODAY }).factors.find((f) => f.key === 'compensation');
  assert.ok(comp(picky, 'mock-002').points < comp(MAYA_PROFILE, 'mock-002').points);
  const unpaid = scoreInternship(MAYA_PROFILE, byId('mock-006'), { today: TODAY });
  assert.ok(unpaid.nextSteps.some((s) => s.includes('Pay is not listed')));
});

test('fairness: name, school, GPA, and unrelated personal fields never change scores', () => {
  const base = rankInternships(MAYA_PROFILE, MOCK_INTERNSHIPS, { today: TODAY }).map((r) => [r.internship.id, r.match.score]);
  const altered = {
    ...clone(MAYA_PROFILE),
    name: 'Someone Else',
    school: 'Different University',
    gpa: 2.1,
    gender: 'any value',
    age: 45,
    ethnicity: 'any value',
  };
  const after = rankInternships(altered, MOCK_INTERNSHIPS, { today: TODAY }).map((r) => [r.internship.id, r.match.score]);
  assert.deepEqual(after, base);
});

test('pickMatchingFields only exposes allow-listed fields', () => {
  const safe = pickMatchingFields({ ...MAYA_PROFILE, gender: 'x', name: 'y' });
  assert.deepEqual(Object.keys(safe).sort(), [...MATCHING_PROFILE_FIELDS].sort());
});

test('a nearly empty profile still scores without crashing', () => {
  const m = scoreInternship({ skills: [] }, byId('mock-001'), { today: TODAY });
  assert.ok(m.score >= 0);
  assert.ok(m.missingQualifications.length > 0);
});

test('labelFor thresholds', () => {
  assert.equal(labelFor(80), 'Strong match');
  assert.equal(labelFor(65), 'Good match');
  assert.equal(labelFor(45), 'Possible match');
  assert.equal(labelFor(10), 'Weak match');
});
