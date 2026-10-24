// In-memory stand-ins for Mongoose models. Only persistence is faked; every
// route, service, parser and scoring function under test is the REAL project file.
let n = 1;
const genId = () => (n++).toString(16).padStart(24, '0');

// structuredClone keeps Dates/Buffers; undefined values are dropped like Mongo would
const clone = (o) => structuredClone(o);

/** Apply a Mongo-style $set (supports dotted paths like 'lifecycle.reason'). */
function applySet(doc, set) {
  Object.entries(set || {}).forEach(([k, v]) => {
    const parts = k.split('.'); let cur = doc;
    for (let i = 0; i < parts.length - 1; i += 1) { if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {}; cur = cur[parts[i]]; }
    cur[parts[parts.length - 1]] = v === undefined ? undefined : structuredClone(v);
  });
}

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      if ('$in' in v) return v.$in.some((x) => (x == null ? doc[k] == null : String(doc[k]) === String(x)));
      if ('$ne' in v) return v.$ne === null ? doc[k] != null : String(doc[k]) !== String(v.$ne);
    }
    if (v === null) return doc[k] == null;
    return String(doc[k]) === String(v);
  });
}

function makeCollection({ withSave = false } = {}) {
  let docs = [];
  const decorate = (d) => {
    if (withSave && !Object.prototype.hasOwnProperty.call(d, 'save')) {
      Object.defineProperty(d, 'save', { enumerable: false, value: async function () { return this; } });
      Object.defineProperty(d, 'markModified', { enumerable: false, value: () => {} });
    }
    return d;
  };
  const q = (getter) => {
    let lean = false; let sortSpec = null; let lim = null;
    const api = {
      lean() { lean = true; return api; },
    select() { return api; },
      sort(s) { sortSpec = s; return api; },
      limit(l) { lim = l; return api; },
      then(res, rej) {
        Promise.resolve().then(() => {
          let out = getter();
          if (Array.isArray(out)) {
            if (sortSpec) { const [k, dir] = Object.entries(sortSpec)[0]; out = out.slice().sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * dir); }
            if (lim) out = out.slice(0, lim);
            return lean ? out.map(clone) : out;
          }
          return lean && out ? clone(out) : out;
        }).then(res, rej);
      },
    };
    return api;
  };
  return {
    __reset: () => { docs = []; },
    __all: () => docs,
    __seed: (d) => { const x = decorate({ _id: genId(), ...clone(d) }); docs.push(x); return x; },
    find: (f) => q(() => docs.filter((d) => matches(d, f))),
    findOne: (f) => q(() => docs.find((d) => matches(d, f)) || null),
    findById: (id) => q(() => docs.find((d) => String(d._id) === String(id)) || null),
    countDocuments: async (f) => docs.filter((d) => matches(d, f)).length,
    create: async (data) => { const d = decorate({ _id: genId(), createdAt: new Date(), ...clone(data) }); docs.push(d); return d; },
    findOneAndUpdate: (f, update, opts = {}) => q(() => {
      const d = docs.find((x) => matches(x, f));
      if (!d) return null;
      applySet(d, update.$set);
      return d;
    }),
    deleteOne: async (f) => { const i = docs.findIndex((x) => matches(x, f)); if (i >= 0) docs.splice(i, 1); return {}; },
    updateOne: async (f, update, opts = {}) => {
      let d = docs.find((x) => matches(x, f));
      if (!d && opts.upsert) { d = decorate({ _id: genId(), ...clone(f) }); docs.push(d); }
      if (d) applySet(d, update.$set);
      return {};
    },
  };
}

module.exports = { makeCollection, clone };
