// seeders/eventVenueSeeder.js
// Seeds the initial venue list from the Current Activities tracker. Idempotent
// (upsert by name) — safe to run more than once. This is a one-time starting
// point only: venues are fully editable afterwards via /api/events/venues.
const mongoose = require('mongoose');
const Venue = require('../modules/events/models/Venue');

const INITIAL_VENUES = [
  { name: 'Seminar Hall 1', venueType: 'Hall' },
  { name: 'Seminar Hall 2', venueType: 'Hall' },
  { name: 'Seminar Hall 3', venueType: 'Hall' },
  { name: 'Seminar Hall 4', venueType: 'Hall' },
  { name: 'Seminar Hall 5', venueType: 'Hall' },
  { name: 'Playground', venueType: 'Ground' },
  { name: 'Others', venueType: 'Other', isCustom: true },
];

async function seedEventVenues() {
  for (const v of INITIAL_VENUES) {
    await Venue.updateOne({ name: v.name }, { $setOnInsert: v }, { upsert: true });
  }
  console.log(`[eventVenueSeeder] Ensured ${INITIAL_VENUES.length} initial venues exist.`);
}

if (require.main === module) {
  require('dotenv').config({ path: __dirname + '/../.env' });
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/iqac')
    .then(seedEventVenues)
    .then(() => mongoose.disconnect())
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { seedEventVenues, INITIAL_VENUES };
