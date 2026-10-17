// Behavioural test for the Library / MMTTC wizards.
// Bundles the real components with esbuild and drives them in jsdom.
// jsdom is NOT a project dependency. Install it outside the project, then:
//   JSDOM_PATH=/path/to/node_modules/jsdom node tests/wizards/run.mjs   (or: npm i --no-save jsdom)
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const req = createRequire(import.meta.url);
const { JSDOM } = req(process.env.JSDOM_PATH || 'jsdom');
const esbuild = req(path.join(root, 'node_modules/esbuild'));

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Event', 'MouseEvent', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement']) {
  Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window.confirm = () => true;

const out = path.join(root, 'node_modules/.cache-wizard-test.mjs');
await esbuild.build({
  stdin: {
    contents: `export { default as LibraryWizard } from './src/pages/institutional/LibraryWizard';
               export { default as MMTTCWizard } from './src/pages/institutional/MMTTCWizard';
               export { createRoot } from 'react-dom/client';
               export { createElement as h, act } from 'react';`,
    resolveDir: root, loader: 'ts',
  },
  bundle: true, format: 'esm', platform: 'node', outfile: out, loader: { '.css': 'empty', '.tsx': 'tsx' },
  jsx: 'automatic', logLevel: 'error', external: [],
});
const { LibraryWizard, MMTTCWizard, createRoot, h, act } = await import(out);

let passed = 0, failed = 0;
const check = (l, c, x) => { if (c) { passed++; console.log('PASS -', l); } else { failed++; console.log('FAIL -', l, x ?? ''); } };
const container = document.getElementById('root');
const text = () => container.textContent;
const click = async (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const btn = (label) => [...container.querySelectorAll('.wz-bar button, .wz-step, .wz-panel button')].find((b) => b.textContent.trim().replace(/^\d+/, '').startsWith(label));
const field = (label) => {
  const g = [...container.querySelectorAll('.form-group')].find((x) => x.querySelector('label')?.textContent.trim().startsWith(label));
  return g?.querySelector('input,select,textarea');
};
const setVal = async (el, v) => act(async () => {
  const proto = el.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  el.dispatchEvent(new dom.window.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const mount = async (el) => { const r = createRoot(container); await act(async () => r.render(el)); return r; };

// ---------------- Library: create flow ----------------
let saved = null;
let root_ = await mount(h(LibraryWizard, { record: null, saving: false, onSave: (p, y) => { saved = { p, y }; }, onCancel: () => {} }));
check('Library wizard renders with 8 steps', container.querySelectorAll('.wz-step').length === 8);
check('Library: no modal overlay used', !container.querySelector('.modal-overlay, .modal'));
check('Library: no right-side progress panel', !container.querySelector('.wz-progress, aside'));
check('Library: exactly one Cancel in action bar', [...container.querySelectorAll('.wz-bar button')].filter((b) => b.textContent.trim() === 'Cancel').length === 1);
await click(btn('Next'));
check('Library: Next blocked when academic year empty (still step 1)', container.querySelector('.wz-step.active')?.textContent.includes('General') && text().includes('Academic year is required'));
await setVal(field('Academic Year'), '2025-2026');
await setVal(field('0.9.1.1'), 'Dr Lib');
await setVal(field('0.9.1.3'), '2015-06-01');
await setVal(field('0.9.1.4'), '10');
await click(btn('Next'));
check('Library: advances to Infrastructure', container.querySelector('.wz-step.active')?.textContent.includes('Infrastructure'));
await setVal(field('0.9.2.1'), '12000');
await setVal(field('Days per week'), '7');
await click(btn('Back'));
check('Library: values persist after Back (name)', field('0.9.1.1').value === 'Dr Lib' && field('0.9.1.3').value === '2015-06-01');
await click(btn('Next'));
check('Library: values persist after Next (floor area)', field('0.9.2.1').value === '12000');
// numeric validation
await setVal(field('0.9.2.5'), '');
await click(btn('Next'));
check('Library: blank number rejected', text().includes('Enter a whole number'));
await setVal(field('0.9.2.5'), '3');
await setVal(field('0.9.2.7') ?? field('From'), '18:00');
await setVal(field('To'), '09:00');
await click(btn('Next'));
check('Library: closing before opening rejected', text().includes('Closing time must be after opening time'));
await setVal(field('From'), '09:00'); await setVal(field('To'), '18:00');
const labelsByStep = [];
for (let i = 1; i < 7; i++) {
  await click(btn('Next'));
  labelsByStep.push(text());
}
const all = text();
const required = ['0.9.3.1', '0.9.3.2', '0.9.3.3', '0.9.3.4', '0.9.3.5', '0.9.3.6', '0.9.3.7', '0.9.3.8', '0.9.3.9', '0.9.4.1', '0.9.4.2', '0.9.4.3', '0.9.4.4', '0.9.4.5', '0.9.5.1', '0.9.5.2', '0.9.5.3', '0.9.5.4', '0.9.5.5', '0.9.5.6', '0.9.6.1', '0.9.6.2', '0.9.6.3', '0.9.6.4', '0.9.7.1', '0.9.7.2', '0.9.7.3', '0.9.7.4', '0.9.8.1', '0.9.8.2', '0.9.9.1', '0.9.9.2'];
const joined = labelsByStep.join(' ') + all;
const missing = required.filter((c) => !joined.includes(c));
check('Library: every spec item 0.9.3.1-0.9.9.2 appears on some step', missing.length === 0, missing);
check('Library: reached last step with Save button', !!btn('Save Record') && container.querySelector('.wz-step.active')?.textContent.includes('Finance'));
await click(btn('Save Record'));
check('Library: onSave called for create (year null)', saved && saved.y === null);
check('Library payload: values carried', saved?.p.academicYear === '2025-2026' && saved?.p.librarian.name === 'Dr Lib' && saved?.p.infrastructure.totalFloorAreaSqFt === 12000 && saved?.p.infrastructure.timing.daysPerWeek === 7 && saved?.p.librarian.yearsOfService === 10, saved?.p);
check('Library payload: no bookkeeping keys', !JSON.stringify(saved?.p).match(/"(_id|__v|createdAt|updatedAt|createdBy|updatedBy)"/));
await act(async () => root_.unmount());

// ---------------- Library: edit flow ----------------
saved = null;
const rec = {
  _id: 'abc', __v: 3, createdAt: '2025-01-01', updatedAt: '2025-02-01', createdBy: 'u1', academicYear: '2024-2025',
  librarian: { name: 'Existing Lib', qualifications: 'MLISc', joiningDate: '2012-04-10T00:00:00.000Z', yearsOfService: 12 },
  infrastructure: { totalFloorAreaSqFt: 5000, seatingCapacity: { readingRooms: 40, studyCarrels: 5, digitalLabs: 10 }, accessibility: { ramps: 1, lifts: 1, wheelchairs: 2 }, safetyMeasures: { fireAlarms: 4, cctv: 8, emergencyExits: 3 }, discussionRooms: 2, computers: 20, timing: { daysPerWeek: 6, fromTime: '09:00', toTime: '17:00', closedOnSaturday: false, closedOnSunday: true } },
  collections: { totalBooks: { subject: 'Science', number: 900 }, journalsAndPeriodicals: { print: 1, electronic: 2, national: 3, international: 4 }, digitalResources: { databases: 1, ebooks: 2, institutionalRepository: 3 }, specialCollections: { rareBooks: 1, theses: 2, manuscripts: 3 }, annualAdditions: { newTitlesPurchased: 5, subscribed: 6 }, contributionsByStudents: 7, donations: { byAlumni: 1, byStaff: 2, byOthers: 3 } },
  technology: { libraryManagementSoftware: 'Koha', opacAvailable: true, institutionalRepositoryAccess: false, remoteAccessFacilities: 'VPN', digitalLiteracyPrograms: { from: '2024-08-01T00:00:00.000Z', to: '2024-08-05T00:00:00.000Z' } },
  staffing: { supportStaffCount: 4, qualificationsAndTraining: 'BLISc', userServices: 'Reference desk', orientationPrograms: { date: '2024-07-15T00:00:00.000Z', photoUploads: ['https://x.test/a.jpg'] }, workshopsAndSeminars: [{ title: 'Citation 101', date: '2024-09-01T00:00:00.000Z', topic: 'citation' }], plagiarismChecks: [{ date: '2024-10-01T00:00:00.000Z', articlesOrThesesChecked: 12, scope: 'internal' }] },
  usage: { footfall: { daily: 100, annual: 20000 }, circulation: { booksIssued: 10, booksReturned: 9, source: 'manual' }, digitalResourceUsage: { date: '2024-11-01T00:00:00.000Z', totalDownloadsOrLogins: 500 }, feedbackMechanisms: 'Form' },
  compliance: { copyrightCompliance: true, dataPrivacyCompliance: true, disasterPreparedness: { fireSafety: 'Extinguishers', digitalBackup: true }, preservationMeasures: ['binding', 'climate_control'] },
  financial: { annualBudgetAllocation: 100000, subscriptionsAndMemberships: 'INFLIBNET' },
  bestPractices: { practices: 'Green', innovations: 'App', details: 'More' }, uploads: [{ url: 'u', caption: 'c' }],
};
root_ = await mount(h(LibraryWizard, { record: rec, saving: false, onSave: (p, y) => { saved = { p, y }; }, onCancel: () => {} }));
check('Library edit: title shows edit mode + year', text().includes('Edit Library Record') && text().includes('2024-2025'));
check('Library edit: prepopulated name/qualification', field('0.9.1.1').value === 'Existing Lib' && field('0.9.1.2').value === 'MLISc');
check('Library edit: joining date prepopulated as yyyy-mm-dd', field('0.9.1.3').value === '2012-04-10');
check('Library edit: years of service prepopulated', field('0.9.1.4').value === '12');
check('Library edit: academic year shown and edit hint present', field('Academic Year').value === '2024-2025' && text().includes('cannot be changed'));
await click(btn('Technology'));
check('Library edit: all steps reachable via stepper', container.querySelector('.wz-step.active')?.textContent.includes('Technology') && field('0.9.4.1').value === 'Koha');
await click(btn('Staffing'));
check('Library edit: workshops + plagiarism rows prepopulated', [...container.querySelectorAll('input')].some((i) => i.value === 'Citation 101') && [...container.querySelectorAll('input')].some((i) => i.value === '12'));
await click(btn('Compliance'));
check('Library edit: preservation checkboxes prepopulated', [...container.querySelectorAll('input[type=checkbox]')].map((c) => c.checked).join() === 'true,false,true');
await click(btn('Save Changes'));
check('Library edit: Save Changes available mid-wizard and saves with year', saved && saved.y === '2024-2025');
check('Library edit payload: bookkeeping stripped, data retained', !JSON.stringify(saved?.p).match(/"(_id|__v|createdAt|createdBy)"/) && saved?.p.staffing.plagiarismChecks[0].articlesOrThesesChecked === 12 && saved?.p.uploads.length === 1 && saved?.p.compliance.preservationMeasures.length === 2);
await act(async () => root_.unmount());

// ---------------- MMTTC ----------------
saved = null;
root_ = await mount(h(MMTTCWizard, { record: null, saving: false, onSave: (p, y) => { saved = { p, y }; }, onCancel: () => {} }));
check('MMTTC wizard renders 5 steps, no modal', container.querySelectorAll('.wz-step').length === 5 && !container.querySelector('.modal-overlay, .modal'));
await click(btn('Next'));
check('MMTTC: academic year required', text().includes('Academic year is required'));
await setVal(field('Academic Year'), '2025-2026');
await setVal(field('Name of the centre'), 'MMTTC Centre');
await setVal(field('Year of establishment'), '1999');
await setVal(field('Recognised'), 'yes');
await setVal(field('Recognition date'), '2010-01-05');
await setVal(field('Accredited'), 'yes');
await setVal(field('Accreditation date'), '2012-03-04');
await click(btn('Next'));
check('MMTTC: Director step has name, qualification, date of joining', !!field('Name') && !!field('Academic qualification') && !!field('Date of joining'));
await setVal(field('Name'), 'Dr Director'); await setVal(field('Academic qualification'), 'PhD'); await setVal(field('Date of joining'), '2018-07-01');
await click(btn('Next'));
await click(btn('Add equipment'));
const eq = [...container.querySelectorAll('.wz-repeat input')];
await setVal(eq[0], 'Projector'); await setVal([...container.querySelectorAll('.wz-repeat input')][1], '4');
await setVal(field('Number of classrooms'), '-1');
await click(btn('Next'));
check('MMTTC: negative number rejected', text().includes('Enter a whole number'));
await setVal(field('Number of classrooms'), '6');
await click(btn('Next'));
check('MMTTC: Impact & Outreach fields', !!field('Collaborations') && !!field('Community outreach'));
await setVal(field('Collaborations'), 'IIT'); await setVal(field('Community outreach'), 'Camps');
await click(btn('Next'));
check('MMTTC: review step shows course note and Save Record', text().includes('Course details (0.11.4)') && !!btn('Save Record'));
await click(btn('Save Record'));
const mp = saved?.p;
check('MMTTC payload: centre/director/infra/impact carried', mp?.centre.name === 'MMTTC Centre' && mp?.centre.yearOfEstablishment === 1999 && mp?.centre.recognitionStatus.status === true && mp?.centre.recognitionStatus.date === '2010-01-05' && mp?.director.dateOfJoining === '2018-07-01' && mp?.director.academicQualification === 'PhD' && mp?.infrastructure.equipment[0].name === 'Projector' && mp?.infrastructure.equipment[0].count === 4 && mp?.infrastructure.numberOfClassrooms === 6 && mp?.impact.collaborations === 'IIT', mp);
check('MMTTC payload: never contains courses', !('courses' in (mp || {})));
await act(async () => root_.unmount());

saved = null;
const mrec = { _id: 'm1', __v: 0, createdAt: 'x', academicYear: '2023-2024', centre: { name: 'C', recognitionStatus: { status: true, date: '2010-01-05T00:00:00.000Z' }, accreditationStatus: { status: false } }, director: { name: 'D', academicQualification: 'Dr (legacy text)', dateOfJoining: '2018-07-01T00:00:00.000Z' }, infrastructure: { numberOfClassrooms: 2, totalSeatingCapacity: 1, numberOfLabs: 1, library: { numberOfBooks: 1, spaceSqFt: 1 }, digitalResourcesDetails: '', equipment: [{ name: 'Mic', count: 2 }], numberOfSupportingStaff: 1, roomsAvailableToStay: 1, stayCapacity: 1, annualBudgetAllocation: 1 }, courses: [{ _id: 'c1', courseTitle: 'T', year: 2020, courseType: 'refresher', mode: 'online', fundingSource: 'govt' }], impact: { collaborations: 'A', communityOutreach: 'B' } };
root_ = await mount(h(MMTTCWizard, { record: mrec, saving: false, onSave: (p, y) => { saved = { p, y }; }, onCancel: () => {} }));
check('MMTTC edit: recognition date prepopulated', field('Recognition date').value === '2010-01-05');
check('MMTTC edit: legacy free-text qualification kept selectable', (await (async () => { await click(btn('Director')); return field('Academic qualification').value === 'Dr (legacy text)'; })()));
await click(btn('Save Changes'));
check('MMTTC edit: save keeps existing courses OUT of payload', saved?.y === '2023-2024' && !('courses' in saved.p) && !JSON.stringify(saved.p).includes('"_id"'));
await act(async () => root_.unmount());

console.log(`\n${passed} passed, ${failed} failed`);
import('fs').then((fs) => fs.unlinkSync(out));
process.exit(failed ? 1 : 0);
