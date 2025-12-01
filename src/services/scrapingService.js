// Scraping Service - Persistent background scraping manager
// This service persists scraping state to localStorage so it survives page navigation

const SCRAPING_STATE_KEY = 'med_match_scraping_state';
const SCRAPING_QUEUE_KEY = 'med_match_scraping_queue';
const SCRAPING_RESULTS_KEY = 'med_match_scraping_results';

// Get current scraping state
export const getScrapingState = () => {
  try {
    const state = localStorage.getItem(SCRAPING_STATE_KEY);
    return state ? JSON.parse(state) : {
      isRunning: false,
      isPaused: false,
      currentIndex: 0,
      totalUrls: 0,
      startedAt: null,
      currentUrl: null,
      completedUrls: [],
      failedUrls: [],
      jobsFound: 0,
      jobsSaved: 0
    };
  } catch {
    return {
      isRunning: false,
      isPaused: false,
      currentIndex: 0,
      totalUrls: 0,
      startedAt: null,
      currentUrl: null,
      completedUrls: [],
      failedUrls: [],
      jobsFound: 0,
      jobsSaved: 0
    };
  }
};

// Save scraping state
export const setScrapingState = (state) => {
  localStorage.setItem(SCRAPING_STATE_KEY, JSON.stringify(state));
  // Dispatch event so other components can listen
  window.dispatchEvent(new CustomEvent('scrapingStateChange', { detail: state }));
};

// Get scraping queue
export const getScrapingQueue = () => {
  try {
    const queue = localStorage.getItem(SCRAPING_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
};

// Set scraping queue
export const setScrapingQueue = (queue) => {
  localStorage.setItem(SCRAPING_QUEUE_KEY, JSON.stringify(queue));
};

// Get scraping results
export const getScrapingResults = () => {
  try {
    const results = localStorage.getItem(SCRAPING_RESULTS_KEY);
    return results ? JSON.parse(results) : [];
  } catch {
    return [];
  }
};

// Add result to scraping results
export const addScrapingResult = (result) => {
  const results = getScrapingResults();
  results.push({
    ...result,
    timestamp: new Date().toISOString()
  });
  // Keep only last 100 results
  if (results.length > 100) {
    results.shift();
  }
  localStorage.setItem(SCRAPING_RESULTS_KEY, JSON.stringify(results));
};

// Clear scraping results
export const clearScrapingResults = () => {
  localStorage.setItem(SCRAPING_RESULTS_KEY, JSON.stringify([]));
};

// Start a new scraping session
export const startScrapingSession = (urls) => {
  const state = {
    isRunning: true,
    isPaused: false,
    currentIndex: 0,
    totalUrls: urls.length,
    startedAt: new Date().toISOString(),
    currentUrl: urls[0]?.url || null,
    completedUrls: [],
    failedUrls: [],
    jobsFound: 0,
    jobsSaved: 0
  };
  setScrapingState(state);
  setScrapingQueue(urls);
  clearScrapingResults();
  return state;
};

// Update progress
export const updateScrapingProgress = (updates) => {
  const state = getScrapingState();
  const newState = { ...state, ...updates };
  setScrapingState(newState);
  return newState;
};

// Mark URL as completed
export const markUrlCompleted = (url, jobsFound = 0, jobsSaved = 0) => {
  const state = getScrapingState();
  const queue = getScrapingQueue();
  
  state.completedUrls.push(url);
  state.jobsFound += jobsFound;
  state.jobsSaved += jobsSaved;
  state.currentIndex += 1;
  
  if (state.currentIndex < queue.length) {
    state.currentUrl = queue[state.currentIndex]?.url || null;
  } else {
    state.isRunning = false;
    state.currentUrl = null;
  }
  
  setScrapingState(state);
  return state;
};

// Mark URL as failed
export const markUrlFailed = (url, error) => {
  const state = getScrapingState();
  const queue = getScrapingQueue();
  
  state.failedUrls.push({ url, error: error?.message || 'Unknown error' });
  state.currentIndex += 1;
  
  if (state.currentIndex < queue.length) {
    state.currentUrl = queue[state.currentIndex]?.url || null;
  } else {
    state.isRunning = false;
    state.currentUrl = null;
  }
  
  setScrapingState(state);
  return state;
};

// Pause scraping
export const pauseScraping = () => {
  const state = getScrapingState();
  state.isPaused = true;
  setScrapingState(state);
  return state;
};

// Resume scraping
export const resumeScraping = () => {
  const state = getScrapingState();
  state.isPaused = false;
  setScrapingState(state);
  return state;
};

// Stop scraping
export const stopScraping = () => {
  const state = getScrapingState();
  state.isRunning = false;
  state.isPaused = false;
  setScrapingState(state);
  return state;
};

// Check if scraping is in progress
export const isScrapingInProgress = () => {
  const state = getScrapingState();
  return state.isRunning && !state.isPaused;
};

// Get progress percentage
export const getScrapingProgress = () => {
  const state = getScrapingState();
  if (state.totalUrls === 0) return 0;
  return Math.round((state.currentIndex / state.totalUrls) * 100);
};

// Subscribe to scraping state changes
export const subscribeToScrapingState = (callback) => {
  const handler = (event) => callback(event.detail);
  window.addEventListener('scrapingStateChange', handler);
  return () => window.removeEventListener('scrapingStateChange', handler);
};

// Check for interrupted session on page load
export const checkForInterruptedSession = () => {
  const state = getScrapingState();
  if (state.isRunning && state.currentIndex < state.totalUrls) {
    return {
      wasInterrupted: true,
      state,
      queue: getScrapingQueue()
    };
  }
  return { wasInterrupted: false };
};

export default {
  getScrapingState,
  setScrapingState,
  getScrapingQueue,
  setScrapingQueue,
  getScrapingResults,
  addScrapingResult,
  clearScrapingResults,
  startScrapingSession,
  updateScrapingProgress,
  markUrlCompleted,
  markUrlFailed,
  pauseScraping,
  resumeScraping,
  stopScraping,
  isScrapingInProgress,
  getScrapingProgress,
  subscribeToScrapingState,
  checkForInterruptedSession
};
