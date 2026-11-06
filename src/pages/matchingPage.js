/**
 * Profile + matching page controller (Member 2).
 *
 * Integration points for other workstreams:
 * - Selected internship id is saved to localStorage key SELECTED_KEY and a
 *   `careerlaunch:internship-selected` event is fired on window with
 *   detail {internship, match}. Member 3 (résumé) and Member 4 (tracker)
 *   can listen for it.
 * - The saved profile lives under 'careerlaunch.profile' (profileService).
 */
import { MAYA_PROFILE } from '../data/sampleProfile.mock.js';
import { createInternshipService } from '../services/internshipService.js';
import { rankInternships } from '../services/matchingService.js';
import { createProfile, createProfileStore, memoryStorage, reviewProfile } from '../services/profileService.js';
import { escapeHtml as esc } from '../utils/text.js';

export const SELECTED_KEY = 'careerlaunch.selectedInternshipId';

const storage = (() => {
  try {
    window.localStorage.setItem('careerlaunch.test', '1');
    window.localStorage.removeItem('careerlaunch.test');
    return window.localStorage;
  } catch {
    return memoryStorage(); // private mode / blocked storage
  }
})();

const store = createProfileStore(storage);
const service = createInternshipService();
const $ = (sel) => document.querySelector(sel);
const form = $('#profile-form');

let profile = store.load();
let ranked = [];
let selectedId = safeGet(SELECTED_KEY);

function safeGet(key) {
  try { return storage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { value === null ? storage.removeItem(key) : storage.setItem(key, value); } catch { /* ignore */ }
}

/* ---------- confirm dialog (approval before destructive actions) ---------- */
function confirmAction(message) {
  const dialog = $('#confirm-dialog');
  $('#confirm-message').textContent = message;
  if (typeof dialog.showModal !== 'function') return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
    dialog.showModal();
  });
}

/* ---------- experience rows ---------- */
function addExperienceRow(exp = {}) {
  const row = document.createElement('div');
  row.className = 'exp-row';
  row.innerHTML = `
    <label>Title<input data-k="title" value="${esc(exp.title)}"></label>
    <label>Organization<input data-k="organization" value="${esc(exp.organization)}"></label>
    <label>Type
      <select data-k="type">
        ${['work', 'volunteer', 'project'].map((t) => `<option ${exp.type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    </label>
    <label>Skills used<input data-k="skills" value="${esc((exp.skills ?? []).join(', '))}"></label>
    <label>Description<input data-k="description" value="${esc(exp.description)}"></label>
    <button type="button" class="danger remove-exp" aria-label="Remove this experience">Remove</button>`;
  row.querySelector('.remove-exp').addEventListener('click', () => row.remove());
  $('#experience-list').append(row);
}

/* ---------- form <-> profile ---------- */
function readForm() {
  const v = (name) => form.elements[name].value;
  const experience = [...document.querySelectorAll('.exp-row')].map((row) => {
    const get = (k) => row.querySelector(`[data-k="${k}"]`).value;
    return { title: get('title'), organization: get('organization'), type: get('type'), skills: get('skills'), description: get('description') };
  });
  return createProfile({
    id: profile?.id,
    name: v('name'), school: v('school'), major: v('major'), graduationDate: v('graduationDate'), gpa: v('gpa'),
    skills: v('skills'), experience,
    preferredIndustries: v('preferredIndustries'), preferredLocations: v('preferredLocations'),
    remotePreference: v('remotePreference'), minHourlyRate: v('minHourlyRate'), availability: v('availability'),
    workAuthorization: { needsSponsorship: v('needsSponsorship'), authorizedToWork: v('authorizedToWork') },
    careerGoals: v('careerGoals'), resumeText: v('resumeText'),
  });
}

function fillForm(p) {
  form.reset();
  $('#experience-list').innerHTML = '';
  if (!p) return;
  const set = (name, value) => { form.elements[name].value = value ?? ''; };
  ['name', 'school', 'major', 'graduationDate', 'availability', 'careerGoals', 'resumeText', 'remotePreference'].forEach((k) => set(k, p[k]));
  set('gpa', p.gpa);
  set('minHourlyRate', p.minHourlyRate);
  set('skills', p.skills.join(', '));
  set('preferredIndustries', p.preferredIndustries.join(', '));
  set('preferredLocations', p.preferredLocations.join(', '));
  set('needsSponsorship', p.workAuthorization.needsSponsorship ?? '');
  set('authorizedToWork', p.workAuthorization.authorizedToWork ?? '');
  p.experience.forEach(addExperienceRow);
}

/* ---------- profile review ---------- */
function renderReview(review, saved) {
  const box = $('#profile-review');
  const list = (items, key) => `<ul>${items.map((i) => `<li>${esc(i[key])}</li>`).join('')}</ul>`;
  let html = '';
  if (review.errors.length) html += `<div class="notice error" role="alert"><strong>Please fix:</strong>${list(review.errors, 'message')}</div>`;
  if (review.missing.length) html += `<div class="notice warn"><strong>A few questions before we can match you:</strong>${list(review.missing, 'question')}</div>`;
  if (review.conflicts.length) html += `<div class="notice warn"><strong>Please double-check:</strong>${list(review.conflicts, 'message')}</div>`;
  if (saved === false) html += '<div class="notice error" role="alert">Could not save to this browser. Your changes are kept only until you close the page.</div>';
  else if (saved && review.ready) html += '<div class="notice ok">Profile saved on this device.</div>';
  box.innerHTML = html;
  $('#undo').disabled = !store.canUndo();
}

/* ---------- results ---------- */
function filters() {
  return {
    query: $('#f-query').value,
    industry: $('#f-industry').value,
    workMode: $('#f-mode').value,
    paidOnly: $('#f-paid').checked,
    includeExpired: $('#f-expired').checked,
  };
}

function money(c) {
  if (!c || c.hourlyMax == null) return 'Pay not listed';
  return c.hourlyMin === c.hourlyMax ? `$${c.hourlyMax}/hr` : `$${c.hourlyMin}–$${c.hourlyMax}/hr`;
}

function renderJob({ internship: i, match: m }) {
  const status = m.eligibility.status;
  const statusTag = status === 'eligible' ? '' : `<span class="tag ${status}">${status === 'blocked' ? 'Eligibility issue' : 'Expired'}</span>`;
  const matched = m.matchedQualifications.map((q) =>
    `<li>✓ <strong>${esc(q.label)}</strong> ${q.required ? '(required)' : '(preferred)'} — ${esc(q.evidence)}</li>`).join('');
  const missing = m.missingQualifications.map((q) =>
    `<li>✗ <strong>${esc(q.label)}</strong> <span class="tag ${q.severity}">${esc(q.severity)}</span><br><span class="meta">${esc(q.suggestion)}</span></li>`).join('');
  const isSelected = i.id === selectedId;
  return `
  <article class="job ${isSelected ? 'selected' : ''}" aria-labelledby="t-${esc(i.id)}">
    <header>
      <div>
        <h3 id="t-${esc(i.id)}">${esc(i.title)}</h3>
        <div class="meta">${esc(i.company)} · ${esc(i.location)} · ${esc(i.workMode)} · ${esc(money(i.compensation))}</div>
        <div class="meta">Deadline ${esc(i.deadline)} · ${esc(i.industry)} · Source: ${esc(i.source)} · Checked ${esc(i.lastChecked)}</div>
      </div>
      <div class="score" aria-label="Match score ${m.score} out of 100">${m.score}/100 · ${esc(m.label)} ${statusTag}</div>
    </header>
    <p>${esc(i.description)}</p>
    ${m.eligibility.reasons.length ? `<div class="notice error">${m.eligibility.reasons.map(esc).join('<br>')}</div>` : ''}
    <p><span class="tag fact">Why it matches</span></p>
    <ul>${m.reasons.map((r) => `<li>${esc(r)}</li>`).join('') || '<li>No strong match factors.</li>'}</ul>
    <p><span class="tag rec">Recommended next steps</span></p>
    <ul>${m.nextSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <details>
      <summary>See full score breakdown &amp; qualifications</summary>
      <table class="factors">
        <thead><tr><th>Factor</th><th>Points</th><th>How it was calculated</th></tr></thead>
        <tbody>${m.factors.map((f) => `<tr><td>${esc(f.label)}</td><td class="pts">${f.points} / ${f.weight}</td><td>${esc(f.explanation)}</td></tr>`).join('')}</tbody>
      </table>
      <h4>Qualifications you meet</h4>
      <ul class="qual-list">${matched || '<li>None found in your profile yet.</li>'}</ul>
      <h4>Qualifications missing</h4>
      <ul class="qual-list">${missing || '<li>None — you meet every listed qualification.</li>'}</ul>
    </details>
    <div class="actions">
      <button type="button" data-select="${esc(i.id)}" ${isSelected ? 'aria-pressed="true"' : ''}>${isSelected ? 'Selected' : 'Select this internship'}</button>
      <span class="meta">Selecting does not apply anywhere — it only picks this role for the next steps.</span>
    </div>
  </article>`;
}

async function refreshResults() {
  const results = $('#results');
  const meta = $('#results-meta');
  if (!profile || !reviewProfile(profile).ready) {
    results.innerHTML = '<div class="notice">Complete the required profile fields to see ranked internships.</div>';
    meta.textContent = '';
    renderNextAction();
    return;
  }
  results.innerHTML = '<div class="notice" role="status">Loading internships…</div>';
  try {
    const { internships, duplicatesRemoved } = await service.search(filters());
    ranked = rankInternships(profile, internships);
    meta.textContent = `${ranked.length} listing(s) from ${service.sourceName}${duplicatesRemoved ? ` · ${duplicatesRemoved} duplicate(s) hidden` : ''}.`;
    results.innerHTML = ranked.length
      ? ranked.map(renderJob).join('')
      : '<div class="notice">No internships match these filters. Try clearing the search or turning off "Paid only".</div>';
  } catch (err) {
    console.error(err);
    ranked = [];
    meta.textContent = '';
    results.innerHTML = '<div class="notice error" role="alert">We could not load internships right now. Please try again.</div>';
  }
  renderNextAction();
}

function renderNextAction() {
  const box = $('#next-action');
  const heading = '<h2 id="next-heading">Next action</h2>';
  const tag = '<span class="tag rec">Recommendation</span> ';
  if (!profile) {
    box.innerHTML = `${heading}<p>${tag}Fill in your profile (or load the Maya demo) so we can find matches.</p>`;
    return;
  }
  const review = reviewProfile(profile);
  if (!review.ready) {
    box.innerHTML = `${heading}<p>${tag}Answer the ${review.missing.length + review.errors.length} profile question(s) above.</p>`;
    return;
  }
  const chosen = ranked.find((r) => r.internship.id === selectedId);
  if (chosen) {
    box.innerHTML = `${heading}<p>${tag}You selected <strong>${esc(chosen.internship.title)}</strong> at ${esc(chosen.internship.company)}. ${esc(chosen.match.nextSteps[0] ?? '')}</p>
      <p class="meta">Next stage: Résumé &amp; cover-letter assistant (Member 3) and application tracker (Member 4).</p>`;
    return;
  }
  const top = ranked.find((r) => r.match.eligibility.status === 'eligible');
  box.innerHTML = top
    ? `${heading}<p>${tag}Review your top match, <strong>${esc(top.internship.title)}</strong> (${top.match.score}/100), and select an internship to continue.</p>`
    : `${heading}<p>${tag}No eligible matches with these filters. Try widening your filters or preferences.</p>`;
}

function selectInternship(id) {
  selectedId = id;
  safeSet(SELECTED_KEY, id);
  const chosen = ranked.find((r) => r.internship.id === id);
  window.dispatchEvent(new CustomEvent('careerlaunch:internship-selected', { detail: chosen }));
  $('#results').innerHTML = ranked.map(renderJob).join('');
  renderNextAction();
  document.querySelector(`[data-select="${CSS.escape(id)}"]`)?.focus();
}

/* ---------- events ---------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const draft = readForm();
  const review = reviewProfile(draft);
  if (review.errors.length) {
    renderReview(review);
    return;
  }
  profile = draft;
  renderReview(review, store.save(profile));
  await refreshResults();
});

$('#add-experience').addEventListener('click', () => addExperienceRow());

$('#load-demo').addEventListener('click', async () => {
  if (profile && !(await confirmAction('Replace your current profile with the Maya demo? You can undo this.'))) return;
  profile = createProfile(structuredClone(MAYA_PROFILE));
  fillForm(profile);
  renderReview(reviewProfile(profile), store.save(profile));
  await refreshResults();
});

$('#undo').addEventListener('click', async () => {
  const prev = store.undo();
  if (!prev) return;
  profile = prev;
  fillForm(profile);
  renderReview(reviewProfile(profile));
  await refreshResults();
});

$('#delete-data').addEventListener('click', async () => {
  if (!(await confirmAction('Delete your profile and selection from this device? This cannot be undone.'))) return;
  store.reset();
  safeSet(SELECTED_KEY, null);
  profile = null;
  selectedId = null;
  ranked = [];
  fillForm(null);
  $('#profile-review').innerHTML = '<div class="notice ok">Your data was deleted from this device.</div>';
  $('#undo').disabled = true;
  await refreshResults();
});

$('#results').addEventListener('click', (e) => {
  const id = e.target.closest('[data-select]')?.dataset.select;
  if (id) selectInternship(id);
});

let debounce;
['#f-query', '#f-industry', '#f-mode', '#f-paid', '#f-expired'].forEach((sel) =>
  $(sel).addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(refreshResults, 150);
  }));

/* ---------- start ---------- */
(async function init() {
  try {
    const industries = await service.listIndustries();
    $('#f-industry').insertAdjacentHTML('beforeend', industries.map((i) => `<option>${esc(i)}</option>`).join(''));
  } catch { /* results area shows the error */ }
  fillForm(profile);
  if (profile) renderReview(reviewProfile(profile));
  $('#undo').disabled = !store.canUndo();
  await refreshResults();
})();
