#!/usr/bin/env python3
"""
Script to add hospitals from a CSV file to an existing seedHospitals.js
"""
import sys
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
    """Parse CSV and return list of hospital objects"""
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
            if not career_url or not career_url.startswith('http'):
                continue
            
            # Skip duplicates
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

def main():
    if len(sys.argv) < 4:
        print("Usage: python add_state_csv.py <csv_file> <state_code> <output_file>")
        print("Example: python add_state_csv.py sachsen.csv ST seedHospitals.js")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    state_code = sys.argv[2]
    output_file = sys.argv[3]
    
    # Read existing file to find current hospital count
    existing_count = 0
    existing_content = []
    
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            content = f.read()
            # Count existing hospitals by counting "id: 'hosp-"
            existing_count = content.count("id: 'hosp-")
            # Find where the array ends
            array_end = content.rfind('];')
            if array_end > 0:
                existing_content = content[:array_end]
    except FileNotFoundError:
        print(f"Output file {output_file} not found, creating new file")
        existing_content = None
    
    # Parse new hospitals
    new_hospitals = parse_csv(csv_file, state_code)
    print(f"Found {len(new_hospitals)} valid hospitals in {csv_file} for state {state_code}")
    
    if not new_hospitals:
        print("No hospitals to add")
        return
    
    # Generate new hospital entries
    new_entries = []
    for i, h in enumerate(new_hospitals):
        idx = existing_count + i + 1
        contact_str = h['emails'] if h['emails'] else h['contact'][:100] if h['contact'] else ''
        entry = f"""  {{
    id: 'hosp-{idx}',
    name: '{h['name']}',
    website: '{h['website']}',
    career_url: '{h['career_url']}',
    contact: '{escape_js_string(contact_str)}',
    portal_type: 'html',
    region: '{state_code}'
  }}"""
        new_entries.append(entry)
    
    if existing_content:
        # Append to existing file
        # Remove trailing whitespace and add comma after last existing entry
        existing_content = existing_content.rstrip()
        if not existing_content.endswith(','):
            existing_content += ','
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(existing_content)
            f.write('\n')
            f.write(',\n'.join(new_entries))
            f.write('\n')
            f.write('''];

// Export function to load hospitals into localStorage
export async function loadSeedHospitals(forceReload = false) {
  // Use the same key as base44Client: med_match_hospital
  const storageKey = 'med_match_hospital';
  const existingData = localStorage.getItem(storageKey);
  const existing = existingData ? JSON.parse(existingData) : [];
  
  // Always reload if we have fewer hospitals than seed data or forceReload is true
  if (!existingData || existing.length < seedHospitals.length || forceReload) {
    // Transform seed data to match entity format
    const hospitalsWithCareerUrl = seedHospitals.map(h => ({
      ...h,
      careerPageUrl: h.career_url,
      websiteUrl: h.website,
      state: h.region, // Use region as state code
      notes: h.contact, // Map contact to notes for display
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
    else:
        # Create new file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('// Hospitals Seed Data\n')
            f.write(f'// Generated with {len(new_hospitals)} hospitals\n\n')
            f.write('export const seedHospitals = [\n')
            f.write(',\n'.join(new_entries))
            f.write('\n];\n')
    
    total = existing_count + len(new_hospitals)
    print(f"Added {len(new_hospitals)} hospitals. Total now: {total}")

if __name__ == '__main__':
    main()
