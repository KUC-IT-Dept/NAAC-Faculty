require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const DropdownConfig = require('./models/DropdownConfig');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(s => s.trim());
}

async function seedInstitutions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/naac-faculty');
    console.log('Connected to MongoDB');

    const csvPath = path.resolve(__dirname, '../../world-universities.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n').filter(l => l.trim() !== '');
    
    const institutionsSet = new Set();

    for (const line of lines) {
      const parts = parseCSVLine(line);
      if (parts.length >= 2) {
        let name = parts[1];
        if (name) {
          institutionsSet.add(name);
        }
      }
    }

    const options = Array.from(institutionsSet).sort();
    
    await DropdownConfig.findOneAndUpdate(
      { key: 'institutions' },
      { options },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Successfully seeded ${options.length} institutions.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding institutions:', err);
    process.exit(1);
  }
}

seedInstitutions();
