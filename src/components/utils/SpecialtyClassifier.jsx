// Comprehensive German medical specialty classifier
export const classifySpecialty = (title, description = '') => {
  const text = (title + ' ' + (description || '')).toLowerCase();
  
  // Create comprehensive keyword mappings for German medical specialties
  const specialtyKeywords = {
    'Orthopädie/Unfallchirurgie': [
      'orthopädie', 'orthopädische', 'orthopäd', 'unfallchirurgie', 'unfallchirurg',
      'wirbelsäule', 'knochen', 'gelenke', 'trauma', 'sportmedizin', 'endoprothetik',
      'wirbelsäulenchirurgie', 'handchirurgie', 'fußchirurgie', 'schulterchirurgie',
      'kniechirurgie', 'hüftchirurgie', 'rheuma-orthopädie'
    ],
    'Chirurgie': [
      'chirurgie', 'chirurg', 'viszeralchirurgie', 'allgemeinchirurgie', 'bauchchirurgie',
      'gefäßchirurgie', 'thoraxchirurgie', 'herzchirurgie', 'neurochirurgie',
      'plastische chirurgie', 'kinderchirurgie', 'mkg-chirurgie', 'mund-kiefer-gesicht',
      'transplantationschirurgie', 'minimal-invasive', 'laparoskopie', 'endoskopie'
    ],
    'Innere Medizin': [
      'innere medizin', 'internist', 'kardiologie', 'gastroenterologie', 'nephrologie',
      'pneumologie', 'hämatologie', 'onkologie', 'diabetologie', 'endokrinologie',
      'rheumatologie', 'immunologie', 'intensivmedizin', 'notfallmedizin',
      'geriatrie', 'altersmedizin', 'palliativmedizin'
    ],
    'Anästhesie': [
      'anästhesie', 'anästhesiologie', 'anästhesist', 'narkose', 'intensiv',
      'schmerztherapie', 'schmerzmedizin', 'perioperativ', 'op-medizin',
      'anästhesie intensiv', 'notarzt', 'präklinisch'
    ],
    'Radiologie': [
      'radiologie', 'radiologe', 'röntgen', 'mrt', 'kernspintomographie',
      'computertomographie', 'ultraschall', 'sonographie', 'interventionelle',
      'nuklearmedizin', 'strahlentherapie', 'mammographie', 'angiographie',
      'neuroradiologie', 'kinderradiologie'
    ],
    'Gynäkologie': [
      'gynäkologie', 'gynäkolog', 'geburtshilfe', 'frauenheilkunde',
      'geburt', 'schwangerschaft', 'pränatal', 'reproduktionsmedizin',
      'senologie', 'onkogynäkologie', 'urogynäkologie', 'endokrinologie',
      'kinderwunsch', 'mammakarzinom'
    ],
    'Pädiatrie': [
      'pädiatrie', 'pädiater', 'kinderheilkunde', 'kindermedizin', 'kinder',
      'jugendmedizin', 'neonatologie', 'neugeborene', 'kinderkardiologie',
      'kinderonkologie', 'kindernephrologie', 'kindergastroenterologie',
      'kinderpsychiatrie', 'entwicklungsstörung'
    ],
    'Neurologie': [
      'neurologie', 'neurologe', 'nervenheilkunde', 'schlaganfall', 'epilepsie',
      'parkinson', 'multiple sklerose', 'demenz', 'kopfschmerz', 'migräne',
      'bewegungsstörung', 'neuromuskulär', 'stroke unit', 'gedächtnisstörung'
    ],
    'Urologie': [
      'urologie', 'urologe', 'niere', 'blase', 'prostata', 'harnwege',
      'nierentransplantation', 'dialyse', 'inkontinenz', 'uroonkologie',
      'andrologie', 'kinderurologie', 'steinleiden', 'harnstein'
    ],
    'Dermatologie': [
      'dermatologie', 'dermatologe', 'hautkrankheit', 'hautkrebs', 'allergologie',
      'venerologie', 'geschlechtskrankheit', 'psoriasis', 'neurodermitis',
      'dermatohistologie', 'phototherapie', 'lasermedizin', 'ästhetische medizin'
    ],
    'HNO': [
      'hno', 'hals-nasen-ohren', 'hals nasen ohren', 'otolaryngologie',
      'rhinologie', 'laryngologie', 'audiologie', 'schwerhörigkeit',
      'tinnitus', 'schlafmedizin', 'schnarchen', 'stimme', 'kehlkopf',
      'nasennebenhöhlen', 'mittelohr'
    ],
    'Psychiatrie': [
      'psychiatrie', 'psychiater', 'psychosomatik', 'psychotherapie',
      'depression', 'bipolar', 'schizophrenie', 'angststörung', 'sucht',
      'abhängigkeit', 'forensisch', 'gerontopsychiatrie', 'kinder- und jugendpsychiatrie',
      'psychoanalyse', 'verhaltenstherapie'
    ]
  };

  // Check each specialty for keyword matches
  for (const [specialty, keywords] of Object.entries(specialtyKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return specialty;
      }
    }
  }

  // Default fallback - try to be more intelligent about it
  if (text.includes('arzt') || text.includes('medizin')) {
    return 'Innere Medizin'; // Most general medical specialty
  }

  return 'Sonstige'; // For non-medical or unclear positions
};