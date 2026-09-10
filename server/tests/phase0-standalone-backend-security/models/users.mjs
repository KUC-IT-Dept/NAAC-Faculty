let created = [];
let existing = {};
export default {
  __reset: () => { created = []; existing = {}; },
  __setExisting: (email) => { existing[email] = true; },
  __getCreated: () => created,
  findOne: async ({ $or }) => {
    const email = $or[0].email;
    return existing[email] ? { _id: 'x' } : null;
  },
  create: async (doc) => { created.push(doc); return { _id: 'y', ...doc }; }
};
