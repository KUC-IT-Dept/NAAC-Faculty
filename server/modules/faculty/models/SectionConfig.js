const mongoose = require('mongoose');

const DropdownConfigItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  optionsKey: { type: String, required: true }
}, { _id: false });

const SectionConfigSchema = new mongoose.Schema({
  sectionId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  configs: { type: [DropdownConfigItemSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('SectionConfig', SectionConfigSchema);
