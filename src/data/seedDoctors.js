// Doctors Seed Data from Matchingliste
// Total: 25 doctors

// German states mapping
const GERMAN_STATES = {
  "Baden-Württemberg": "BW", "Bayern": "BY", "Berlin": "BE", "Brandenburg": "BB",
  "Bremen": "HB", "Hamburg": "HH", "Hessen": "HE", "Mecklenburg-Vorpommern": "MV",
  "Niedersachsen": "NI", "Nordrhein-Westfalen": "NW", "Rheinland-Pfalz": "RP",
  "Saarland": "SL", "Sachsen": "SN", "Sachsen-Anhalt": "ST",
  "Schleswig-Holstein": "SH", "Thüringen": "TH"
};

const ALL_STATE_CODES = Object.values(GERMAN_STATES);

// Parse concatenated specialties into array
const parseSpecialties = (str) => {
  if (!str) return [];
  const specialtyList = [
    "Allgemeinmedizin", "Anästhesie und Intensivmedizin", "Innere Medizin",
    "Orthopädie und Unfallchirurgie", "Pädiatrie", "Chirurgie", "Dermatologie",
    "Gynäkologie", "Neurologie", "Psychiatrie", "Allgemein- und Viszeralchirurgie",
    "Gefäßchirurgie", "Thoraxchirurgie", "Chirurgie ohne Orthopädie",
    "Kinder- und Jugendpsychiatrie", "Notfallmedizin", "Intensivmedizin"
  ];
  
  const found = [];
  let remaining = str;
  
  // Sort by length descending to match longer specialties first
  const sorted = [...specialtyList].sort((a, b) => b.length - a.length);
  
  for (const specialty of sorted) {
    if (remaining.includes(specialty)) {
      found.push(specialty);
      remaining = remaining.replace(specialty, '');
    }
  }
  
  return found;
};

// Parse desired states from text
const parseDesiredStates = (str) => {
  if (!str) return [];
  const lower = str.toLowerCase();
  if (lower.includes('bundesweit')) {
    return ALL_STATE_CODES;
  }
  
  const found = [];
  for (const [name, code] of Object.entries(GERMAN_STATES)) {
    if (str.includes(name)) {
      found.push(code);
    }
  }
  return found.length > 0 ? found : [];
};

export const seedDoctors = [
  {
    id: 'doc-1',
    firstName: 'Kasim',
    lastName: 'Kleeb',
    email: 'kleeb.kasim@gmail.com',
    specialties: ['Allgemeinmedizin', 'Anästhesie und Intensivmedizin', 'Innere Medizin', 'Orthopädie und Unfallchirurgie', 'Pädiatrie', 'Chirurgie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-2',
    firstName: 'Sanad',
    lastName: 'Darwish',
    email: 'sanad.6000@hotmail.com',
    specialties: ['Allgemein- und Viszeralchirurgie', 'Gefäßchirurgie', 'Orthopädie und Unfallchirurgie', 'Thoraxchirurgie', 'Chirurgie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-3',
    firstName: 'Samir',
    lastName: 'Darwish',
    email: 'samdarwish6@gmail.com',
    specialties: ['Allgemein- und Viszeralchirurgie', 'Gefäßchirurgie', 'Orthopädie und Unfallchirurgie', 'Thoraxchirurgie', 'Chirurgie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-4',
    firstName: 'Luca',
    lastName: 'Bellaio',
    email: 'luca.bellaio@unimedizin-mainz.de',
    specialties: ['Allgemein- und Viszeralchirurgie', 'Gefäßchirurgie', 'Orthopädie und Unfallchirurgie', 'Thoraxchirurgie', 'Chirurgie'],
    desiredStates: ['SN'],
    status: 'active'
  },
  {
    id: 'doc-5',
    firstName: 'Naser',
    lastName: 'Alamasy',
    email: 'nasser.alamasy@gmail.com',
    specialties: ['Allgemein- und Viszeralchirurgie', 'Gefäßchirurgie', 'Orthopädie und Unfallchirurgie', 'Thoraxchirurgie', 'Chirurgie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-6',
    firstName: 'Tom',
    lastName: 'Philip',
    email: 'drphiliptom7@gmail.com',
    specialties: ['Orthopädie und Unfallchirurgie', 'Chirurgie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-7',
    firstName: 'Zelin',
    lastName: 'Topac',
    email: 'zelintopac@gmail.com',
    specialties: ['Allgemein- und Viszeralchirurgie', 'Anästhesie und Intensivmedizin', 'Intensivmedizin'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-8',
    firstName: 'Klod Paturelle',
    lastName: 'Jonte Mbianda',
    email: 'klodmbianda@gmail.com',
    specialties: ['Innere Medizin'],
    desiredStates: ['BY', 'SN', 'BB'],
    status: 'active'
  },
  {
    id: 'doc-9',
    firstName: 'Joshua',
    lastName: 'Biju',
    email: 'joshuabiju107@gmail.com',
    specialties: ['Anästhesie und Intensivmedizin'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-10',
    firstName: 'Cassini William',
    lastName: 'Krikstapone',
    email: 'cassini.william23@gmail.com',
    specialties: ['Innere Medizin'],
    desiredStates: ALL_STATE_CODES,
    status: 'active'
  },
  {
    id: 'doc-11',
    firstName: 'Nemer',
    lastName: 'Ghanem',
    email: 'nemer.b.g@gmail.com',
    specialties: ['Dermatologie', 'Innere Medizin', 'Pädiatrie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-12',
    firstName: 'Angelina',
    lastName: 'Zgurovska',
    email: 'ani_z90@abv.bg',
    specialties: ['Anästhesie und Intensivmedizin'],
    desiredStates: ['BY'],
    status: 'active'
  },
  {
    id: 'doc-13',
    firstName: 'Ahmed',
    lastName: 'Abu Bader',
    email: 'dr.abubaderahmad@gmail.com',
    specialties: ['Allgemeinmedizin', 'Dermatologie', 'Neurologie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-14',
    firstName: 'Mostafa',
    lastName: 'Saad',
    email: 'drsaadmostafa@gmail.com',
    specialties: ['Allgemeinmedizin', 'Anästhesie und Intensivmedizin', 'Notfallmedizin', 'Intensivmedizin', 'Innere Medizin'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-15',
    firstName: 'Mazen',
    lastName: 'Abou Chaar',
    email: 'mazen123.mazen@gmail.com',
    specialties: ['Allgemeinmedizin', 'Innere Medizin', 'Kinder- und Jugendpsychiatrie', 'Pädiatrie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-16',
    firstName: 'Haitham',
    lastName: 'Alamour',
    email: 'dr.alamour16@yahoo.com',
    specialties: ['Gynäkologie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-17',
    firstName: 'Alex John',
    lastName: 'Thaissery',
    email: 'alexjohnt@gmail.com',
    specialties: ['Gynäkologie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-18',
    firstName: 'Easha',
    lastName: 'Ray',
    email: 'easharay@gmail.com',
    specialties: ['Gynäkologie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-19',
    firstName: 'Kingsley Arinze',
    lastName: 'Okeke',
    email: 'okekekingsley046@gmail.com',
    specialties: ['Anästhesie und Intensivmedizin', 'Notfallmedizin', 'Intensivmedizin'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-20',
    firstName: 'Giorgi',
    lastName: 'Kuprashvili',
    email: 'giorgikuprashvili13@gmail.com',
    specialties: ['Anästhesie und Intensivmedizin', 'Notfallmedizin', 'Intensivmedizin'],
    desiredStates: ['SN'],
    status: 'active'
  },
  {
    id: 'doc-21',
    firstName: 'Agit',
    lastName: 'Güneş',
    email: 'agit_211@outlook.com',
    specialties: ['Anästhesie und Intensivmedizin', 'Notfallmedizin', 'Intensivmedizin'],
    desiredStates: ALL_STATE_CODES,
    status: 'active'
  },
  {
    id: 'doc-22',
    firstName: 'Thanyawat',
    lastName: 'Khetsakul',
    email: 't.khetsakul@gmail.com',
    specialties: ['Anästhesie und Intensivmedizin', 'Notfallmedizin', 'Intensivmedizin'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-23',
    firstName: 'Dac Bich Quynh',
    lastName: 'Nguyen',
    email: 'nguyendacbichquynh@gmail.com',
    specialties: ['Anästhesie und Intensivmedizin', 'Notfallmedizin', 'Intensivmedizin'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-24',
    firstName: 'Elham',
    lastName: 'Sheikhsagha',
    email: 'elhamsheikhsagha@gumed.edu.pl',
    specialties: ['Innere Medizin'],
    desiredStates: ['BW', 'HE', 'NI'],
    status: 'active'
  },
  {
    id: 'doc-25',
    firstName: 'Lana Khaled Abdelhalim',
    lastName: 'Hussein',
    email: 'lana.khaled.nis@hotmail.com',
    specialties: ['Gefäßchirurgie', 'Orthopädie und Unfallchirurgie', 'Thoraxchirurgie', 'Chirurgie'],
    desiredStates: ['ST', 'TH', 'SN', 'BY', 'BW', 'NI', 'HE', 'MV', 'BB', 'SH'],
    status: 'active'
  },
  {
    id: 'doc-26',
    firstName: 'Laith',
    lastName: 'Nimri',
    email: 'laithnimri97@gmail.com',
    specialties: ['Anästhesie und Intensivmedizin', 'Notfallmedizin', 'Innere Medizin', 'Orthopädie und Unfallchirurgie', 'Pädiatrie'],
    desiredStates: ALL_STATE_CODES,
    status: 'active'
  }
];

// Export function to load doctors into localStorage
export async function loadSeedDoctors(forceReload = false) {
  const storageKey = 'med_match_doctor';
  const existingData = localStorage.getItem(storageKey);
  const existing = existingData ? JSON.parse(existingData) : [];
  
  if (!existingData || existing.length === 0 || forceReload) {
    const doctorsWithDates = seedDoctors.map(d => ({
      ...d,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }));
    localStorage.setItem(storageKey, JSON.stringify(doctorsWithDates));
    console.log('Loaded ' + seedDoctors.length + ' seed doctors (was ' + existing.length + ')');
    return doctorsWithDates;
  }
  return existing;
}

export default seedDoctors;
