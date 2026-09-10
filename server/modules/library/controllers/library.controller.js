// modules/library/controllers/library.controller.js
//
// Institution-wide data (one document per academic year), not owned by any
// individual user - so there is no per-user ownership check here (unlike,
// e.g., a student's own profile). Access control is entirely role +
// modulePermissions, enforced by the route layer
// (authenticate + authorizeModule('library', ...)) before any of these
// functions run. Every function below can therefore assume the caller is
// already authenticated and authorized for the Library module - it only
// needs to handle the data operation itself.
//
// File uploads: this phase stores upload URLs as plain strings on the
// document (see LibraryRecord.js's `uploads` and
// `staffing.orientationPrograms.photoUploads` fields). Wiring an actual
// upload endpoint (reusing the existing shared multer/cloudinary
// infrastructure) was not part of this phase's requested scope and is left
// for a later phase - see the Phase 3 report for this called out
// explicitly as an assumption.

const LibraryRecord = require('../models/LibraryRecord');

const listLibraryRecords = async (req, res) => {
  try {
    const records = await LibraryRecord.find().sort({ academicYear: -1 });
    return res.status(200).json({ success: true, count: records.length, records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getLibraryRecordByYear = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const record = await LibraryRecord.findOne({ academicYear });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No Library record found for this academic year.' });
    }

    return res.status(200).json({ success: true, record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createLibraryRecord = async (req, res) => {
  try {
    const { academicYear } = req.body;

    if (!academicYear) {
      return res.status(400).json({ success: false, message: 'academicYear is required.' });
    }

    const existing = await LibraryRecord.findOne({ academicYear });
    if (existing) {
      return res.status(400).json({ success: false, message: `A Library record for ${academicYear} already exists. Use update instead.` });
    }

    const record = await LibraryRecord.create({
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    return res.status(201).json({ success: true, message: 'Library record created successfully.', record });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A Library record for this academic year already exists.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateLibraryRecord = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const record = await LibraryRecord.findOne({ academicYear });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No Library record found for this academic year.' });
    }

    // academicYear itself is the record's identity - it is not changed via
    // an update to this record; a year is renamed by creating a new record,
    // not by mutating an existing one's key.
    const { academicYear: _ignored, createdBy: _ignoredCreatedBy, ...updates } = req.body;

    Object.assign(record, updates);
    record.updatedBy = req.user._id;

    await record.save();

    return res.status(200).json({ success: true, message: 'Library record updated successfully.', record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteLibraryRecord = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const record = await LibraryRecord.findOneAndDelete({ academicYear });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No Library record found for this academic year.' });
    }

    return res.status(200).json({ success: true, message: 'Library record deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listLibraryRecords,
  getLibraryRecordByYear,
  createLibraryRecord,
  updateLibraryRecord,
  deleteLibraryRecord
};
