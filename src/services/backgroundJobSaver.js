// Background Job Saver Service
// Saves jobs in the background, continues even when navigating away from the page

import { Job, Hospital } from '@/api/entities';

// Global state for background saving
let savingState = {
  isRunning: false,
  isPaused: false,
  totalJobs: 0,
  savedCount: 0,
  updatedCount: 0,
  skippedCount: 0,
  currentJobTitle: '',
  error: null,
  startTime: null,
  listeners: new Set(),
};

// Generate a hash for job deduplication
function generateJobHash(job) {
  const str = `${job.hospitalId || ''}-${job.hospitalName || ''}-${job.title || ''}-${job.link || ''}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `job_${Math.abs(hash).toString(16)}`;
}

// Determine seniority from job title
function determineSeniority(title) {
  if (!title) return 'Assistenzarzt';
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('chefarzt') || titleLower.includes('chef')) return 'Chefarzt';
  if (titleLower.includes('oberarzt') || titleLower.includes('ober')) return 'Oberarzt';
  if (titleLower.includes('facharzt') || titleLower.includes('fach')) return 'Facharzt';
  if (titleLower.includes('assistenzarzt') || titleLower.includes('assistenz')) return 'Assistenzarzt';
  
  return 'Assistenzarzt';
}

// Subscribe to state updates
export function subscribeToSaveProgress(callback) {
  savingState.listeners.add(callback);
  // Immediately call with current state
  callback({ ...savingState });
  return () => savingState.listeners.delete(callback);
}

// Notify all listeners of state change
function notifyListeners() {
  const state = { ...savingState };
  savingState.listeners.forEach(callback => {
    try {
      callback(state);
    } catch (e) {
      console.error('Error in save progress listener:', e);
    }
  });
}

// Get current save state
export function getSaveState() {
  return { ...savingState };
}

// Cancel the current save operation
export function cancelSave() {
  savingState.isPaused = true;
  savingState.isRunning = false;
  notifyListeners();
}

// Start saving jobs in the background
export async function saveJobsInBackground(jobs, hospitals = []) {
  if (savingState.isRunning) {
    console.log('Save already in progress, please wait...');
    return null;
  }

  // Reset state
  savingState = {
    ...savingState,
    isRunning: true,
    isPaused: false,
    totalJobs: jobs.length,
    savedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    currentJobTitle: '',
    error: null,
    startTime: Date.now(),
  };
  notifyListeners();

  const savedJobs = [];
  const updatedJobs = [];
  const skippedJobs = [];

  // Create a map of hospitals for quick lookup
  const hospitalMap = {};
  hospitals.forEach(h => {
    hospitalMap[h.id] = h;
  });

  try {
    // Fetch existing jobs for deduplication (fetch all)
    console.log('[BackgroundSaver] Fetching existing jobs for deduplication...');
    const existingJobs = await Job.list('-created_at', 15000);
    console.log(`[BackgroundSaver] Found ${existingJobs.length} existing jobs`);
    
    const existingJobsByHash = {};
    const existingJobsByUrl = {};

    existingJobs.forEach(job => {
      const url = job.jobDetailsUrl || job.job_details_url;
      if (url) {
        existingJobsByUrl[url] = job;
      }
      const hash = generateJobHash({
        hospitalId: job.hospitalId || job.hospital_id,
        hospitalName: job.hospitalName || job.hospital_name,
        title: job.title,
        link: url
      });
      existingJobsByHash[hash] = job;
    });

    // Track hospitals that were scanned
    const scannedHospitalIds = new Set();

    // Process jobs one by one
    for (let i = 0; i < jobs.length; i++) {
      // Check if cancelled
      if (savingState.isPaused || !savingState.isRunning) {
        console.log('[BackgroundSaver] Save cancelled by user');
        break;
      }

      const job = jobs[i];
      savingState.currentJobTitle = job.title || `Job ${i + 1}`;
      notifyListeners();

      try {
        const hospital = hospitalMap[job.hospitalId] || {};
        scannedHospitalIds.add(job.hospitalId);

        // Check for duplicates by URL
        const jobUrl = job.link || '';
        if (jobUrl && existingJobsByUrl[jobUrl]) {
          const existingJob = existingJobsByUrl[jobUrl];
          await Job.update(existingJob.id, {
            scraped_at: new Date().toISOString(),
            is_active: true,
            status: 'active'
          });
          updatedJobs.push(existingJob);
          savingState.updatedCount++;
          notifyListeners();
          continue;
        }

        // Check by hash
        const jobHash = generateJobHash(job);
        if (existingJobsByHash[jobHash]) {
          const existingJob = existingJobsByHash[jobHash];
          await Job.update(existingJob.id, {
            scraped_at: new Date().toISOString(),
            is_active: true,
            status: 'active',
            job_details_url: jobUrl || existingJob.job_details_url
          });
          updatedJobs.push(existingJob);
          savingState.updatedCount++;
          notifyListeners();
          continue;
        }

        // New job - create it
        const seniority = determineSeniority(job.title);
        const saved = await Job.create({
          title: job.title,
          specialty: job.specialty || 'Allgemein',
          seniority: seniority,
          hospital_id: job.hospitalId,
          hospital_name: job.hospitalName,
          city: job.location || hospital.city || '',
          state: hospital.state || 'BW',
          job_details_url: jobUrl,
          source_url: job.source_url || '',
          is_active: true,
          status: 'active',
          scraped_at: job.scraped_at || new Date().toISOString(),
          portal_type: job.portalType || 'generic',
          description_html: job.description || '',
        });

        savedJobs.push(saved);
        existingJobsByUrl[jobUrl] = saved;
        existingJobsByHash[jobHash] = saved;
        savingState.savedCount++;
        notifyListeners();

      } catch (error) {
        console.error(`[BackgroundSaver] Error saving job "${job.title}":`, error);
        skippedJobs.push({ job, error: error.message });
        savingState.skippedCount++;
        notifyListeners();
      }

      // Small delay to prevent overwhelming the database
      if (i % 10 === 0) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    // Update last_scraped for hospitals
    for (const hospitalId of scannedHospitalIds) {
      if (hospitalId) {
        try {
          await Hospital.update(hospitalId, {
            last_scraped: new Date().toISOString()
          });
        } catch (e) {
          // Ignore hospital update errors
        }
      }
    }

  } catch (error) {
    console.error('[BackgroundSaver] Fatal error:', error);
    savingState.error = error.message;
  }

  // Mark as complete
  savingState.isRunning = false;
  savingState.currentJobTitle = '';
  notifyListeners();

  const result = {
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

  console.log(`[BackgroundSaver] Complete: ${savedJobs.length} new, ${updatedJobs.length} updated, ${skippedJobs.length} skipped`);
  
  return result;
}
