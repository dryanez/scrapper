#!/usr/bin/env python3
import sys
import csv
import re

def escape_js_string(s):
    if not s:
        return ''
    # Replace special characters for JS string
    s = s.replace('\\', '\\\\')
    s = s.replace("'", "\\'")
    s = s.replace('\n', ' ')
    s = s.replace('\r', '')
    s = s.replace('\t', ' ')
    # Remove multiple spaces
    s = ' '.join(s.split())
    return s

def extract_emails(contact):
    if not contact:
        return ''
    # Find all email addresses
    emails = re.findall(r'[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}', contact)
    return ', '.join(emails[:2]) if emails else ''

# Read CSV from argument
csv_file = sys.argv[1]
output_file = sys.argv[2]

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
        contact = row[3].strip() if len(row) > 3 and row[3] else ''
        
        # Skip invalid entries
        if not name or name == 'Klinik name' or 'Dauerhaft geschlossen' in website:
            continue
        if not career_url or career_url.startswith('Aktuelle Stellen') or career_url == '---' or not career_url.startswith('http'):
            continue
        
        # Skip duplicates
        if name in seen_names:
            continue
        seen_names.add(name)
        
        # Extract contact info
        emails = extract_emails(contact)
        
        hospitals.append({
            'name': escape_js_string(name),
            'website': website,
            'career_url': career_url,
            'contact': escape_js_string(contact),
            'emails': emails
        })

# Generate JS file
with open(output_file, 'w', encoding='utf-8') as out:
    out.write('// Baden-Württemberg Hospitals Seed Data\n')
    out.write(f'// Generated from CSV with {len(hospitals)} hospitals\n\n')
    out.write('export const seedHospitals = [\n')
    
    for i, h in enumerate(hospitals):
        comma = ',' if i < len(hospitals) - 1 else ''
        contact_str = h['emails'] if h['emails'] else h['contact'][:100] if h['contact'] else ''
        out.write(f"""  {{
    id: 'hosp-{i+1}',
    name: '{h['name']}',
    website: '{h['website']}',
    career_url: '{h['career_url']}',
    contact: '{escape_js_string(contact_str)}',
    portal_type: 'html',
    region: 'Baden-Württemberg'
  }}{comma}
""")
    
    out.write('];\n\n')
    out.write('// Export function to load hospitals into localStorage\n')
    out.write('''export async function loadSeedHospitals() {
  const existingData = localStorage.getItem('Hospital');
  if (!existingData) {
    localStorage.setItem('Hospital', JSON.stringify(seedHospitals));
    console.log(`Loaded ${seedHospitals.length} seed hospitals`);
    return seedHospitals;
  }
  return JSON.parse(existingData);
}

export const SCRAPEABLE_PORTALS = ["html", "pdf", "structured"];
''')

print(f'Generated {output_file} with {len(hospitals)} hospitals')
