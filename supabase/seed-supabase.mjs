// Script to seed Supabase with initial hospital and doctor data
// Run with: node supabase/seed-supabase.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get credentials from environment or command line
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.argv[2];
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.error('Usage: node seed-supabase.js <SUPABASE_URL> <SUPABASE_ANON_KEY>');
  console.error('Or set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || '';
    });
    data.push(row);
  }
  
  return data;
}

// Seed hospitals from CSV files
async function seedHospitals() {
  console.log('Seeding hospitals...');
  
  const csvDir = path.join(__dirname, '../data/csv');
  const hospitalFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv') && !f.includes('doctor'));
  
  let totalHospitals = 0;
  
  for (const file of hospitalFiles) {
    const filePath = path.join(csvDir, file);
    console.log(`  Processing ${file}...`);
    
    const rows = parseCSV(filePath);
    
    // Map state from filename
    const stateMap = {
      'Sachsen_Anhalt': 'ST',
      'Brandenburg': 'BB',
      'Mecklenburg': 'MV',
      'Thueringen': 'TH',
      'Sachsen': 'SN',
      'Hessen': 'HE',
      'Niedersachsen': 'NI',
      'Bayern': 'BY',
      'Baden': 'BW'
    };
    
    let state = 'DE';
    for (const [key, value] of Object.entries(stateMap)) {
      if (file.includes(key)) {
        state = value;
        break;
      }
    }
    
    const hospitals = rows.map(row => ({
      name: row['Name'] || row['Hospital Name'] || 'Unknown',
      website_url: row['Website'] || row['website'] || '',
      career_page_url: row['Stellenlink'] || row['Career URL'] || row['career_page_url'] || '',
      contact_info: row['Kontakt'] || row['Contact'] || '',
      state: state,
      city: '',
      portal_type: 'unknown'
    })).filter(h => h.name && h.name !== 'Unknown');
    
    if (hospitals.length > 0) {
      const { error } = await supabase
        .from('hospitals')
        .upsert(hospitals, { onConflict: 'name' });
      
      if (error) {
        console.error(`  Error seeding ${file}:`, error.message);
      } else {
        console.log(`  Added ${hospitals.length} hospitals from ${file}`);
        totalHospitals += hospitals.length;
      }
    }
  }
  
  console.log(`Total hospitals seeded: ${totalHospitals}`);
}

// Seed doctors from CSV
async function seedDoctors() {
  console.log('Seeding doctors...');
  
  const doctorFile = path.join(__dirname, '../data/csv/doctors_matchingliste.csv');
  
  if (!fs.existsSync(doctorFile)) {
    console.log('  No doctors CSV found, skipping...');
    return;
  }
  
  const rows = parseCSV(doctorFile);
  
  const doctors = rows.map(row => ({
    first_name: row['Vorname'] || row['First Name'] || '',
    last_name: row['Nachname'] || row['Last Name'] || '',
    email: row['E-Mail'] || row['Email'] || '',
    specialties: JSON.stringify(row['Fachrichtung']?.split(';').map(s => s.trim()).filter(Boolean) || []),
    desired_states: JSON.stringify(row['Wunsch-Bundesländer']?.split(';').map(s => s.trim()).filter(Boolean) || []),
    status: 'active'
  })).filter(d => d.first_name || d.last_name);
  
  if (doctors.length > 0) {
    const { error } = await supabase
      .from('doctors')
      .upsert(doctors, { onConflict: 'email' });
    
    if (error) {
      console.error('Error seeding doctors:', error.message);
    } else {
      console.log(`Seeded ${doctors.length} doctors`);
    }
  }
}

// Main
async function main() {
  console.log('Starting Supabase seed...');
  console.log(`URL: ${supabaseUrl}`);
  
  await seedHospitals();
  await seedDoctors();
  
  console.log('Done!');
}

main().catch(console.error);
