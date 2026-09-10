// FAKE model for harness testing only.
const { genId } = require('../../../lib/fakeMongoUtils');

const ARRAY_KEYS = [
  'faculty','programLevels','departments','degreeNames','specializations',
  'currentYears','currentSemesters','studyModes','admissionCategories',
  'genders','nationalities','countries','socialCategories','castes',
  'visaTypes','visaStatuses','motherTongues','languages','relations',
  'bloodGroups','vaccinationStatuses','qualifications','qualificationLevels',
  'qualificationModes','examNames','scholarshipCategories','grantCategories',
  'bankNames','indexingServices','religions','presentationTypes',
  'conferenceTypes','patentStatuses','membershipTypes','publicationTypes',
  'publicationIndexedIn','publicationStatuses'
];

let store = null;

class FakeDropdownDoc {
  constructor(data = {}) {
    this._id = data._id || genId();
    for (const k of ARRAY_KEYS) this[k] = Array.isArray(data[k]) ? [...data[k]] : [];
    this.states = data.states instanceof Map ? new Map(data.states) : new Map(Object.entries(data.states || {}));
  }
  toObject() {
    const obj = { _id: this._id };
    for (const k of ARRAY_KEYS) obj[k] = [...this[k]];
    obj.states = this.states;
    return obj;
  }
  async save() { store = this; return this; }
  toJSON() {
    // Mirrors real Mongoose behavior: a Map-typed field is serialized to a
    // plain object when JSON.stringify()'d (e.g. via res.json(dropdown)).
    const obj = this.toObject();
    obj.states = Object.fromEntries(this.states.entries());
    return obj;
  }
}

function makeFindOneQuery() {
  const promise = Promise.resolve(store);
  promise.lean = async () => {
    if (!store) return null;
    const plain = store.toObject();
    plain.states = Object.fromEntries(store.states.entries());
    return plain;
  };
  return promise;
}

module.exports = {
  __reset: () => { store = null; },
  findOne: () => makeFindOneQuery(),
  create: async (data) => { store = new FakeDropdownDoc(data); return store; }
};
