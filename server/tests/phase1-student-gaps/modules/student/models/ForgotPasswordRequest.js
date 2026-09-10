const { genId } = require('../../../lib/fakeMongoUtils');
let docs = [];
function makeQuery(arr) {
  const q = {};
  q.sort = () => Promise.resolve([...arr].reverse());
  q.then = (res, rej) => Promise.resolve([...arr]).then(res, rej);
  return q;
}
module.exports = {
  __reset: () => { docs = []; },
  __all: () => docs,
  create: async (data) => {
    const doc = { _id: genId(), status: 'pending', createdAt: new Date(), ...data,
      save: async function () { return this; } };
    docs.push(doc);
    return doc;
  },
  findOne: async (filter = {}) => docs.find((d) => Object.entries(filter).every(([k, v]) => String(d[k]) === String(v))) || null,
  find: (filter = {}) => {
    const matched = docs.filter((d) => Object.entries(filter).every(([k, v]) => String(d[k]) === String(v)));
    return makeQuery(matched);
  }
};
