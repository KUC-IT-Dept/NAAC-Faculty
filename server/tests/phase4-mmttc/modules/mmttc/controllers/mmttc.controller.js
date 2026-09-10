// modules/mmttc/controllers/mmttc.controller.js
//
// Same access-control shape as modules/library/controllers/library.controller.js:
// institution-wide data, no per-user ownership check - the route layer
// (authenticate + authorizeModule('mmttc', ...)) is the only gate, and
// every function here can assume the caller already passed it.
//
// One addition versus Library: the source requirements document explicitly
// describes courses as repeating ("repeat for each course - so facility to
// add"), so alongside the yearly-record CRUD this also exposes course-level
// add/update/remove operations against the `courses` array on a year's
// record, rather than forcing the whole array to be replaced via a single
// PUT every time a course changes.

const MMTTCRecord = require('../models/MMTTCRecord');

const listMMTTCRecords = async (req, res) => {
  try {
    const records = await MMTTCRecord.find().sort({ academicYear: -1 });
    return res.status(200).json({ success: true, count: records.length, records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getMMTTCRecordByYear = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const record = await MMTTCRecord.findOne({ academicYear });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No MMTTC record found for this academic year.' });
    }

    return res.status(200).json({ success: true, record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createMMTTCRecord = async (req, res) => {
  try {
    const { academicYear } = req.body;

    if (!academicYear) {
      return res.status(400).json({ success: false, message: 'academicYear is required.' });
    }

    const existing = await MMTTCRecord.findOne({ academicYear });
    if (existing) {
      return res.status(400).json({ success: false, message: `An MMTTC record for ${academicYear} already exists. Use update instead.` });
    }

    const record = await MMTTCRecord.create({
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    return res.status(201).json({ success: true, message: 'MMTTC record created successfully.', record });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'An MMTTC record for this academic year already exists.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateMMTTCRecord = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const record = await MMTTCRecord.findOne({ academicYear });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No MMTTC record found for this academic year.' });
    }

    // academicYear is the record's identity - not mutable via update, same
    // rule as LibraryRecord.
    const { academicYear: _ignored, createdBy: _ignoredCreatedBy, ...updates } = req.body;

    Object.assign(record, updates);
    record.updatedBy = req.user._id;

    await record.save();

    return res.status(200).json({ success: true, message: 'MMTTC record updated successfully.', record });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteMMTTCRecord = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const record = await MMTTCRecord.findOneAndDelete({ academicYear });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No MMTTC record found for this academic year.' });
    }

    return res.status(200).json({ success: true, message: 'MMTTC record deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── Course-level operations (repeatable sub-resource per the source doc) ────

const addCourse = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const record = await MMTTCRecord.findOne({ academicYear });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No MMTTC record found for this academic year.' });
    }

    record.courses.push(req.body);
    const pushedCourse = record.courses[record.courses.length - 1];

    try {
      await record.validate();
    } catch (validationErr) {
      // Roll back: do not leave an invalid subdocument attached to the
      // in-memory document just because it failed validation - the
      // rejected course must not linger and affect any later operation on
      // this same document instance.
      pushedCourse.deleteOne();
      throw validationErr;
    }

    record.updatedBy = req.user._id;
    await record.save();

    return res.status(201).json({
      success: true,
      message: 'Course added successfully.',
      record
    });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { academicYear, courseId } = req.params;
    const record = await MMTTCRecord.findOne({ academicYear });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No MMTTC record found for this academic year.' });
    }

    const course = record.courses.id(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found in this academic year\'s record.' });
    }

    const { _id: _ignored, ...updates } = req.body;
    const previousValues = course.toObject();
    Object.assign(course, updates);

    try {
      await record.validate();
    } catch (validationErr) {
      // Revert: an invalid update must not remain applied to the
      // in-memory document just because persistence was rejected.
      Object.assign(course, previousValues);
      throw validationErr;
    }

    record.updatedBy = req.user._id;
    await record.save();

    return res.status(200).json({ success: true, message: 'Course updated successfully.', record });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

const removeCourse = async (req, res) => {
  try {
    const { academicYear, courseId } = req.params;
    const record = await MMTTCRecord.findOne({ academicYear });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No MMTTC record found for this academic year.' });
    }

    const course = record.courses.id(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found in this academic year\'s record.' });
    }

    course.deleteOne();
    record.updatedBy = req.user._id;

    await record.save();

    return res.status(200).json({ success: true, message: 'Course removed successfully.', record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listMMTTCRecords,
  getMMTTCRecordByYear,
  createMMTTCRecord,
  updateMMTTCRecord,
  deleteMMTTCRecord,
  addCourse,
  updateCourse,
  removeCourse
};
