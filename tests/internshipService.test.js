import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_INTERNSHIPS } from '../src/data/internships.mock.js';
import { createInternshipService, dedupeInternships, filterInternships } from '../src/services/internshipService.js';

const TODAY = '2026-11-06';

test('every mock listing has the fields the brief requires and is labeled mock', () => {
  const fields = ['company', 'title', 'location', 'workMode', 'requiredQualifications', 'preferredQualifications',
    'deadline', 'applicationUrl', 'industry', 'description', 'source', 'lastChecked'];
  for (const i of MOCK_INTERNSHIPS) {
    for (const f of fields) assert.ok(i[f] !== undefined, `${i.id} missing ${f}`);
    assert.ok('compensation' in i, `${i.id} missing compensation (null allowed)`);
    assert.equal(i.isMock, true);
    assert.match(i.source, /MOCK/);
    assert.match(i.company, /\(fictional\)/);
    assert.match(i.applicationUrl, /^https:\/\/example\.com\//);
  }
});

test('duplicates are removed, keeping the most recently checked copy', () => {
  const { internships, removed } = dedupeInternships(MOCK_INTERNSHIPS);
  assert.equal(internships.length, MOCK_INTERNSHIPS.length - 1);
  assert.deepEqual(removed, [{ kept: 'mock-001', removed: 'mock-011' }]);
});

test('expired listings are hidden by default and shown when asked', () => {
  assert.ok(!filterInternships(MOCK_INTERNSHIPS, { today: TODAY }).some((i) => i.id === 'mock-010'));
  assert.ok(filterInternships(MOCK_INTERNSHIPS, { today: TODAY, includeExpired: true }).some((i) => i.id === 'mock-010'));
});

test('filters: query, industry, work mode, location, paid only', () => {
  const ids = (f) => filterInternships(MOCK_INTERNSHIPS, { today: TODAY, ...f }).map((i) => i.id);
  assert.ok(ids({ query: 'dashboard' }).includes('mock-001'));
  assert.deepEqual(ids({ industry: 'healthcare' }), ['mock-002']);
  assert.ok(ids({ workMode: 'remote' }).every((id) => ['mock-003', 'mock-005'].includes(id)));
  const chicago = ids({ location: 'Chicago' });
  assert.ok(chicago.includes('mock-001') && chicago.includes('mock-003'), 'remote roles count for any location');
  assert.ok(!chicago.includes('mock-009'));
  assert.ok(!ids({ paidOnly: true }).includes('mock-006'));
  assert.deepEqual(ids({ query: 'zzz-no-match' }), []);
});

test('service search returns deduped results and the duplicate count', async () => {
  const service = createInternshipService();
  const { internships, duplicatesRemoved } = await service.search({ today: TODAY, includeExpired: true });
  assert.equal(duplicatesRemoved, 1);
  assert.equal(new Set(internships.map((i) => i.id)).size, internships.length);
  assert.equal(service.isMock, true);
  assert.equal((await service.getById('mock-002')).title, 'Healthcare Operations Intern');
  assert.equal(await service.getById('nope'), null);
});

test('a broken data source surfaces a clear error', async () => {
  const service = createInternshipService({ name: 'Broken', listInternships: async () => 'oops' });
  await assert.rejects(service.search(), /invalid data/);
});

test('a replacement data source can be swapped in', async () => {
  const fake = { ...MOCK_INTERNSHIPS[0], id: 'api-1', company: 'API Co (fictional)' };
  const service = createInternshipService({ name: 'Fake API', listInternships: async () => [fake] });
  const { internships } = await service.search({ today: TODAY });
  assert.deepEqual(internships.map((i) => i.id), ['api-1']);
});
