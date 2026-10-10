/**
 * Backend schema check (no database needed). Run from the project root after `cd server && npm ci`:
 *   node tests/academic-responsibilities/schema.check.cjs
 * Verifies the ACTIVE Faculty model (server/modules/faculty/models/Faculty.js, used by index.js)
 * keeps the new single-value fields AND the legacy range fields.
 * (The legacy server/models/Faculty.js is not mounted by index.js and is checked by
 *  schema.check.both-models.cjs, which ships in the optional patch.)
 */
const assert = require('assert');
const path = require('path');
const mongoose = require(path.resolve(__dirname, '../../server/node_modules/mongoose'));

// Both files register a model named "Faculty", so load them one at a time.
const loaders = {
  'modules/faculty/models/Faculty (active)': () => { mongoose.deleteModel(/^Faculty$/); return require('../../server/modules/faculty/models/Faculty.js'); },
};

const course = {
  courseName: 'Operating Systems', programmes: 'B.Tech', academicYear: '2023-2024', semester: 'Semester III', subject: 'CS',
  // legacy keys must survive too
  fromYear: '2021', toYear: '2023', semesterFrom: 'Semester I', semesterTo: 'Semester III', programme: 'UG',
};
const resp = { classesHandled: 'UG', administrativeRoles: 'HOD', committeeMemberships: 'BOS', fromYear: '2020', toYear: '2022', fromSemester: 'Semester I', toSemester: 'Semester II' };

let failed = 0;
for (const [name, load] of Object.entries(loaders)) {
  try {
    const Faculty = load();
    const doc = new Faculty({ userId: new mongoose.Types.ObjectId(), username: 'u', academicResponsibilities: { courses: [course], otherResponsibilities: [resp] } });
    assert.strictEqual(doc.validateSync(), undefined, 'validation error');
    const o = JSON.parse(JSON.stringify(doc.toObject())); // what GET /api/faculty/me returns after a save
    assert.deepStrictEqual(o.academicResponsibilities.courses[0], course, 'course fields were dropped or changed');
    assert.deepStrictEqual(o.academicResponsibilities.otherResponsibilities[0], resp, 'responsibility fields were dropped');

    // an old record (no academicYear/semester/programmes) still loads, with empty defaults
    const old = new Faculty({ userId: new mongoose.Types.ObjectId(), username: 'o', academicResponsibilities: { courses: [{ courseName: 'X', fromYear: '2019', toYear: '2020', semesterFrom: 'Semester I', semesterTo: 'Semester II', programme: 'PG' }] } });
    const oc = old.toObject().academicResponsibilities.courses[0];
    assert.strictEqual(oc.fromYear, '2019'); assert.strictEqual(oc.toYear, '2020');
    assert.strictEqual(oc.semesterFrom, 'Semester I'); assert.strictEqual(oc.programme, 'PG');
    assert.strictEqual(oc.academicYear, ''); assert.strictEqual(oc.semester, '');
    console.log('PASS ', name);
  } catch (e) { failed++; console.log('FAIL ', name, '-', e.message); }
}
process.exit(failed ? 1 : 0);
