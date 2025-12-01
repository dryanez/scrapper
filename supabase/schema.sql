-- =============================================
-- SUPABASE SCHEMA FOR MED-MATCH
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- HOSPITALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  website_url TEXT,
  career_page_url TEXT,
  contact_info TEXT,
  contact_emails TEXT,
  logo_url TEXT,
  bed_count INTEGER,
  portal_type TEXT,
  specialties JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  last_scraped TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_hospitals_name ON hospitals(name);
CREATE INDEX IF NOT EXISTS idx_hospitals_state ON hospitals(state);
CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals(city);

-- =============================================
-- DOCTORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  specialties JSONB DEFAULT '[]'::jsonb,
  desired_states JSONB DEFAULT '[]'::jsonb,
  experience_years INTEGER,
  current_position TEXT,
  language_skills JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  notes TEXT,
  cv_url TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);

-- =============================================
-- JOBS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  hospital_name TEXT,
  city TEXT,
  state TEXT,
  specialty TEXT,
  seniority TEXT,
  description_html TEXT,
  job_details_url TEXT UNIQUE,
  source_url TEXT,
  source TEXT,
  is_active BOOLEAN DEFAULT true,
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_hospital ON jobs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_jobs_specialty ON jobs(specialty);
CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);

-- =============================================
-- MATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  match_score DECIMAL(5,2),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_doctor ON matches(doctor_id);
CREATE INDEX IF NOT EXISTS idx_matches_job ON matches(job_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- =============================================
-- APPLICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  response_at TIMESTAMPTZ,
  interview_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_doctor ON applications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- =============================================
-- SEED URLS TABLE (for scraping)
-- =============================================
CREATE TABLE IF NOT EXISTS seed_urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  hospital_name TEXT,
  city TEXT,
  state TEXT,
  logo_url TEXT,
  enabled BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  jobs_found INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seed_urls_enabled ON seed_urls(enabled);

-- =============================================
-- EMAIL LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMAIL CONFIG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  smtp_password TEXT,
  from_email TEXT,
  from_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMAIL TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- For production, enable RLS and set up policies
-- =============================================

-- Enable RLS on all tables (commented out for initial setup)
-- ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE seed_urls ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_configs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- For public access (no auth required), create policies:
-- CREATE POLICY "Allow all" ON hospitals FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON doctors FOR ALL USING (true);
-- etc.

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seed_urls_updated_at BEFORE UPDATE ON seed_urls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_configs_updated_at BEFORE UPDATE ON email_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DONE! Your database is ready.
-- =============================================
