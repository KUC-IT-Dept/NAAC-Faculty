const { Types } = require('mongoose');
module.exports = { genId: () => new Types.ObjectId().toString() };
