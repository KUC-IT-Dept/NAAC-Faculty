// modules/events/services/bookingService.js
const mongoose = require('mongoose');
const { Booking } = require('../models/Booking');
const Venue = require('../models/Venue');
const SlotConfig = require('../models/SlotConfig');

const REPORT_DEADLINE_HOURS = 48;

function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Combine a calendar date with an "HH:mm" time into an absolute Date.
// NOTE: dates/times are stored and compared as absolute instants (UTC).
// The institution's configured timezone offset should be applied by the
// caller if the deployment ever spans multiple timezones; for a single
// campus running in one timezone this is a fixed, documented assumption.
function combineDateAndTime(date, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

async function resolveSlotTimes({ date, slotType, standardSlotNumber, startTime, endTime }) {
  if (slotType === 'standard') {
    if (![1, 2, 3].includes(standardSlotNumber)) {
      const err = new Error('standardSlotNumber must be 1, 2 or 3');
      err.status = 400;
      throw err;
    }
    const config = await SlotConfig.findOne({ key: 'standard_slots' }) || new SlotConfig();
    const slot = config.slots.find((s) => s.slotNumber === standardSlotNumber);
    if (!slot) {
      const err = new Error(`Standard slot ${standardSlotNumber} is not configured`);
      err.status = 400;
      throw err;
    }
    return {
      startTime: combineDateAndTime(date, slot.startTime),
      endTime: combineDateAndTime(date, slot.endTime),
    };
  }

  // Custom slot: HOD supplies explicit start/end.
  if (!startTime || !endTime) {
    const err = new Error('Custom bookings require startTime and endTime');
    err.status = 400;
    throw err;
  }
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (!(start < end)) {
    const err = new Error('startTime must be before endTime');
    err.status = 400;
    throw err;
  }
  return { startTime: start, endTime: end };
}

function computeReportDeadline(endTime) {
  return new Date(new Date(endTime).getTime() + REPORT_DEADLINE_HOURS * 60 * 60 * 1000);
}

// Checks for overlap against ALL confirmed bookings on the venue+date,
// covering standard-vs-custom and custom-vs-custom overlap. Must be called
// inside the same transaction/session as the insert that follows it.
async function findConflictingBookings({ venue, date, startTime, endTime, excludeBookingId }, session) {
  const dayStart = startOfDayUTC(date);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const query = {
    venue,
    status: 'confirmed',
    date: { $gte: dayStart, $lt: dayEnd },
    // standard interval overlap test: existing.start < new.end AND existing.end > new.start
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  return Booking.find(query).session(session || null);
}

async function checkVenueMaintenanceConflict(venueId, startTime, endTime) {
  const venue = await Venue.findById(venueId);
  if (!venue) {
    const err = new Error('Venue not found');
    err.status = 404;
    throw err;
  }
  if (!venue.isActive) {
    const err = new Error('Venue is inactive');
    err.status = 409;
    throw err;
  }
  const conflict = (venue.maintenancePeriods || []).some(
    (p) => new Date(p.from) < endTime && new Date(p.to) > startTime
  );
  if (conflict) {
    const err = new Error('Venue is under maintenance during the requested time');
    err.status = 409;
    throw err;
  }
  return venue;
}

// Database-safe confirm: runs the conflict check and the status flip to
// 'confirmed' inside one transaction, so two simultaneous confirm requests
// for an overlapping time can never both succeed. The partial unique index
// on Booking (venue+date+standardSlotNumber, status=confirmed) is the hard
// backstop for standard slots even if a transaction isn't available (e.g.
// a standalone Mongo instance in local dev without a replica set).
async function confirmViaTransaction(bookingId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        const err = new Error('Booking not found');
        err.status = 404;
        throw err;
      }
      if (booking.status === 'confirmed') {
        result = booking; // idempotent
        return;
      }

      const conflicts = await findConflictingBookings({
        venue: booking.venue,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        excludeBookingId: booking._id,
      }, session);

      if (conflicts.length > 0) {
        const err = new Error('Venue is already booked for an overlapping time');
        err.status = 409;
        throw err;
      }

      booking.status = 'confirmed';
      await booking.save({ session });
      result = booking;
    });
    return result;
  } finally {
    session.endSession();
  }
}

// Fallback path for deployments where MongoDB runs as a standalone instance
// (no replica set => no multi-document transactions). Still safe for the
// standard-slot case because of the partial unique index: a duplicate-key
// error on save is treated as a conflict. For custom-time overlaps this is
// a best-effort check-then-write (a vanishingly narrow race remains); the
// recommended production setup is a replica-set MongoDB so the transaction
// path above is used instead. See deliverables doc for this caveat.
async function confirmWithoutTransaction(bookingId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  if (booking.status === 'confirmed') return booking;

  const conflicts = await findConflictingBookings({
    venue: booking.venue,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    excludeBookingId: booking._id,
  });
  if (conflicts.length > 0) {
    const err = new Error('Venue is already booked for an overlapping time');
    err.status = 409;
    throw err;
  }

  booking.status = 'confirmed';
  try {
    await booking.save();
  } catch (e) {
    if (e && e.code === 11000) {
      const err = new Error('Venue is already booked for an overlapping time');
      err.status = 409;
      throw err;
    }
    throw e;
  }
  return booking;
}

function isTransactionsUnsupportedError(e) {
  const msg = (e && e.message) || '';
  return /Transaction numbers are only allowed on a replica set|IllegalOperation|Transactions are not supported/i.test(msg);
}

async function confirmBookingSafely(bookingId) {
  try {
    return await confirmViaTransaction(bookingId);
  } catch (e) {
    if (isTransactionsUnsupportedError(e)) {
      return confirmWithoutTransaction(bookingId);
    }
    throw e;
  }
}

module.exports = {
  REPORT_DEADLINE_HOURS,
  startOfDayUTC,
  combineDateAndTime,
  resolveSlotTimes,
  computeReportDeadline,
  findConflictingBookings,
  checkVenueMaintenanceConflict,
  confirmBookingSafely,
};
