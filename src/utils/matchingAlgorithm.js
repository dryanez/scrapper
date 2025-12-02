// Centralized Matching Algorithm for Doctor-Job Matching
// This module contains all matching logic used across the application

// German States mapping
export const GERMAN_STATES = {
  'BW': 'Baden-Württemberg',
  'BY': 'Bayern',
  'BE': 'Berlin',
  'BB': 'Brandenburg',
  'HB': 'Bremen',
  'HH': 'Hamburg',
  'HE': 'Hessen',
  'MV': 'Mecklenburg-Vorpommern',
  'NI': 'Niedersachsen',
  'NW': 'Nordrhein-Westfalen',
  'RP': 'Rheinland-Pfalz',
  'SL': 'Saarland',
  'SN': 'Sachsen',
  'ST': 'Sachsen-Anhalt',
  'SH': 'Schleswig-Holstein',
  'TH': 'Thüringen'
};

// Specialty synonyms and related terms for better matching
const SPECIALTY_SYNONYMS = {
  'innere medizin': ['innere', 'internist', 'internal medicine', 'internistische'],
  'allgemeinmedizin': ['allgemein', 'hausarzt', 'general practice', 'allgemeinärztlich'],
  'chirurgie': ['chirurg', 'surgery', 'surgical', 'operativ'],
  'anästhesie': ['anästhesiologie', 'anesthesia', 'anesthesiology', 'narkose'],
  'pädiatrie': ['kinder', 'kinderheilkunde', 'pediatrics', 'pediatric'],
  'psychiatrie': ['psychosomatik', 'psychiatrisch', 'mental health'],
  'neurologie': ['neuro', 'neurological', 'neurologisch'],
  'kardiologie': ['kardio', 'herz', 'cardiology', 'cardiac'],
  'orthopädie': ['ortho', 'orthopedics', 'muskuloskeletal'],
  'gynäkologie': ['frauenheilkunde', 'gynecology', 'geburtshilfe', 'gyn'],
  'urologie': ['urology', 'urologisch'],
  'radiologie': ['röntgen', 'radiology', 'bildgebung'],
  'dermatologie': ['haut', 'dermatology', 'dermatologisch'],
  'onkologie': ['krebs', 'tumor', 'oncology', 'hämatologie'],
  'gastroenterologie': ['gastro', 'magen', 'darm', 'verdauung'],
  'pneumologie': ['lunge', 'pulmonology', 'atemwege'],
  'geriatrie': ['altersmedizin', 'geriatrics', 'altenpflege'],
  'notfallmedizin': ['notfall', 'emergency', 'rettung', 'intensiv'],
  'intensivmedizin': ['intensiv', 'icu', 'critical care', 'intensivstation'],
  'rehabilitation': ['reha', 'rehab', 'rehabilitationsmedizin'],
  'palliativmedizin': ['palliativ', 'hospiz', 'palliative care'],
};

/**
 * Normalize a doctor object to handle both camelCase and snake_case fields
 */
export function normalizeDoctor(doctor) {
  if (!doctor) return null;
  
  return {
    id: doctor.id,
    firstName: doctor.firstName || doctor.first_name || '',
    lastName: doctor.lastName || doctor.last_name || '',
    email: doctor.email || '',
    specialties: doctor.specialties || [],
    currentState: doctor.currentState || doctor.current_state || '',
    currentCity: doctor.currentCity || doctor.current_city || '',
    desiredStates: doctor.desiredStates || doctor.desired_states || [],
    desiredCities: doctor.desiredCities || doctor.desired_cities || [],
    experienceYears: doctor.experienceYears ?? doctor.experience_years ?? null,
    workPermitStatus: doctor.workPermitStatus || doctor.work_permit_status || '',
    willingToRelocate: doctor.willingToRelocate ?? doctor.willing_to_relocate ?? false,
    germanLevel: doctor.germanLevel || doctor.german_level || '',
    status: doctor.status || 'active',
    photoUrl: doctor.photoUrl || doctor.photo_url || '',
  };
}

/**
 * Normalize a job object to handle both camelCase and snake_case fields
 */
export function normalizeJob(job) {
  if (!job) return null;
  
  return {
    id: job.id,
    title: job.title || '',
    specialty: job.specialty || '',
    seniority: job.seniority || '',
    state: job.state || '',
    city: job.city || '',
    hospitalId: job.hospitalId || job.hospital_id || '',
    hospitalName: job.hospitalName || job.hospital_name || '',
    description: job.description || job.description_html || '',
    originalUrl: job.originalUrl || job.original_url || '',
    postedDate: job.postedDate || job.posted_date || job.created_at || '',
  };
}

/**
 * Check if two specialties match (including partial and synonym matching)
 * Returns a score from 0-100 based on match quality
 */
function getSpecialtyMatchScore(doctorSpecialties, jobSpecialty) {
  if (!doctorSpecialties?.length || !jobSpecialty) return 0;
  
  const jobSpecLower = jobSpecialty.toLowerCase();
  
  for (const docSpec of doctorSpecialties) {
    const docSpecLower = docSpec.toLowerCase();
    
    // Exact match
    if (docSpecLower === jobSpecLower) {
      return 100;
    }
    
    // One contains the other (e.g., "Innere Medizin" contains "Innere")
    if (docSpecLower.includes(jobSpecLower) || jobSpecLower.includes(docSpecLower)) {
      return 90;
    }
    
    // Check synonyms
    for (const [key, synonyms] of Object.entries(SPECIALTY_SYNONYMS)) {
      const allTerms = [key, ...synonyms];
      const docMatches = allTerms.some(term => docSpecLower.includes(term));
      const jobMatches = allTerms.some(term => jobSpecLower.includes(term));
      
      if (docMatches && jobMatches) {
        return 85; // Synonym match
      }
    }
    
    // Partial word match (at least 4 characters)
    const docWords = docSpecLower.split(/[\s\-\/]+/).filter(w => w.length >= 4);
    const jobWords = jobSpecLower.split(/[\s\-\/]+/).filter(w => w.length >= 4);
    
    for (const docWord of docWords) {
      for (const jobWord of jobWords) {
        if (docWord.includes(jobWord) || jobWord.includes(docWord)) {
          return 70; // Partial match
        }
      }
    }
  }
  
  return 0;
}

/**
 * Calculate location match score
 * Returns score and reason
 */
function getLocationMatchScore(doctor, job) {
  const reasons = [];
  let score = 0;
  
  const jobState = job.state;
  const jobCity = (job.city || '').toLowerCase();
  
  // 1. Check current state match (best match)
  if (doctor.currentState && doctor.currentState === jobState) {
    score = 100;
    reasons.push(`Lives in ${GERMAN_STATES[jobState] || jobState}`);
    return { score, reasons };
  }
  
  // 2. Check desired states
  if (doctor.desiredStates?.length > 0) {
    if (doctor.desiredStates.includes(jobState)) {
      score = 90;
      reasons.push(`Wants to work in ${GERMAN_STATES[jobState] || jobState}`);
    }
  }
  
  // 3. Check desired cities (bonus points)
  if (doctor.desiredCities?.length > 0 && jobCity) {
    const desiredCitiesLower = doctor.desiredCities.map(c => c.toLowerCase());
    if (desiredCitiesLower.some(c => jobCity.includes(c) || c.includes(jobCity))) {
      score = Math.max(score, 95);
      reasons.push(`Desired city: ${job.city}`);
    }
  }
  
  // 4. Willing to relocate (fallback)
  if (score === 0 && doctor.willingToRelocate) {
    score = 40;
    reasons.push('Willing to relocate');
  }
  
  return { score, reasons };
}

/**
 * Calculate seniority/experience match score
 */
function getSeniorityMatchScore(doctor, job) {
  const expYears = doctor.experienceYears;
  const seniority = job.seniority || '';
  
  if (expYears == null) {
    return { score: 50, reason: 'Experience not specified' }; // Neutral score
  }
  
  const seniorityLower = seniority.toLowerCase();
  
  // Assistenzarzt (0-5 years ideal)
  if (seniorityLower.includes('assistenz')) {
    if (expYears >= 0 && expYears <= 5) {
      return { score: 100, reason: `${expYears} years - ideal for Assistenzarzt` };
    } else if (expYears > 5 && expYears <= 8) {
      return { score: 60, reason: 'Experienced, may be overqualified' };
    } else {
      return { score: 30, reason: 'Likely overqualified for Assistenzarzt' };
    }
  }
  
  // Facharzt (3-10 years ideal)
  if (seniorityLower.includes('facharzt') && !seniorityLower.includes('ober')) {
    if (expYears >= 5 && expYears <= 12) {
      return { score: 100, reason: `${expYears} years - ideal for Facharzt` };
    } else if (expYears >= 3 && expYears < 5) {
      return { score: 80, reason: 'Approaching Facharzt level' };
    } else if (expYears > 12) {
      return { score: 70, reason: 'Very experienced for Facharzt role' };
    } else {
      return { score: 40, reason: 'May need more experience for Facharzt' };
    }
  }
  
  // Oberarzt (7+ years ideal)
  if (seniorityLower.includes('oberarzt') || seniorityLower.includes('ober')) {
    if (expYears >= 10) {
      return { score: 100, reason: `${expYears} years - excellent for Oberarzt` };
    } else if (expYears >= 7) {
      return { score: 85, reason: `${expYears} years - suitable for Oberarzt` };
    } else if (expYears >= 5) {
      return { score: 60, reason: 'May need more experience for Oberarzt' };
    } else {
      return { score: 30, reason: 'Insufficient experience for Oberarzt' };
    }
  }
  
  // Chefarzt (15+ years ideal)
  if (seniorityLower.includes('chefarzt') || seniorityLower.includes('chef')) {
    if (expYears >= 15) {
      return { score: 100, reason: `${expYears} years - ideal for Chefarzt` };
    } else if (expYears >= 12) {
      return { score: 75, reason: 'Approaching Chefarzt level' };
    } else {
      return { score: 40, reason: 'Needs more experience for Chefarzt' };
    }
  }
  
  // Default - generic position
  return { score: 60, reason: `${expYears} years of experience` };
}

/**
 * Calculate work permit score
 */
function getWorkPermitScore(doctor) {
  const status = (doctor.workPermitStatus || '').toUpperCase();
  
  switch (status) {
    case 'EU_CITIZEN':
    case 'GERMAN':
      return { score: 100, reason: 'EU citizen - no work permit needed' };
    case 'WORK_PERMIT':
    case 'VALID':
      return { score: 80, reason: 'Has valid work permit' };
    case 'PENDING':
      return { score: 50, reason: 'Work permit pending' };
    case 'NONE':
    case 'REQUIRED':
      return { score: 30, reason: 'Work permit required' };
    default:
      return { score: 60, reason: 'Work permit status unknown' };
  }
}

/**
 * Main matching function - calculates match score between a doctor and a job
 * 
 * Scoring weights:
 * - Specialty: 45% (most important - must match the medical field)
 * - Location: 30% (desired place of work)
 * - Seniority/Experience: 15% (career level match)
 * - Work Permit: 10% (legal eligibility)
 * 
 * Total: 100%
 */
export function calculateMatchScore(doctor, job) {
  // Normalize inputs
  const doc = normalizeDoctor(doctor);
  const j = normalizeJob(job);
  
  if (!doc || !j) {
    return { score: 0, reasons: {}, details: {} };
  }
  
  const weights = {
    specialty: 0.45,
    location: 0.30,
    seniority: 0.15,
    workPermit: 0.10,
  };
  
  // Calculate individual scores
  const specialtyScore = getSpecialtyMatchScore(doc.specialties, j.specialty);
  const locationResult = getLocationMatchScore(doc, j);
  const seniorityResult = getSeniorityMatchScore(doc, j);
  const workPermitResult = getWorkPermitScore(doc);
  
  // Calculate weighted total
  const weightedScore = 
    (specialtyScore * weights.specialty) +
    (locationResult.score * weights.location) +
    (seniorityResult.score * weights.seniority) +
    (workPermitResult.score * weights.workPermit);
  
  // Build reasons object for display
  const reasons = {};
  const details = {
    specialty: { score: specialtyScore, weight: weights.specialty },
    location: { score: locationResult.score, weight: weights.location, reasons: locationResult.reasons },
    seniority: { score: seniorityResult.score, weight: weights.seniority, reason: seniorityResult.reason },
    workPermit: { score: workPermitResult.score, weight: weights.workPermit, reason: workPermitResult.reason },
  };
  
  if (specialtyScore >= 70) {
    reasons.specialty = `Specialty match (${specialtyScore}%): ${j.specialty}`;
  }
  if (locationResult.score >= 40) {
    reasons.location = locationResult.reasons.join(', ');
  }
  if (seniorityResult.score >= 60) {
    reasons.experience = seniorityResult.reason;
  }
  if (workPermitResult.score >= 60) {
    reasons.permits = workPermitResult.reason;
  }
  
  return {
    score: Math.round(weightedScore),
    reasons,
    details,
  };
}

/**
 * Find matching doctors for a job
 * @param {Object} job - The job to match against
 * @param {Array} doctors - List of all doctors
 * @param {number} minScore - Minimum match score (default 35)
 * @returns {Array} Sorted array of doctors with match scores
 */
export function findMatchingDoctors(job, doctors, minScore = 35) {
  if (!job || !doctors?.length) return [];
  
  return doctors
    .map(doctor => {
      const { score, reasons, details } = calculateMatchScore(doctor, job);
      return {
        ...doctor,
        matchScore: score,
        matchReasons: reasons,
        matchDetails: details,
      };
    })
    .filter(d => d.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Find matching jobs for a doctor
 * @param {Object} doctor - The doctor to match against
 * @param {Array} jobs - List of all jobs
 * @param {number} minScore - Minimum match score (default 35)
 * @returns {Array} Sorted array of jobs with match scores
 */
export function findMatchingJobs(doctor, jobs, minScore = 35) {
  if (!doctor || !jobs?.length) return [];
  
  return jobs
    .map(job => {
      const { score, reasons, details } = calculateMatchScore(doctor, job);
      return {
        ...job,
        matchScore: score,
        matchReasons: reasons,
        matchDetails: details,
      };
    })
    .filter(j => j.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get color class based on match score
 */
export function getMatchScoreColor(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 45) return 'text-yellow-600';
  return 'text-slate-500';
}

/**
 * Get background color class based on match score
 */
export function getMatchScoreBgColor(score) {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-blue-100';
  if (score >= 45) return 'bg-yellow-100';
  return 'bg-slate-100';
}
