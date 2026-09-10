// FAKE model for harness testing only.
const { genId } = require('../../lib/id');
let docs = [];

function makeFindByIdQuery(id) {
  const doc = docs.find((d) => d._id === id) || null;
  const query = {};
  query.select = () => query; // no-op chain, mirrors .select('-password') usage
  query.then = (res, rej) => Promise.resolve(doc).then(res, rej);
  return query;
}

module.exports = {
  __reset: () => { docs = []; },
  __seed: (u) => {
    const doc = { _id: genId(), isActive: true, modulePermissions: [], ...u };
    docs.push(doc);
    return doc;
  },
  __setActive: (id, val) => { const d = docs.find((x) => x._id === id); if (d) d.isActive = val; },
  __setModulePermissions: (id, perms) => { const d = docs.find((x) => x._id === id); if (d) d.modulePermissions = perms; },
  findById: (id) => makeFindByIdQuery(id)
};
