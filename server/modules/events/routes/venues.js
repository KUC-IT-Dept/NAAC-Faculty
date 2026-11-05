// modules/events/routes/venues.js
const express = require('express');
const { auth, adminOnly, hodOnly } = require('../../faculty/middleware/auth');
const Venue = require('../models/Venue');
const SlotConfig = require('../models/SlotConfig');
const EventAuditLog = require('../models/EventAuditLog');

const router = express.Router();
router.use(auth);

const canManageVenues = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'hod') {
    return res.status(403).json({ message: 'HOD or admin access required' });
  }
  next();
};

// GET /api/events/venues — list venues (all authenticated staff can view)
router.get('/', async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const venues = await Venue.find(filter).sort({ name: 1 });
    res.json(venues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/venues — create a venue
router.post('/', canManageVenues, async (req, res) => {
  try {
    const { name, venueType, building, roomNumber, capacity, isCustom, bookingRestrictions } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const venue = await Venue.create({
      name: name.trim(),
      venueType, building, roomNumber, capacity, isCustom, bookingRestrictions,
      createdBy: req.user._id,
    });
    await EventAuditLog.create({ venue: venue._id, action: 'venue_created', performedBy: req.user._id, meta: { name } });
    res.status(201).json(venue);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A venue with this name already exists' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/events/venues/:id — edit venue config
router.patch('/:id', canManageVenues, async (req, res) => {
  try {
    const allowed = ['name', 'venueType', 'building', 'roomNumber', 'capacity', 'isActive', 'bookingRestrictions'];
    const updates = {};
    for (const key of allowed) if (key in req.body) updates[key] = req.body[key];

    const venue = await Venue.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    await EventAuditLog.create({ venue: venue._id, action: 'venue_updated', performedBy: req.user._id, meta: updates });
    res.json(venue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/venues/:id/maintenance — add a maintenance/closure period
router.post('/:id/maintenance', canManageVenues, async (req, res) => {
  try {
    const { from, to, reason } = req.body;
    if (!from || !to) return res.status(400).json({ message: 'from and to are required' });
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });

    venue.maintenancePeriods.push({ from, to, reason: reason || '', createdBy: req.user._id });
    await venue.save();
    await EventAuditLog.create({ venue: venue._id, action: 'venue_maintenance_added', performedBy: req.user._id, meta: { from, to, reason } });
    res.status(201).json(venue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/maintenance/:periodId', canManageVenues, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    venue.maintenancePeriods = venue.maintenancePeriods.filter((p) => p._id.toString() !== req.params.periodId);
    await venue.save();
    res.json(venue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Slot configuration (institution-wide, not hardcoded) ─────────────────────
router.get('/slot-config', async (req, res) => {
  try {
    let config = await SlotConfig.findOne({ key: 'standard_slots' });
    if (!config) config = await SlotConfig.create({});
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/slot-config', adminOnly, async (req, res) => {
  try {
    const { slots, timezone } = req.body;
    if (!Array.isArray(slots) || slots.length !== 3) {
      return res.status(400).json({ message: 'Exactly 3 standard slots are required' });
    }
    let config = await SlotConfig.findOne({ key: 'standard_slots' });
    if (!config) config = new SlotConfig();
    config.slots = slots;
    if (timezone) config.timezone = timezone;
    config.updatedBy = req.user._id;
    await config.save();
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
