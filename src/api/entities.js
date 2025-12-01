// Unified Data Layer - supports both Supabase and localStorage
import {
  Hospital,
  Doctor,
  Job,
  Match,
  Application,
  SeedUrl,
  EmailLog,
  EmailConfig,
  EmailTemplate,
  getStorageMode
} from '@/lib/dataLayer';

import { base44 } from './base44Client';

// Re-export entities from data layer
export { Hospital, Doctor, Job, Match, Application, SeedUrl, EmailLog, EmailConfig, EmailTemplate };

// Export storage mode helper
export { getStorageMode };

// Auth SDK (still uses mock for now)
export const User = base44.auth;