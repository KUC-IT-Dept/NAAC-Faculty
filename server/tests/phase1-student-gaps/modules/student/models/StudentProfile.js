const { genId } = require('../../../lib/fakeMongoUtils');
let docs = [];

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function ensurePath(obj, path) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  const last = keys[keys.length - 1];
  if (!Array.isArray(cur[last])) cur[last] = [];
  return { parent: cur, key: last };
}

function assignId(arr) {
  return arr.map((item) => (item && item._id ? item : { ...item, _id: genId() }));
}

module.exports = {
  __reset: () => { docs = []; },
  __all: () => docs,
  create: async (data) => {
    const doc = { _id: genId(), ...data };
    // stamp ids onto any nested arrays under *_details.* the tests populate
    if (doc.education_details && Array.isArray(doc.education_details.education)) {
      doc.education_details.education = assignId(doc.education_details.education);
    }
    docs.push(doc);
    return doc;
  },
  findOne: async (filter = {}) => {
    const doc = docs.find((d) => Object.entries(filter).every(([k, v]) => String(d[k]) === String(v)));
    return doc || null;
  },
  updateOne: async (filter, update) => {
    const doc = docs.find((d) => Object.entries(filter).every(([k, v]) => String(d[k]) === String(v)));
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };

    if (update.$pull) {
      for (const [path, cond] of Object.entries(update.$pull)) {
        const { parent, key } = ensurePath(doc, path);
        const before = parent[key].length;
        parent[key] = parent[key].filter((item) => {
          return !Object.entries(cond).every(([ck, cv]) => String(item[ck]) === String(cv));
        });
        return { matchedCount: 1, modifiedCount: parent[key].length < before ? 1 : 0 };
      }
    }
    if (update.$push) {
      for (const [path, value] of Object.entries(update.$push)) {
        const { parent, key } = ensurePath(doc, path);
        const withId = value && value._id ? value : { ...value, _id: genId() };
        parent[key].push(withId);
      }
      return { matchedCount: 1, modifiedCount: 1 };
    }
    return { matchedCount: 1, modifiedCount: 0 };
  }
};
