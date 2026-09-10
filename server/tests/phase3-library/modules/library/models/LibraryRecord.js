const { genId } = require('../../../lib/id');
let docs = [];

function makeArrayQuery(arr) {
  const q = {};
  q.sort = () => Promise.resolve([...arr]); // sort direction not asserted in tests
  q.then = (res, rej) => Promise.resolve([...arr]).then(res, rej);
  return q;
}

class DuplicateKeyError extends Error {
  constructor() { super('duplicate key'); this.code = 11000; }
}

module.exports = {
  __reset: () => { docs = []; },
  __all: () => docs,
  find: () => makeArrayQuery(docs),
  findOne: async (filter = {}) => {
    return docs.find((d) => Object.entries(filter).every(([k, v]) => String(d[k]) === String(v))) || null;
  },
  create: async (data) => {
    if (docs.some((d) => d.academicYear === data.academicYear)) {
      throw new DuplicateKeyError();
    }
    const doc = { _id: genId(), academicYear: data.academicYear, ...data,
      save: async function () { return this; } };
    docs.push(doc);
    return doc;
  },
  findOneAndDelete: async (filter = {}) => {
    const idx = docs.findIndex((d) => Object.entries(filter).every(([k, v]) => String(d[k]) === String(v)));
    if (idx === -1) return null;
    const [removed] = docs.splice(idx, 1);
    return removed;
  }
};
