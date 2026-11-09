// modules/events/routes/register.js
const express = require('express');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const { auth } = require('../../faculty/middleware/auth');
const { Booking } = require('../models/Booking');
const EventReport = require('../models/EventReport');

const router = express.Router();
router.use(auth); // readable by any authenticated institutional user; approved-only data

async function queryApproved(req) {
  const { programName, department, venue, dateFrom, dateTo, targetGroup, academicYear } = req.query;
  const reportFilter = { isCurrent: true, reviewStatus: 'approved' };
  if (programName) reportFilter.nameOfProgram = { $regex: programName, $options: 'i' };
  if (department) reportFilter.conductingDepartment = department;
  if (targetGroup) reportFilter.targetGroupBeneficiaries = targetGroup;

  const reports = await EventReport.find(reportFilter).populate({
    path: 'booking',
    populate: { path: 'venue leadFaculty supportingFaculty' },
  });

  return reports.filter((r) => {
    if (!r.booking) return false;
    if (venue && r.booking.venue?._id?.toString() !== venue) return false;
    if (dateFrom && r.booking.date < new Date(dateFrom)) return false;
    if (dateTo && r.booking.date > new Date(dateTo)) return false;
    if (academicYear) {
      // academicYear like "2026-27" => Jun(year) - May(year+1), matches Indian AY convention.
      const [startYear] = academicYear.split('-').map(Number);
      const ayStart = new Date(Date.UTC(startYear, 5, 1));
      const ayEnd = new Date(Date.UTC(startYear + 1, 4, 31, 23, 59, 59));
      if (r.booking.date < ayStart || r.booking.date > ayEnd) return false;
    }
    return true;
  });
}

// GET /api/events/register — searchable register of approved/published events
router.get('/', async (req, res) => {
  try {
    const reports = await queryApproved(req);
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events/register/:reportId — one record, full detail incl. gallery/downloads
router.get('/:reportId', async (req, res) => {
  try {
    const report = await EventReport.findOne({ _id: req.params.reportId, reviewStatus: 'approved' })
      .populate({ path: 'booking', populate: { path: 'venue leadFaculty supportingFaculty' } });
    if (!report) return res.status(404).json({ message: 'Not found or not yet approved' });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events/register/export/pdf
router.get('/export/pdf', async (req, res) => {
  try {
    const reports = await queryApproved(req);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="current-activities.pdf"');
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(16).text('Current Activities Register', { align: 'center' });
    doc.moveDown();
    reports.forEach((r, i) => {
      doc.fontSize(12).text(`${i + 1}. ${r.nameOfProgram}`);
      doc.fontSize(9).text(`Department: ${r.conductingDepartment}  |  Venue: ${r.programVenue}`);
      doc.fontSize(9).text(`Date: ${r.dateFrom ? new Date(r.dateFrom).toDateString() : ''} - ${r.dateTo ? new Date(r.dateTo).toDateString() : ''}`);
      doc.fontSize(9).text(`Participants: ${r.numberOfParticipants ?? ''}  |  Resource Person: ${r.resourcePerson}`);
      doc.moveDown(0.5);
    });
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Export failed' });
  }
});

// GET /api/events/register/export/excel
router.get('/export/excel', async (req, res) => {
  try {
    const reports = await queryApproved(req);
    const rows = reports.map((r) => ({
      'Name of Program': r.nameOfProgram,
      'Conducting Department': r.conductingDepartment,
      'Person in Charge': r.personInCharge,
      'Program Venue': r.programVenue,
      'Target Group': (r.targetGroupBeneficiaries || []).join(', '),
      'Date From': r.dateFrom ? new Date(r.dateFrom).toISOString().slice(0, 10) : '',
      'Date To': r.dateTo ? new Date(r.dateTo).toISOString().slice(0, 10) : '',
      'Expected Strength': r.expectedStrength,
      'Number of Participants': r.numberOfParticipants,
      'Objectives': r.objectives,
      'Resource Person': r.resourcePerson,
      'Brief Event Report': r.briefEventReport,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Current Activities');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="current-activities.xlsx"');
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Export failed' });
  }
});

module.exports = router;
