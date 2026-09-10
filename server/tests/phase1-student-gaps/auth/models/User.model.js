const { genId } = require('../../lib/fakeMongoUtils');
let docs = [];
module.exports = {
  __reset: () => { docs = []; },
  __seed: (u) => { const doc = { _id: genId(), ...u }; docs.push(doc); return doc; },
  findOne: async (filter = {}) => {
    if (filter.email) return docs.find((d) => d.email === filter.email) || null;
    return docs.find((d) => Object.entries(filter).every(([k, v]) => String(d[k]) === String(v))) || null;
  },
  findById: async (id) => docs.find((d) => d._id === id) || null
};
