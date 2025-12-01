#!/usr/bin/env python3
"""
Script to generate seedHospitals.js from multiple state CSV files
"""
import csv
import re

def escape_js_string(s):
    if not s:
        return ''
    s = s.replace('\\', '\\\\')
    s = s.replace("'", "\\'")
    s = s.replace('\n', ' ')
    s = s.replace('\r', '')
    s = s.replace('\t', ' ')
    s = ' '.join(s.split())
    return s

def extract_emails(contact):
    if not contact:
        return ''
    emails = re.findall(r'[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}', contact)
    return ', '.join(emails[:2]) if emails else ''

def parse_csv(csv_file, state_code):
    """Parse CSV and return list of hospital dicts"""
    hospitals = []
    seen_names = set()
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if i == 0:
                continue
            
            if not row or len(row) < 3:
                continue
            
            name = row[0].strip().replace('\n', ' ').replace('\r', '') if row[0] else ''
            name = ' '.join(name.split())
            
            website = row[1].strip() if len(row) > 1 and row[1] else ''
            career_url = row[2].strip() if len(row) > 2 and row[2] else ''
            
            # Determine contact column - it's column 3 unless column 3 is a URL (then it's column 4)
            contact = ''
            if len(row) > 3:
                col3 = row[3].strip() if row[3] else ''
                # If column 3 looks like a URL, contact is in column 4
                if col3.startswith('http'):
                    contact = row[4].strip() if len(row) > 4 and row[4] else ''
                else:
                    contact = col3
            
            if not name or name == 'Klinik name' or 'Dauerhaft geschlossen' in website:
                continue
            if not career_url or not career_url.startswith('http'):
                continue
            if '---' in career_url:
                continue
            
            if name in seen_names:
                continue
            seen_names.add(name)
            
            emails = extract_emails(contact)
            
            hospitals.append({
                'name': escape_js_string(name),
                'website': website,
                'career_url': career_url,
                'contact': escape_js_string(contact),
                'emails': emails,
                'state': state_code
            })
    
    return hospitals

# State CSV files to process - Using local paths from data/csv folder
import os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), 'data', 'csv')

STATE_CSVS = [
    (os.path.join(CSV_DIR, '001_Sachsen_Anhalt.csv'), 'ST'),
    (os.path.join(CSV_DIR, '002_Brandenburg.csv'), 'BB'),
    (os.path.join(CSV_DIR, '003_Mecklenburg_Vorpommern.csv'), 'MV'),
    (os.path.join(CSV_DIR, '004_Thueringen.csv'), 'TH'),
    (os.path.join(CSV_DIR, '005_Sachsen.csv'), 'SN'),
    (os.path.join(CSV_DIR, '006_Hessen.csv'), 'HE'),
    (os.path.join(CSV_DIR, '007_Baden_Wuerttemberg.csv'), 'BW'),
    (os.path.join(CSV_DIR, '009_Niedersachsen.csv'), 'NI'),
    (os.path.join(CSV_DIR, '010_Bayern.csv'), 'BY'),
]

OUTPUT_FILE = '/Users/felipeyanez/Desktop/test/med-match-552fee92/src/data/seedHospitals.js'

all_hospitals = []

for csv_file, state_code in STATE_CSVS:
    try:
        hospitals = parse_csv(csv_file, state_code)
        print(f"{state_code}: {len(hospitals)} hospitals from {csv_file.split('/')[-1]}")
        all_hospitals.extend(hospitals)
    except Exception as e:
        print(f"Error processing {csv_file}: {e}")

print(f"\nTotal: {len(all_hospitals)} hospitals")

# Write output file
with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
    out.write('// Hospitals Seed Data for Multiple German States\n')
    out.write(f'// Total: {len(all_hospitals)} hospitals\n\n')
    out.write('export const seedHospitals = [\n')
    
    for i, h in enumerate(all_hospitals):
        comma = ',' if i < len(all_hospitals) - 1 else ''
        # Keep full contact info including names, emails, phones
        contact_str = escape_js_string(h['contact']) if h['contact'] else ''
        emails_str = h['emails'] if h['emails'] else ''
        out.write(f"""  {{
    id: 'hosp-{i+1}',
    name: '{h['name']}',
    website: '{h['website']}',
    career_url: '{h['career_url']}',
    contact: '{contact_str}',
    emails: '{emails_str}',
    portal_type: 'html',
    region: '{h['state']}'
  }}{comma}
""")
    
    out.write('''];

// Export function to load hospitals into localStorage
export async function loadSeedHospitals(forceReload = false) {
  const storageKey = 'med_match_hospital';
  const existingData = localStorage.getItem(storageKey);
  const existing = existingData ? JSON.parse(existingData) : [];
  
  if (!existingData || existing.length < seedHospitals.length || forceReload) {
    const hospitalsWithCareerUrl = seedHospitals.map(h => ({
      ...h,
      careerPageUrl: h.career_url,
      websiteUrl: h.website,
      state: h.region,
      contactInfo: h.contact,
      contactEmails: h.emails,
      notes: h.contact,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }));
    localStorage.setItem(storageKey, JSON.stringify(hospitalsWithCareerUrl));
    console.log('Loaded ' + seedHospitals.length + ' seed hospitals (was ' + existing.length + ')');
    return hospitalsWithCareerUrl;
  }
  return existing;
}

export const SCRAPEABLE_PORTALS = ["html", "pdf", "structured"];
''')

print(f"Written to {OUTPUT_FILE}")
