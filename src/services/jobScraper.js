// Job Scraper Service
// Handles scraping job listings from various hospital career pages

// CORS proxy for fetching external pages (you can use your own or a public one)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

let currentProxyIndex = 0;

// Fetch with CORS proxy
async function fetchWithProxy(url) {
  const proxy = CORS_PROXIES[currentProxyIndex];
  try {
    const response = await fetch(proxy + encodeURIComponent(url), {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    // Try next proxy
    currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    if (currentProxyIndex !== 0) {
      return fetchWithProxy(url);
    }
    throw error;
  }
}

// Try to extract embedded JSON job data from JavaScript in the page
function extractEmbeddedJobsJSON(html, baseUrl) {
  const jobs = [];
  
  // Look for JSON data patterns commonly used in job portals
  // Pattern 1: "Jobs":[ ... ] or "jobs":[ ... ]
  const jobsArrayPattern = /"Jobs"\s*:\s*\[([\s\S]*?)\](?=\s*[,}])/i;
  const match = html.match(jobsArrayPattern);
  
  if (match) {
    try {
      // Extract and parse the Jobs array
      const jobsJson = '[' + match[1] + ']';
      const jobsData = JSON.parse(jobsJson);
      
      // Get the base domain for building URLs
      const urlObj = new URL(baseUrl);
      const baseDomain = urlObj.origin;
      
      for (const job of jobsData) {
        // Skip non-job entries
        if (!job.Title && !job.title) continue;
        
        const title = job.Title || job.title || '';
        const id = job.Id || job.id || '';
        const urlEncodedTitle = job.UrlEncodedTitle || job.urlEncodedTitle || '';
        const description = job.SubTitle || job.subTitle || job.Description || job.description || '';
        const location = job.Location || job.location || '';
        
        // Build the job detail URL
        let link = '';
        if (job.PortalUrl) {
          link = `//${job.PortalUrl}/Job/${id}/${urlEncodedTitle}`;
        } else if (id && urlEncodedTitle) {
          link = `${baseDomain}/Job/${id}/${urlEncodedTitle}`;
        } else if (id) {
          link = `${baseDomain}/Job/${id}`;
        }
        
        jobs.push({
          title: title.trim(),
          description: description.trim(),
          specialty: extractSpecialty(title),
          location: location.trim(),
          link,
          source_url: baseUrl,
          scraped_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.log('Failed to parse embedded JSON:', e);
    }
  }
  
  return jobs;
}

// Detect the type of job portal based on URL patterns
function detectPortalType(url) {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('personio')) return 'personio';
  if (urlLower.includes('umantis')) return 'umantis';
  if (urlLower.includes('softgarden')) return 'softgarden';
  if (urlLower.includes('rexx-systems') || urlLower.includes('rexx.')) return 'rexx';
  if (urlLower.includes('concludis')) return 'concludis';
  if (urlLower.includes('tx_asjobs') || urlLower.includes('asjobs')) return 'typo3-asjobs';
  if (urlLower.includes('karriere') || urlLower.includes('career')) return 'generic-karriere';
  if (urlLower.includes('stellenangebot') || urlLower.includes('jobs')) return 'generic-jobs';
  
  return 'generic';
}

// Generic job extraction patterns
const JOB_PATTERNS = {
  // Common German job title patterns for medical positions
  titlePatterns: [
    /(?:Arzt|Ärztin|Assistenzarzt|Assistenzärztin|Facharzt|Fachärztin|Oberarzt|Oberärztin|Chefarzt|Chefärztin)/gi,
    /(?:Arzt|Ärztin)\s*(?:\(m\/w\/d\)|\(w\/m\/d\)|\(d\/m\/w\))?/gi,
    /(?:Assistenz|Fach|Ober|Chef)(?:arzt|ärztin)/gi,
  ],
  
  // Department/specialty patterns
  specialtyPatterns: [
    /(?:Innere\s*Medizin|Chirurgie|Anästhesie|Psychiatrie|Neurologie|Orthopädie|Gynäkologie|Pädiatrie|Radiologie|Kardiologie|Onkologie|Urologie|Dermatologie|HNO|Augenheilkunde|Allgemeinmedizin)/gi,
  ]
};

// Parser for generic HTML pages - IMPROVED version
function parseGenericPage(html, baseUrl) {
  const jobs = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Strategy 1: Look for specific job container patterns used by German hospitals
  const jobContainerSelectors = [
    // Marienhospital Stuttgart / TYPO3 joboffer pattern
    'article.joboffer_container',
    '.joboffer_container',
    
    // Klinikum Stuttgart pattern
    '.jobs-list__item',
    'li.jobs-list__item',
    
    // TYPO3 AsJobs list pattern (Ulm, Freiburg)
    '.list-element.list-link',
    '.tx-as-jobs-list .list-element',
    
    // Schwarzwald-Baar Klinikum pattern
    'a.joblink',
    '.joblink',
    '.jobrow',
    
    // BBT Group / Weblication pattern (Krankenhaus Tauberbischofsheim)
    '.listEntry.listEntryObject-jobOffer',
    '.listEntry',
    '.listEntryInner.clickable',
    
    // Generic job containers
    '.job-offer',
    '.job-listing',
    '.job-item',
    '.stellenangebot',
    '.stelle',
    '.vacancy-item',
    '.position-item',
    
    // Cards and lists that often contain jobs
    '[class*="joboffer"]',
    '[class*="job-listing"]',
    '[class*="stellenangebot"]',
    '.teaser-job',
    '.job-teaser',
    
    // Table rows for tabular job listings
    'tr.job',
    'tr[class*="job"]',
    
    // Generic article/card patterns
    'article[class*="job"]',
    'div.job',
    
    // rexx-systems pattern
    '.jobad-list-item',
    '.job-result-item',
    
    // Additional common patterns
    '.career-listing-item',
    '.job-card',
    '.vacancy-card',
    '.stellenanzeige',
  ];
  
  let elements = [];
  for (const selector of jobContainerSelectors) {
    try {
      const found = doc.querySelectorAll(selector);
      if (found.length > 0 && found.length < 200) {
        elements = Array.from(found);
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        break;
      }
    } catch (e) {
      // Invalid selector, skip
    }
  }
  
  // Strategy 2: Look for links that look like job postings
  if (elements.length === 0) {
    const allLinks = doc.querySelectorAll('a');
    const jobLinks = Array.from(allLinks).filter(link => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent?.toLowerCase() || '';
      
      // Skip navigation and footer links
      if (href === '#' || href.startsWith('javascript:') || href.includes('mailto:')) return false;
      if (text.length < 15 || text.length > 300) return false;
      
      // Check if it looks like a job link
      const hasJobKeyword = text.includes('arzt') || text.includes('ärztin') || 
                            text.includes('weiterbildung') || text.includes('oberarzt') ||
                            text.includes('facharzt') || text.includes('assistenz');
      
      const hasJobUrl = href.includes('/job') || href.includes('/stelle') || 
                        href.includes('/career') || href.includes('/karriere') ||
                        href.includes('-j') || href.includes('/position');
      
      return hasJobKeyword || (hasJobUrl && text.length > 20);
    });
    
    if (jobLinks.length > 0) {
      elements = jobLinks;
      console.log(`Found ${elements.length} job links`);
    }
  }
  
  // Strategy 3: Look for category teasers that link to job categories (like Freiburg)
  if (elements.length === 0) {
    const categoryLinks = doc.querySelectorAll('.category-teaser a, .category-teaser-link, [class*="category"] a');
    if (categoryLinks.length > 0) {
      // Return info about categories, not individual jobs
      console.log(`Found category page with ${categoryLinks.length} categories`);
      // For category pages, we'd need to follow the links - for now, return empty
      // This is a limitation - we need the actual job listing pages
    }
  }
  
  // Extract job information from found elements
  const seenTitles = new Set();
  
  for (const el of elements) {
    const text = el.textContent || '';
    const titleEl = el.querySelector('h1, h2, h3, h4, h5, .title, .job-title, [class*="title"]') || el;
    let title = titleEl.textContent?.trim() || '';
    
    // Clean up title
    title = title.replace(/\s+/g, ' ').trim();
    
    // Skip if not medical-related or too short/long
    if (title.length < 10 || title.length > 200) continue;
    
    // Check if it looks like a medical job
    const isMedicalJob = JOB_PATTERNS.titlePatterns.some(pattern => pattern.test(title));
    if (!isMedicalJob && !title.toLowerCase().includes('arzt') && !title.toLowerCase().includes('ärztin')) {
      continue;
    }
    
    // Avoid duplicates
    const titleKey = title.toLowerCase().replace(/\s+/g, '');
    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);
    
    // Find link - improved logic to find specific job URLs
    let link = '';
    
    // Priority 1: Look for specific "detail" or "more info" links first
    const detailLinkSelectors = [
      'a[href*="detail"]', 'a[href*="job/"]', 'a[href*="stelle/"]', 'a[href*="position/"]',
      'a[href*="vacancy/"]', 'a[href*="karriere/"]', 'a[href*="jobs/"]',
      'a[href*="stellenangebot"]', 'a[href*="stellenausschreibung"]',
      'a[href*="?"]', // Links with query parameters often point to specific jobs
      'a.btn', 'a.button', 'a[class*="detail"]', 'a[class*="more"]', 'a[class*="link"]',
      'a[class*="apply"]', 'a[class*="bewerb"]'
    ];
    
    for (const selector of detailLinkSelectors) {
      const detailLink = el.querySelector(selector);
      if (detailLink) {
        const href = detailLink.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:') && !href.includes('mailto:')) {
          link = href;
          break;
        }
      }
    }
    
    // Priority 2: If element itself is a link
    if (!link && el.tagName === 'A') {
      const href = el.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        link = href;
      }
    }
    
    // Priority 3: Check parent element if it's a link
    if (!link && el.parentElement?.tagName === 'A') {
      const href = el.parentElement.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        link = href;
      }
    }
    
    // Priority 4: Find any link within the element that looks like a job detail link
    if (!link) {
      const allLinks = el.querySelectorAll('a');
      for (const a of allLinks) {
        const href = a.getAttribute('href') || '';
        const linkText = a.textContent?.toLowerCase() || '';
        
        // Skip navigation/filter links
        if (href === '#' || href.startsWith('javascript:') || href.includes('mailto:')) continue;
        
        // Prefer links with job-specific text or URL patterns
        const isDetailLink = 
          linkText.includes('mehr') || linkText.includes('detail') || linkText.includes('anzeigen') ||
          linkText.includes('zur stelle') || linkText.includes('bewerben') || linkText.includes('ansehen') ||
          href.includes('detail') || href.includes('job/') || href.includes('stelle/') ||
          href.includes('position') || href.includes('vacancy') || href.includes('id=') ||
          href.includes('jobid') || href.includes('stellenid');
        
        if (isDetailLink) {
          link = href;
          break;
        }
        
        // Otherwise, take the first valid link as fallback
        if (!link && href) {
          link = href;
        }
      }
    }
    
    // Convert relative URLs to absolute
    if (link && !link.startsWith('http')) {
      try {
        link = new URL(link, baseUrl).href;
      } catch (e) {
        link = '';
      }
    }
    
    // Extract specialty from title or nearby text
    let specialty = '';
    for (const pattern of JOB_PATTERNS.specialtyPatterns) {
      const match = text.match(pattern);
      if (match) {
        specialty = match[0];
        break;
      }
    }
    
    // Extract location if present
    let location = '';
    const locationEl = el.querySelector('[class*="location"], [class*="ort"], [class*="standort"]');
    if (locationEl) {
      location = locationEl.textContent?.trim() || '';
    }
    
    jobs.push({
      title: title.substring(0, 200),
      specialty: specialty || 'Allgemein',
      location,
      link,
      source_url: baseUrl,
      scraped_at: new Date().toISOString()
    });
  }
  
  return jobs;
}

// Parser for Personio-based job portals
function parsePersonioPage(html, baseUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const jobs = [];
  
  // Personio typically uses specific data attributes or classes
  const jobElements = doc.querySelectorAll('[data-position-id], .position-card, .job-position, .job-opening, [class*="position-"]');
  
  for (const el of jobElements) {
    const titleEl = el.querySelector('.position-title, h2, h3, a');
    const title = titleEl?.textContent?.trim() || '';
    
    if (!title || title.length < 5) continue;
    
    // Find the best link - Personio often has links with position IDs
    let link = '';
    const positionId = el.getAttribute('data-position-id');
    
    // Try to find link with position ID in URL
    const allLinks = el.querySelectorAll('a');
    for (const a of allLinks) {
      const href = a.getAttribute('href') || '';
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        // Prefer links that look like detail pages
        if (positionId && href.includes(positionId)) {
          link = href;
          break;
        }
        if (href.includes('/job/') || href.includes('/position/') || href.includes('id=')) {
          link = href;
          break;
        }
        if (!link) link = href;
      }
    }
    
    // Check if element itself is a link
    if (!link && el.tagName === 'A') {
      link = el.getAttribute('href') || '';
    }
    
    if (link && !link.startsWith('http')) {
      try {
        link = new URL(link, baseUrl).href;
      } catch (e) {
        link = '';
      }
    }
    
    const locationEl = el.querySelector('.position-location, [class*="location"]');
    const location = locationEl?.textContent?.trim() || '';
    
    jobs.push({
      title,
      specialty: extractSpecialty(title),
      location,
      link,
      source_url: baseUrl,
      scraped_at: new Date().toISOString()
    });
  }
  
  return jobs.length > 0 ? jobs : parseGenericPage(html, baseUrl);
}

// Parser for Umantis-based job portals
function parseUmantisPage(html, baseUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const jobs = [];
  
  const jobElements = doc.querySelectorAll('.job-item, .job-listing, tr.job, [class*="vacancy"], .opening-item, [class*="stellenangebot"]');
  
  for (const el of jobElements) {
    const titleEl = el.querySelector('.job-title, td:first-child, h3, a');
    const title = titleEl?.textContent?.trim() || '';
    
    if (!title || title.length < 5) continue;
    
    // Find best link
    let link = '';
    const allLinks = el.querySelectorAll('a');
    for (const a of allLinks) {
      const href = a.getAttribute('href') || '';
      const linkText = a.textContent?.toLowerCase() || '';
      
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        // Prefer detail/specific links
        if (href.includes('jobid') || href.includes('vacancy') || href.includes('detail') ||
            linkText.includes('detail') || linkText.includes('mehr')) {
          link = href;
          break;
        }
        if (!link) link = href;
      }
    }
    
    // Check if element or parent is a link
    if (!link) {
      const parentLink = el.closest('a');
      if (parentLink) {
        link = parentLink.getAttribute('href') || '';
      }
    }
    
    if (link && !link.startsWith('http')) {
      try {
        link = new URL(link, baseUrl).href;
      } catch (e) {
        link = '';
      }
    }
    
    jobs.push({
      title,
      specialty: extractSpecialty(title),
      location: '',
      link,
      source_url: baseUrl,
      scraped_at: new Date().toISOString()
    });
  }
  
  return jobs.length > 0 ? jobs : parseGenericPage(html, baseUrl);
}

// Parser for Softgarden-based job portals
function parseSoftgardenPage(html, baseUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const jobs = [];
  
  // Softgarden uses specific class patterns
  const jobElements = doc.querySelectorAll('.job-posting, .jobad-list-item, [class*="job-item"], .posting-item, article.job');
  
  for (const el of jobElements) {
    const titleEl = el.querySelector('.job-title, h2, h3, .title, a');
    const title = titleEl?.textContent?.trim() || '';
    
    if (!title || title.length < 5) continue;
    
    // Find the job detail link
    let link = '';
    
    // Softgarden often has job IDs in URLs
    const allLinks = el.querySelectorAll('a');
    for (const a of allLinks) {
      const href = a.getAttribute('href') || '';
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        // Prefer links with job IDs or detail indicators
        if (href.includes('jobad') || href.includes('job/') || href.includes('/detail') || 
            href.match(/\/\d+/) || href.includes('posting')) {
          link = href;
          break;
        }
        if (!link) link = href;
      }
    }
    
    if (link && !link.startsWith('http')) {
      try {
        link = new URL(link, baseUrl).href;
      } catch (e) {
        link = '';
      }
    }
    
    const locationEl = el.querySelector('[class*="location"], [class*="ort"]');
    const location = locationEl?.textContent?.trim() || '';
    
    jobs.push({
      title,
      specialty: extractSpecialty(title),
      location,
      link,
      source_url: baseUrl,
      scraped_at: new Date().toISOString()
    });
  }
  
  return jobs.length > 0 ? jobs : parseGenericPage(html, baseUrl);
}

// Parser for TYPO3 AsJobs-based portals (common in German public hospitals)
// Used by: Freiburg, Ulm, Stuttgart, many others
function parseTypo3AsJobsPage(html, baseUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const jobs = [];
  
  // TYPO3 AsJobs uses various container patterns
  const containerSelectors = [
    // Klinikum Stuttgart pattern
    '.jobs-list__item',
    'li.jobs-list__item',
    // Ulm pattern
    '.list-element.list-link',
    '.tx-as-jobs-list .list-element',
    // Freiburg pattern
    '.job_title',
    '[class*="job_title"]',
    // Generic TYPO3 patterns
    '.tx-asjobboerse-pi2 .job-item',
    '.tx-as-jobs .job-item',
    '.formResultList .list-element',
  ];
  
  let elements = [];
  for (const selector of containerSelectors) {
    try {
      const found = doc.querySelectorAll(selector);
      if (found.length > 0) {
        elements = Array.from(found);
        console.log(`TYPO3: Found ${elements.length} elements with selector: ${selector}`);
        break;
      }
    } catch (e) {
      // Invalid selector
    }
  }
  
  // If no specific containers, look for links with job-like URLs in tx-as-jobs container
  if (elements.length === 0) {
    const container = doc.querySelector('.tx-as-jobs, .tx-asjobboerse-pi2, [class*="asjobs"]');
    if (container) {
      elements = Array.from(container.querySelectorAll('a')).filter(a => {
        const href = a.getAttribute('href') || '';
        const text = a.textContent?.trim() || '';
        return text.length > 15 && (
          href.includes('/job/') || href.includes('job/view') || 
          href.includes('/stelle') || href.includes('/karriere/job')
        );
      });
    }
  }
  
  for (const el of elements) {
    // Get title
    let title = '';
    const titleEl = el.querySelector('.jobs-list__item-title, h6, h5, h4, h3, h2, a, .title');
    if (titleEl) {
      title = titleEl.textContent?.trim() || '';
    } else if (el.tagName === 'A') {
      title = el.textContent?.trim() || '';
    } else {
      title = el.textContent?.trim()?.split('\n')[0] || '';
    }
    
    // Clean title
    title = title.replace(/\s+/g, ' ').trim();
    if (!title || title.length < 10 || title.length > 300) continue;
    
    // Get link
    let link = '';
    if (el.tagName === 'A') {
      link = el.getAttribute('href') || '';
    } else {
      const linkEl = el.querySelector('a');
      if (linkEl) {
        link = linkEl.getAttribute('href') || '';
      }
    }
    
    // Make link absolute
    if (link && !link.startsWith('http')) {
      try {
        link = new URL(link, baseUrl).href;
      } catch (e) {
        link = '';
      }
    }
    
    // Get department if available
    const deptEl = el.querySelector('.jobs-list__item-department, .department, [class*="department"]');
    const department = deptEl?.textContent?.trim() || '';
    
    jobs.push({
      title,
      specialty: extractSpecialty(title),
      location: department || '',
      link,
      source_url: baseUrl,
      scraped_at: new Date().toISOString()
    });
  }
  
  return jobs.length > 0 ? jobs : parseGenericPage(html, baseUrl);
}

// Extract medical specialty from job title
function extractSpecialty(title) {
  const specialties = {
    'innere medizin': 'Innere Medizin',
    'chirurgie': 'Chirurgie',
    'anästhesie': 'Anästhesiologie',
    'anästhesiologie': 'Anästhesiologie',
    'psychiatrie': 'Psychiatrie',
    'neurologie': 'Neurologie',
    'orthopädie': 'Orthopädie',
    'unfallchirurgie': 'Unfallchirurgie',
    'gynäkologie': 'Gynäkologie',
    'pädiatrie': 'Pädiatrie',
    'kinderheilkunde': 'Pädiatrie',
    'radiologie': 'Radiologie',
    'kardiologie': 'Kardiologie',
    'onkologie': 'Onkologie',
    'urologie': 'Urologie',
    'dermatologie': 'Dermatologie',
    'hno': 'HNO',
    'augenheilkunde': 'Augenheilkunde',
    'ophthalmologie': 'Augenheilkunde',
    'allgemeinmedizin': 'Allgemeinmedizin',
    'notfallmedizin': 'Notfallmedizin',
    'intensivmedizin': 'Intensivmedizin',
    'gastroenterologie': 'Gastroenterologie',
    'pneumologie': 'Pneumologie',
    'nephrologie': 'Nephrologie',
    'endokrinologie': 'Endokrinologie',
    'rheumatologie': 'Rheumatologie',
    'geriatrie': 'Geriatrie',
    'palliativmedizin': 'Palliativmedizin',
    'psychosomatik': 'Psychosomatik',
    'pathologie': 'Pathologie',
    'nuklearmedizin': 'Nuklearmedizin',
    'strahlentherapie': 'Strahlentherapie',
    'viszeralchirurgie': 'Viszeralchirurgie',
    'gefäßchirurgie': 'Gefäßchirurgie',
    'thoraxchirurgie': 'Thoraxchirurgie',
    'herzchirurgie': 'Herzchirurgie',
    'neurochirurgie': 'Neurochirurgie',
    'plastische chirurgie': 'Plastische Chirurgie',
    'mund-kiefer': 'MKG-Chirurgie',
  };
  
  const titleLower = title.toLowerCase();
  
  for (const [key, value] of Object.entries(specialties)) {
    if (titleLower.includes(key)) {
      return value;
    }
  }
  
  return 'Allgemein';
}

// Check if portal type is external/unsupported
function isExternalPortal(portalType) {
  if (!portalType) return false;
  
  // These portal types use external APIs/widgets that can't be scraped
  const unsupportedTypes = [
    'dvinci',
    'd.vinci',
    'bite-api',
    'b-ite',
    'connectoor',
    'smartrecruiters',
    'oracle',
    'oracle-taleo',
    'taleo',
    'workday',
    'greenhouse',
    'js-rendered',
    'external-dvinci',
    'external-bite-api', 
    'external-connectoor',
    'external-smartrecruiters',
    'external-oracle-taleo',
    'external-workday',
    'external-greenhouse',
    'external-js'
  ];
  
  const lowerType = portalType.toLowerCase();
  return unsupportedTypes.includes(lowerType) || 
         lowerType.startsWith('external-') ||
         lowerType.startsWith('api-') ||
         lowerType.startsWith('widget-');
}

// Get warning message for external portal types
function getExternalPortalWarning(portalType) {
  const warnings = {
    'dvinci': 'Uses d.vinci widget - jobs loaded via JavaScript API. Please check the career page manually.',
    'd.vinci': 'Uses d.vinci widget - jobs loaded via JavaScript API. Please check the career page manually.',
    'external-dvinci': 'Uses d.vinci widget - jobs loaded via JavaScript API. Please check the career page manually.',
    'bite-api': 'Uses B-ITE API - jobs loaded dynamically. Please check the career page manually.',
    'b-ite': 'Uses B-ITE API - jobs loaded dynamically. Please check the career page manually.',
    'external-bite-api': 'Uses B-ITE API - jobs loaded dynamically. Please check the career page manually.',
    'connectoor': 'Uses Connectoor widget - jobs loaded via external API. Please check the career page manually.',
    'external-connectoor': 'Uses Connectoor widget - jobs loaded via external API. Please check the career page manually.',
    'smartrecruiters': 'Uses SmartRecruiters - jobs loaded via external widget. Please check the career page manually.',
    'external-smartrecruiters': 'Uses SmartRecruiters - jobs loaded via external widget. Please check the career page manually.',
    'oracle': 'Uses Oracle Taleo - jobs loaded via external system. Please check the career page manually.',
    'oracle-taleo': 'Uses Oracle Taleo - jobs loaded via external system. Please check the career page manually.',
    'taleo': 'Uses Oracle Taleo - jobs loaded via external system. Please check the career page manually.',
    'external-oracle-taleo': 'Uses Oracle Taleo - jobs loaded via external system. Please check the career page manually.',
    'workday': 'Uses Workday - jobs loaded via external system. Please check the career page manually.',
    'external-workday': 'Uses Workday - jobs loaded via external system. Please check the career page manually.',
    'greenhouse': 'Uses Greenhouse - jobs loaded via external API. Please check the career page manually.',
    'external-greenhouse': 'Uses Greenhouse - jobs loaded via external API. Please check the career page manually.',
    'js-rendered': 'Jobs are loaded via JavaScript - automatic scraping not possible. Please check the career page manually.',
    'external-js': 'Jobs are loaded via JavaScript - automatic scraping not possible. Please check the career page manually.'
  };
  return warnings[portalType.toLowerCase()] || 'Uses external job portal - automatic scraping may not be possible. Please check manually.';
}

// Main scraping function for a single hospital
export async function scrapeHospitalJobs(hospital, onProgress) {
  const url = hospital.career_page_url || hospital.careerPageUrl;
  
  if (!url) {
    return { 
      hospital, 
      jobs: [], 
      error: 'No career page URL available',
      status: 'no_url' 
    };
  }
  
  // Note: We now ALWAYS try to scrape, even for "external" portal types
  // Many of these still have HTML content we can parse
  const hospitalPortalType = hospital.portal_type;
  
  try {
    onProgress?.(`Fetching ${hospital.name}...`);
    
    const html = await fetchWithProxy(url);
    
    if (!html || html.length < 100) {
      // If empty response AND it's a known external portal, give helpful warning
      if (hospitalPortalType && isExternalPortal(hospitalPortalType)) {
        return {
          hospital,
          jobs: [],
          error: null,
          warning: getExternalPortalWarning(hospitalPortalType),
          status: 'external_portal',
          portalType: hospitalPortalType,
          requiresManualCheck: true
        };
      }
      return { 
        hospital, 
        jobs: [], 
        error: 'Empty or invalid response',
        status: 'empty_response' 
      };
    }
    
    onProgress?.(`Parsing jobs from ${hospital.name}...`);
    
    // Use hospital's portal_type if available, otherwise detect from URL
    const portalType = hospitalPortalType || detectPortalType(url);
    
    // First try to extract jobs from embedded JSON (for JavaScript-rendered pages)
    let jobs = extractEmbeddedJobsJSON(html, url);
    
    // If no embedded JSON found, use portal-specific or generic parser
    if (jobs.length === 0) {
      switch (portalType) {
        case 'personio':
          jobs = parsePersonioPage(html, url);
          break;
        case 'umantis':
          jobs = parseUmantisPage(html, url);
          break;
        case 'softgarden':
          jobs = parseSoftgardenPage(html, url);
          break;
        case 'typo3-asjobs':
          jobs = parseTypo3AsJobsPage(html, url);
          break;
        default:
          jobs = parseGenericPage(html, url);
      }
    }
    
    // Filter for medical jobs only
    jobs = jobs.filter(job => {
      const title = job.title.toLowerCase();
      return title.includes('arzt') || title.includes('ärztin') ||
             title.includes('physician') || title.includes('doctor') ||
             title.includes('medizin');
    });
    
    // Add hospital info to each job
    jobs = jobs.map(job => ({
      ...job,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      portalType
    }));
    
    return { 
      hospital, 
      jobs, 
      error: null,
      status: jobs.length > 0 ? 'success' : 'no_jobs_found',
      portalType
    };
    
  } catch (error) {
    console.error(`Error scraping ${hospital.name}:`, error);
    return { 
      hospital, 
      jobs: [], 
      error: error.message,
      status: 'error' 
    };
  }
}

// Batch scrape multiple hospitals
export async function scrapeMultipleHospitals(hospitals, onProgress, onHospitalComplete, shouldContinue) {
  const results = [];
  let completed = 0;
  
  for (const hospital of hospitals) {
    // Check if we should continue (for pause/stop functionality)
    if (shouldContinue && !shouldContinue()) {
      // Wait while paused
      while (shouldContinue && !shouldContinue()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        // Check if scraping was cancelled entirely
        const state = JSON.parse(localStorage.getItem('med_match_scraping_state') || '{}');
        if (!state.isActive) {
          console.log('Scraping cancelled');
          return results;
        }
      }
    }
    
    onProgress?.({
      current: completed + 1,
      total: hospitals.length,
      hospitalName: hospital.name,
      percentage: Math.round((completed / hospitals.length) * 100)
    });
    
    const result = await scrapeHospitalJobs(hospital, (msg) => {
      onProgress?.({
        current: completed + 1,
        total: hospitals.length,
        hospitalName: hospital.name,
        message: msg,
        percentage: Math.round((completed / hospitals.length) * 100)
      });
    });
    
    results.push(result);
    completed++;
    
    onHospitalComplete?.(result);
    
    // Small delay between requests to be nice to servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Generate a unique hash for a job to detect duplicates
function generateJobHash(job) {
  // Use hospital + title + URL as unique identifier
  const key = `${job.hospitalId || job.hospitalName || ''}_${job.title || ''}_${job.link || ''}`.toLowerCase().trim();
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

// Save scraped jobs to the database with deduplication
export async function saveScrapedJobs(jobs, hospitals) {
  const { Job, Hospital } = await import('@/api/entities');
  const savedJobs = [];
  const updatedJobs = [];
  const skippedJobs = [];
  
  // Create a map of hospitals for quick lookup
  const hospitalMap = {};
  if (hospitals) {
    hospitals.forEach(h => {
      hospitalMap[h.id] = h;
    });
  }
  
  // Fetch existing jobs for deduplication
  const existingJobs = await Job.list('-created_date', 5000);
  const existingJobsByHash = {};
  const existingJobsByUrl = {};
  
  existingJobs.forEach(job => {
    // Index by URL
    if (job.jobDetailsUrl) {
      existingJobsByUrl[job.jobDetailsUrl] = job;
    }
    // Index by hash
    const hash = generateJobHash({
      hospitalId: job.hospitalId,
      hospitalName: job.hospitalName,
      title: job.title,
      link: job.jobDetailsUrl
    });
    existingJobsByHash[hash] = job;
  });
  
  // Track hospitals that were scanned for updating last_scraped
  const scannedHospitalIds = new Set();
  
  for (const job of jobs) {
    try {
      // Get hospital info for additional fields
      const hospital = hospitalMap[job.hospitalId] || {};
      scannedHospitalIds.add(job.hospitalId);
      
      // Check for duplicates by URL first (most reliable)
      const jobUrl = job.link || '';
      if (jobUrl && existingJobsByUrl[jobUrl]) {
        const existingJob = existingJobsByUrl[jobUrl];
        // Update the existing job's scraped_at timestamp to show it's still active
        await Job.update(existingJob.id, {
          scraped_at: new Date().toISOString(),
          isActive: true,
          status: 'active'
        });
        updatedJobs.push({ ...existingJob, updated: true });
        console.log(`Updated existing job: ${job.title}`);
        continue;
      }
      
      // Check by hash (catches jobs with slightly different URLs)
      const jobHash = generateJobHash(job);
      if (existingJobsByHash[jobHash]) {
        const existingJob = existingJobsByHash[jobHash];
        await Job.update(existingJob.id, {
          scraped_at: new Date().toISOString(),
          isActive: true,
          status: 'active',
          // Update URL if it changed
          jobDetailsUrl: jobUrl || existingJob.jobDetailsUrl
        });
        updatedJobs.push({ ...existingJob, updated: true });
        console.log(`Updated existing job (by hash): ${job.title}`);
        continue;
      }
      
      // Determine seniority level from title
      const seniority = determineSeniority(job.title);
      
      // New job - create it
      const saved = await Job.create({
        // Core job info
        title: job.title,
        specialty: job.specialty || 'Allgemein',
        seniority: seniority,
        
        // Hospital info
        hospitalId: job.hospitalId,
        hospitalName: job.hospitalName,
        hospitalLogo: hospital.logo_url || null,
        
        // Location info
        city: job.location || hospital.city || '',
        state: hospital.state || 'BW',
        
        // URLs
        jobDetailsUrl: jobUrl,
        sourceUrl: job.source_url || '',
        
        // Status and dates
        isActive: true,
        status: 'active',
        scraped_at: job.scraped_at,
        created_date: new Date().toISOString(),
        
        // Additional metadata
        portalType: job.portalType || 'generic',
        description: job.description || '',
        
        // Deduplication hash
        jobHash: jobHash
      });
      savedJobs.push(saved);
      
      // Add to our local maps to prevent duplicates within this batch
      existingJobsByUrl[jobUrl] = saved;
      existingJobsByHash[jobHash] = saved;
      
      console.log(`Created new job: ${job.title}`);
    } catch (error) {
      console.error('Error saving job:', error);
      skippedJobs.push({ job, error: error.message });
    }
  }
  
  // Update last_scraped timestamp for all scanned hospitals
  for (const hospitalId of scannedHospitalIds) {
    try {
      await Hospital.update(hospitalId, {
        last_scraped: new Date().toISOString()
      });
    } catch (e) {
      console.log('Could not update hospital last_scraped:', e);
    }
  }
  
  console.log(`Scrape results: ${savedJobs.length} new, ${updatedJobs.length} updated, ${skippedJobs.length} skipped`);
  
  return {
    saved: savedJobs,
    updated: updatedJobs,
    skipped: skippedJobs,
    summary: {
      newJobs: savedJobs.length,
      updatedJobs: updatedJobs.length,
      skippedJobs: skippedJobs.length,
      totalProcessed: jobs.length
    }
  };
}

// Helper to determine seniority from job title
// Returns the primary seniority level (first match found in title order)
function determineSeniority(title) {
  const titleLower = title.toLowerCase();
  
  // Check for combined positions (e.g., "Assistenzärztin/-arzt oder Fachärztin/-arzt")
  // In these cases, return the lower seniority level to be more inclusive
  const hasAssistenzarzt = titleLower.includes('assistenzarzt') || titleLower.includes('assistenzärztin') || 
                           titleLower.includes('arzt in weiterbildung') || titleLower.includes('ärztin in weiterbildung');
  const hasFacharzt = titleLower.includes('facharzt') || titleLower.includes('fachärztin');
  const hasOberarzt = titleLower.includes('oberarzt') || titleLower.includes('oberärztin');
  const hasChefarzt = titleLower.includes('chefarzt') || titleLower.includes('chefärztin');
  
  // If multiple levels mentioned, return the lower level (more inclusive)
  if (hasAssistenzarzt && hasFacharzt) return 'Assistenzarzt/Facharzt';
  if (hasFacharzt && hasOberarzt) return 'Facharzt/Oberarzt';
  if (hasOberarzt && hasChefarzt) return 'Oberarzt/Chefarzt';
  
  // Single level
  if (hasChefarzt) return 'Chefarzt';
  if (hasOberarzt) return 'Oberarzt';
  if (hasFacharzt) return 'Facharzt';
  if (hasAssistenzarzt) return 'Assistenzarzt';
  
  // Generic doctor position
  if (titleLower.includes('arzt') || titleLower.includes('ärztin')) return 'Arzt';
  
  return 'Other';
}

export default {
  scrapeHospitalJobs,
  scrapeMultipleHospitals,
  saveScrapedJobs,
  detectPortalType,
  extractSpecialty,
  determineSeniority
};
