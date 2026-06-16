const mongoose = require('mongoose');

const DropdownConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  options: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('DropdownConfig', DropdownConfigSchema);
