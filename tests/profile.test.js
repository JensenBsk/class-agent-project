import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProfile, createProfileStore, memoryStorage, reviewProfile } from '../src/services/profileService.js';
import { MAYA_PROFILE } from '../src/data/sampleProfile.mock.js';

const TODAY = '2026-11-06';

test('createProfile cleans form input', () => {
  const p = createProfile({
    name: '  Maya ',
    skills: 'Python, SQL,  , python; Excel',
    gpa: '',
    minHourlyRate: '18',
    remotePreference: 'nonsense',
    workAuthorization: { authorizedToWork: 'true', needsSponsorship: 'false' },
    experience: [{ title: 'Tutor', organization: '', type: 'volunteer', skills: 'tutoring' }, { title: '', organization: '' }],
  });
  assert.equal(p.name, 'Maya');
  assert.deepEqual(p.skills, ['Python', 'SQL', 'Excel']);
  assert.equal(p.gpa, null);
  assert.equal(p.minHourlyRate, 18);
  assert.equal(p.remotePreference, 'any');
  assert.deepEqual(p.workAuthorization, { authorizedToWork: true, needsSponsorship: false });
  assert.equal(p.experience.length, 1);
  assert.deepEqual(p.experience[0].skills, ['tutoring']);
});

test('the Maya demo profile is ready with no questions', () => {
  const r = reviewProfile(MAYA_PROFILE, TODAY);
  assert.equal(r.ready, true);
  assert.deepEqual(r.missing, []);
  assert.deepEqual(r.conflicts, []);
});

test('empty profile asks only the follow-up questions matching needs', () => {
  const r = reviewProfile(createProfile({}), TODAY);
  assert.equal(r.ready, false);
  const fields = r.missing.map((m) => m.field).sort();
  assert.deepEqual(fields, ['major', 'name', 'preferredLocations', 'skills', 'workAuthorization']);
  assert.ok(!fields.includes('gpa'), 'GPA is optional and never demanded');
});

test('remote-only users are not asked for cities', () => {
  const r = reviewProfile(createProfile({ remotePreference: 'remote' }), TODAY);
  assert.ok(!r.missing.some((m) => m.field === 'preferredLocations'));
});

test('invalid values produce errors', () => {
  const r = reviewProfile(createProfile({ ...MAYA_PROFILE, gpa: 5.2, graduationDate: 'May 2028', minHourlyRate: -1 }), TODAY);
  assert.deepEqual(r.errors.map((e) => e.field).sort(), ['gpa', 'graduationDate', 'minHourlyRate']);
  assert.equal(r.ready, false);
});

test('conflicting information is detected', () => {
  const r = reviewProfile(
    createProfile({
      ...MAYA_PROFILE,
      graduationDate: '2024-05',
      remotePreference: 'remote',
      workAuthorization: { authorizedToWork: false, needsSponsorship: false },
    }),
    TODAY,
  );
  assert.deepEqual(r.conflicts.map((c) => c.field).sort(), ['graduationDate', 'remotePreference', 'workAuthorization']);
});

test('store saves, undoes one change, and resets', () => {
  const store = createProfileStore(memoryStorage());
  assert.equal(store.load(), null);
  store.save({ ...MAYA_PROFILE, major: 'A' });
  store.save({ ...MAYA_PROFILE, major: 'B' });
  assert.equal(store.load().major, 'B');
  assert.equal(store.canUndo(), true);
  assert.equal(store.undo().major, 'A');
  assert.equal(store.load().major, 'A');
  assert.equal(store.canUndo(), false);
  store.reset();
  assert.equal(store.load(), null);
});

test('store survives corrupted or blocked storage', () => {
  const corrupted = memoryStorage();
  corrupted.setItem('careerlaunch.profile', '{not json');
  assert.equal(createProfileStore(corrupted).load(), null);

  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() {} };
  const store = createProfileStore(blocked);
  assert.equal(store.load(), null);
  assert.equal(store.save(MAYA_PROFILE), false);
});
