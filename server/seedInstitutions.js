require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const DropdownConfig = require('./modules/faculty/models/DropdownConfig');

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
    const institutionsSet = new Set();

    if (fs.existsSync(csvPath)) {
      console.log('Reading institutions from world-universities.csv...');
      const fileContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = fileContent.split('\n').filter(l => l.trim() !== '');
      for (const line of lines) {
        const parts = parseCSVLine(line);
        if (parts.length >= 2) {
          let name = parts[1];
          if (name) {
            institutionsSet.add(name);
          }
        }
      }
    } else {
      console.warn('⚠️  world-universities.csv not found at:', csvPath);
      console.log('ℹ️  Falling back to default Indian/International universities list...');
      const DEFAULT_INSTITUTIONS = [
        'Indian Institute of Technology, Bombay',
        'Indian Institute of Technology, Delhi',
        'Indian Institute of Technology, Madras',
        'Indian Institute of Technology, Kharagpur',
        'Indian Institute of Technology, Kanpur',
        'Indian Institute of Science, Bangalore',
        'University of Delhi',
        'University of Mumbai',
        'Savitribai Phule Pune University',
        'Anna University',
        'Jawaharlal Nehru University',
        'Banaras Hindu University',
        'University of Kerala',
        'University of Calicut',
        'Mahatma Gandhi University',
        'Cochin University of Science and Technology',
        'National Institute of Technology, Trichy',
        'National Institute of Technology, Calicut'
      ];
      DEFAULT_INSTITUTIONS.forEach(name => institutionsSet.add(name));
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
