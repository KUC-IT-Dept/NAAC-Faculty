const { genId } = require('../../../lib/fakeMongoUtils');
let docs = [];
function makeQuery(arr) {
  const q = { _sorted: arr };
  q.sort = () => Promise.resolve([...q._sorted].reverse());
  q.then = (res, rej) => Promise.resolve([...q._sorted]).then(res, rej);
  return q;
}
module.exports = {
  __reset: () => { docs = []; },
  __all: () => docs,
  create: async (data) => {
    const doc = { _id: genId(), createdAt: new Date(), ...data };
    docs.push(doc);
    return doc;
  },
  find: (filter = {}) => {
    const matched = docs.filter((d) => Object.entries(filter).every(([k, v]) => String(d[k]) === String(v)));
    return makeQuery(matched);
  },
  deleteMany: async (filter = {}) => {
    const before = docs.length;
    docs = docs.filter((d) => !Object.entries(filter).every(([k, v]) => String(d[k]) === String(v)));
    return { deletedCount: before - docs.length };
  }
};
