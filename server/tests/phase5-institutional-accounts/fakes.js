// In-memory stand-ins for the Mongoose models. Only persistence is faked;
// every route, middleware and controller under test is the REAL project file.
let n = 1;
const genId = () => 'fakeid' + String(n++).padStart(6, '0');

class DupKey extends Error { constructor() { super('duplicate key'); this.code = 11000; } }

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([k, v]) => {
    if (k === '$or') return v.some((f) => matches(doc, f));
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('$ne' in v) return String(doc[k]) !== String(v.$ne);
      if ('$in' in v) return v.$in.map(String).includes(String(doc[k]));
    }
    return String(doc[k]) === String(v);
  });
}
const strip = (doc, sel) => {
  if (!doc) return doc;
  const copy = { ...doc };
  if (typeof sel === 'string') {
    sel.split(/\s+/).filter(Boolean).forEach((f) => { if (f.startsWith('-')) delete copy[f.slice(1)]; });
    if (!sel.includes('+password') && !sel.includes('-password') ) { /* password hidden by default (select:false) */ }
  }
  return copy;
};
// Mongoose hides `password` (select:false) unless '+password' is requested.
function query(getter) {
  let sel = '';
  const q = {
    select(s) { sel = s || ''; return q; },
    lean() { return q; },
    populate() { return q; },
    sort() { return q; },
    then(res, rej) {
      Promise.resolve().then(() => {
        const out = getter();
        const apply = (d) => {
          if (!d) return d;
          const c = strip(d, sel);
          if (!sel.includes('+password')) delete c.password;
          Object.defineProperty(c, 'toObject', { enumerable: false, value() { return { ...this }; } });
          return c;
        };
        return Array.isArray(out) ? out.map(apply) : apply(out);
      }).then(res, rej);
    },
  };
  return q;
}

function makeUserModel() {
  let docs = [];
  const INST = ['librarian', 'mmttc_director'];
  const User = {
    __reset: () => { docs = []; },
    __all: () => docs,
    __seed: (u) => {
      const d = { _id: genId(), isActive: true, isFirstLogin: true, modulePermissions: [], name: 'Seed', ...u };
      docs.push(d); return d;
    },
    findById: (id) => query(() => docs.find((d) => d._id === id) || null),
    findOne: (filter) => query(() => docs.find((d) => matches(d, filter)) || null),
    find: (filter) => query(() => docs.filter((d) => matches(d, filter))),
    create: async (data) => {
      if (docs.some((d) => d.email === data.email || (data.username && d.username === data.username))) throw new DupKey();
      // mirrors the partial unique index on role for institutional roles
      if (INST.includes(data.role) && docs.some((d) => d.role === data.role)) throw new DupKey();
      const d = { _id: genId(), isActive: true, isFirstLogin: true, modulePermissions: [], createdAt: new Date(), updatedAt: new Date(), ...data };
      docs.push(d); return d;
    },
    findByIdAndUpdate: (id, update) => query(() => {
      const d = docs.find((x) => x._id === id);
      if (!d) return null;
      Object.assign(d, update.$set || {}, { updatedAt: new Date() });
      return d;
    }),
    deleteOne: async () => ({}),
    updateOne: async () => ({}),
  };
  return User;
}

function makeRecordModel() {
  let docs = [];
  return {
    __reset: () => { docs = []; },
    find: () => { const q = { sort: () => Promise.resolve([...docs]), then: (r, j) => Promise.resolve([...docs]).then(r, j) }; return q; },
    findOne: async (f = {}) => docs.find((d) => matches(d, f)) || null,
    create: async (data) => { const d = { _id: genId(), ...data, save: async function () { return this; } }; docs.push(d); return d; },
    findOneAndDelete: async () => null,
  };
}

// Generic empty-collection model: find* are chainable and resolve to [] / null.
const stub = {
  find: () => query(() => []),
  findOne: () => query(() => null),
  findById: () => query(() => null),
  populate() { return this; },
  create: async (d) => d,
  updateMany: async () => ({}),
  deleteOne: async () => ({}),
};

module.exports = { makeUserModel, makeRecordModel, stub };
