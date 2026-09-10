let createdDocs = [];
let existingByEmail = {};
module.exports = {
  __reset: () => { createdDocs = []; existingByEmail = {}; },
  __setExisting: (email) => { existingByEmail[email] = true; },
  __getCreated: () => createdDocs,
  findOne: async ({ $or }) => {
    const email = $or[0].email;
    return existingByEmail[email] ? { _id: 'existing123' } : null;
  },
  create: async (doc) => {
    createdDocs.push(doc);
    return { _id: 'newuser123', ...doc };
  }
};
