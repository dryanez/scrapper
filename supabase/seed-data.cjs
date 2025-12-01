// Seed Supabase with hospital and doctor data
// Run with: node supabase/seed-data.cjs

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mszpskizddxiutgugezz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zenBza2l6ZGR4aXV0Z3VnZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDE0NTcsImV4cCI6MjA4MDE3NzQ1N30.N4vUK9bI13i28BOTKH1udy8HlWap3t6QEg8YGHmx1mQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Hospital data from CSV files (simplified version - key hospitals)
const hospitals = [
  // Sachsen-Anhalt (ST)
  { name: "Universitätsklinikum Magdeburg", city: "Magdeburg", state: "ST", website_url: "https://www.med.uni-magdeburg.de/", career_page_url: "https://www.med.uni-magdeburg.de/Karriere.html" },
  { name: "Universitätsklinikum Halle", city: "Halle", state: "ST", website_url: "https://www.umh.de/", career_page_url: "https://www.umh.de/karriere" },
  { name: "Klinikum Magdeburg", city: "Magdeburg", state: "ST", website_url: "https://www.klinikum-magdeburg.de/", career_page_url: "https://www.klinikum-magdeburg.de/karriere" },
  
  // Brandenburg (BB)
  { name: "Klinikum Ernst von Bergmann", city: "Potsdam", state: "BB", website_url: "https://www.klinikumevb.de/", career_page_url: "https://www.klinikumevb.de/karriere" },
  { name: "Carl-Thiem-Klinikum Cottbus", city: "Cottbus", state: "BB", website_url: "https://www.ctk.de/", career_page_url: "https://www.ctk.de/karriere" },
  { name: "Städtisches Klinikum Brandenburg", city: "Brandenburg", state: "BB", website_url: "https://www.klinikum-brandenburg.de/", career_page_url: "https://www.klinikum-brandenburg.de/karriere" },
  
  // Mecklenburg-Vorpommern (MV)
  { name: "Universitätsmedizin Rostock", city: "Rostock", state: "MV", website_url: "https://www.med.uni-rostock.de/", career_page_url: "https://www.med.uni-rostock.de/karriere" },
  { name: "Universitätsmedizin Greifswald", city: "Greifswald", state: "MV", website_url: "https://www.medizin.uni-greifswald.de/", career_page_url: "https://www.medizin.uni-greifswald.de/karriere" },
  { name: "Klinikum Südstadt Rostock", city: "Rostock", state: "MV", website_url: "https://www.kliniksued-rostock.de/", career_page_url: "https://www.kliniksued-rostock.de/karriere" },
  
  // Thüringen (TH)
  { name: "Universitätsklinikum Jena", city: "Jena", state: "TH", website_url: "https://www.uniklinikum-jena.de/", career_page_url: "https://www.uniklinikum-jena.de/Karriere.html" },
  { name: "HELIOS Klinikum Erfurt", city: "Erfurt", state: "TH", website_url: "https://www.helios-gesundheit.de/kliniken/erfurt/", career_page_url: "https://www.helios-gesundheit.de/kliniken/erfurt/karriere/" },
  { name: "SRH Wald-Klinikum Gera", city: "Gera", state: "TH", website_url: "https://www.srh-wald-klinikum.de/", career_page_url: "https://www.srh-wald-klinikum.de/karriere" },
  
  // Sachsen (SN)
  { name: "Universitätsklinikum Dresden", city: "Dresden", state: "SN", website_url: "https://www.uniklinikum-dresden.de/", career_page_url: "https://www.uniklinikum-dresden.de/de/jobs-und-karriere" },
  { name: "Universitätsklinikum Leipzig", city: "Leipzig", state: "SN", website_url: "https://www.uniklinikum-leipzig.de/", career_page_url: "https://www.uniklinikum-leipzig.de/karriere" },
  { name: "Klinikum Chemnitz", city: "Chemnitz", state: "SN", website_url: "https://www.klinikumchemnitz.de/", career_page_url: "https://www.klinikumchemnitz.de/karriere" },
  
  // Hessen (HE)
  { name: "Universitätsklinikum Frankfurt", city: "Frankfurt", state: "HE", website_url: "https://www.kgu.de/", career_page_url: "https://www.kgu.de/karriere" },
  { name: "Universitätsklinikum Gießen und Marburg", city: "Gießen", state: "HE", website_url: "https://www.ukgm.de/", career_page_url: "https://www.ukgm.de/karriere" },
  { name: "Klinikum Kassel", city: "Kassel", state: "HE", website_url: "https://www.klinikum-kassel.de/", career_page_url: "https://www.klinikum-kassel.de/karriere" },
  { name: "Klinikum Darmstadt", city: "Darmstadt", state: "HE", website_url: "https://www.klinikum-darmstadt.de/", career_page_url: "https://www.klinikum-darmstadt.de/karriere" },
  
  // Baden-Württemberg (BW)
  { name: "Universitätsklinikum Heidelberg", city: "Heidelberg", state: "BW", website_url: "https://www.klinikum.uni-heidelberg.de/", career_page_url: "https://www.klinikum.uni-heidelberg.de/karriere" },
  { name: "Universitätsklinikum Freiburg", city: "Freiburg", state: "BW", website_url: "https://www.uniklinik-freiburg.de/", career_page_url: "https://www.uniklinik-freiburg.de/karriere.html" },
  { name: "Universitätsklinikum Tübingen", city: "Tübingen", state: "BW", website_url: "https://www.medizin.uni-tuebingen.de/", career_page_url: "https://www.medizin.uni-tuebingen.de/karriere" },
  { name: "Universitätsklinikum Ulm", city: "Ulm", state: "BW", website_url: "https://www.uniklinik-ulm.de/", career_page_url: "https://www.uniklinik-ulm.de/karriere.html" },
  { name: "Klinikum Stuttgart", city: "Stuttgart", state: "BW", website_url: "https://www.klinikum-stuttgart.de/", career_page_url: "https://www.klinikum-stuttgart.de/karriere" },
  { name: "Städtisches Klinikum Karlsruhe", city: "Karlsruhe", state: "BW", website_url: "https://www.klinikum-karlsruhe.de/", career_page_url: "https://www.klinikum-karlsruhe.de/karriere" },
  
  // Niedersachsen (NI)
  { name: "Medizinische Hochschule Hannover", city: "Hannover", state: "NI", website_url: "https://www.mhh.de/", career_page_url: "https://www.mhh.de/karriere" },
  { name: "Universitätsmedizin Göttingen", city: "Göttingen", state: "NI", website_url: "https://www.umg.eu/", career_page_url: "https://www.umg.eu/karriere" },
  { name: "Klinikum Braunschweig", city: "Braunschweig", state: "NI", website_url: "https://www.klinikum-braunschweig.de/", career_page_url: "https://www.klinikum-braunschweig.de/karriere" },
  { name: "Klinikum Oldenburg", city: "Oldenburg", state: "NI", website_url: "https://www.klinikum-oldenburg.de/", career_page_url: "https://www.klinikum-oldenburg.de/karriere" },
  
  // Bayern (BY)
  { name: "LMU Klinikum München", city: "München", state: "BY", website_url: "https://www.lmu-klinikum.de/", career_page_url: "https://www.lmu-klinikum.de/karriere" },
  { name: "Klinikum rechts der Isar", city: "München", state: "BY", website_url: "https://www.mri.tum.de/", career_page_url: "https://www.mri.tum.de/karriere" },
  { name: "Universitätsklinikum Würzburg", city: "Würzburg", state: "BY", website_url: "https://www.ukw.de/", career_page_url: "https://www.ukw.de/karriere" },
  { name: "Universitätsklinikum Erlangen", city: "Erlangen", state: "BY", website_url: "https://www.uk-erlangen.de/", career_page_url: "https://www.uk-erlangen.de/karriere" },
  { name: "Universitätsklinikum Regensburg", city: "Regensburg", state: "BY", website_url: "https://www.ukr.de/", career_page_url: "https://www.ukr.de/karriere" },
  { name: "Klinikum Nürnberg", city: "Nürnberg", state: "BY", website_url: "https://www.klinikum-nuernberg.de/", career_page_url: "https://www.klinikum-nuernberg.de/karriere" },
  { name: "Klinikum Augsburg", city: "Augsburg", state: "BY", website_url: "https://www.uk-augsburg.de/", career_page_url: "https://www.uk-augsburg.de/karriere" },
  
  // Berlin (BE)
  { name: "Charité – Universitätsmedizin Berlin", city: "Berlin", state: "BE", website_url: "https://www.charite.de/", career_page_url: "https://www.charite.de/karriere/" },
  { name: "Vivantes Klinikum", city: "Berlin", state: "BE", website_url: "https://www.vivantes.de/", career_page_url: "https://www.vivantes.de/karriere" },
  
  // Nordrhein-Westfalen (NW)
  { name: "Universitätsklinikum Köln", city: "Köln", state: "NW", website_url: "https://www.uk-koeln.de/", career_page_url: "https://www.uk-koeln.de/karriere" },
  { name: "Universitätsklinikum Düsseldorf", city: "Düsseldorf", state: "NW", website_url: "https://www.uniklinik-duesseldorf.de/", career_page_url: "https://www.uniklinik-duesseldorf.de/karriere" },
  { name: "Universitätsklinikum Essen", city: "Essen", state: "NW", website_url: "https://www.uk-essen.de/", career_page_url: "https://www.uk-essen.de/karriere" },
  { name: "Universitätsklinikum Bonn", city: "Bonn", state: "NW", website_url: "https://www.ukbonn.de/", career_page_url: "https://www.ukbonn.de/karriere" },
  { name: "Universitätsklinikum Münster", city: "Münster", state: "NW", website_url: "https://www.ukm.de/", career_page_url: "https://www.ukm.de/karriere" },
];

// Doctor data
const doctors = [
  { first_name: "Anna", last_name: "Müller", email: "anna.mueller@example.com", specialties: ["Innere Medizin"], desired_states: ["BY", "BW"], status: "active" },
  { first_name: "Thomas", last_name: "Schmidt", email: "thomas.schmidt@example.com", specialties: ["Chirurgie"], desired_states: ["NW", "HE"], status: "active" },
  { first_name: "Maria", last_name: "Weber", email: "maria.weber@example.com", specialties: ["Pädiatrie"], desired_states: ["BE", "BB"], status: "active" },
  { first_name: "Michael", last_name: "Fischer", email: "michael.fischer@example.com", specialties: ["Anästhesiologie"], desired_states: ["SN", "TH"], status: "active" },
  { first_name: "Julia", last_name: "Wagner", email: "julia.wagner@example.com", specialties: ["Neurologie"], desired_states: ["NI", "HH"], status: "active" },
  { first_name: "Stefan", last_name: "Becker", email: "stefan.becker@example.com", specialties: ["Orthopädie"], desired_states: ["BY", "BW"], status: "active" },
  { first_name: "Laura", last_name: "Hoffmann", email: "laura.hoffmann@example.com", specialties: ["Gynäkologie"], desired_states: ["HE", "RP"], status: "active" },
  { first_name: "Markus", last_name: "Schäfer", email: "markus.schaefer@example.com", specialties: ["Kardiologie"], desired_states: ["NW", "NI"], status: "active" },
  { first_name: "Sandra", last_name: "Koch", email: "sandra.koch@example.com", specialties: ["Psychiatrie"], desired_states: ["BE", "BB"], status: "active" },
  { first_name: "Andreas", last_name: "Bauer", email: "andreas.bauer@example.com", specialties: ["Radiologie"], desired_states: ["BY", "SN"], status: "active" },
];

async function seedDatabase() {
  console.log('Starting database seed...\n');

  // First, clear existing data
  console.log('Clearing existing data...');
  await supabase.from('hospitals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('doctors').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Seed hospitals
  console.log(`\nSeeding ${hospitals.length} hospitals...`);
  const { data: hospitalData, error: hospitalError } = await supabase
    .from('hospitals')
    .insert(hospitals.map(h => ({
      ...h,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })))
    .select();

  if (hospitalError) {
    console.error('Error seeding hospitals:', hospitalError.message);
  } else {
    console.log(`✅ Seeded ${hospitalData?.length || 0} hospitals`);
  }

  // Seed doctors
  console.log(`\nSeeding ${doctors.length} doctors...`);
  const { data: doctorData, error: doctorError } = await supabase
    .from('doctors')
    .insert(doctors.map(d => ({
      ...d,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })))
    .select();

  if (doctorError) {
    console.error('Error seeding doctors:', doctorError.message);
  } else {
    console.log(`✅ Seeded ${doctorData?.length || 0} doctors`);
  }

  // Verify counts
  console.log('\n--- Verification ---');
  const { count: hCount } = await supabase.from('hospitals').select('*', { count: 'exact', head: true });
  const { count: dCount } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
  console.log(`Hospitals in database: ${hCount}`);
  console.log(`Doctors in database: ${dCount}`);

  console.log('\n✅ Database seeding complete!');
}

seedDatabase().catch(console.error);
