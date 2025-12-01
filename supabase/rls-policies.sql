-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- Run this AFTER schema.sql
-- This allows public read/write access (no auth)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anyone can read/write)
-- WARNING: This is for development/demo only. Add authentication for production!

CREATE POLICY "Public read access" ON hospitals FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON hospitals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON hospitals FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON hospitals FOR DELETE USING (true);

CREATE POLICY "Public read access" ON doctors FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON doctors FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON doctors FOR DELETE USING (true);

CREATE POLICY "Public read access" ON jobs FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON jobs FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON jobs FOR DELETE USING (true);

CREATE POLICY "Public read access" ON matches FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON matches FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON matches FOR DELETE USING (true);

CREATE POLICY "Public read access" ON applications FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON applications FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON applications FOR DELETE USING (true);

CREATE POLICY "Public read access" ON seed_urls FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON seed_urls FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON seed_urls FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON seed_urls FOR DELETE USING (true);

CREATE POLICY "Public read access" ON email_logs FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON email_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON email_logs FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON email_logs FOR DELETE USING (true);

CREATE POLICY "Public read access" ON email_configs FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON email_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON email_configs FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON email_configs FOR DELETE USING (true);

CREATE POLICY "Public read access" ON email_templates FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON email_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON email_templates FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON email_templates FOR DELETE USING (true);

-- =============================================
-- DONE! All tables now have public access.
-- =============================================
