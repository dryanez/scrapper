# Med-Match - Medical Job Matching Platform

A React application for matching doctors with hospital job opportunities in Germany.

## Features

- 🏥 **1,163 German Hospitals** - Pre-loaded from 9 German states
- 👨‍⚕️ **Doctor Management** - Track and manage doctor candidates
- 🔍 **Job Scraping** - Scan hospital career pages for job listings
- 🎯 **Matching System** - Match doctors with suitable positions
- 📊 **Dashboard** - Overview of all matches and applications

## Quick Start

```bash
npm install
npm run dev
```

## Data Storage Options

### Option 1: localStorage (Default)
Data is stored in your browser. Simple but data doesn't sync between users/devices.

### Option 2: Supabase (Shared Database)
For shared data across users, set up Supabase:

#### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for it to initialize

#### 2. Set Up Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and run the contents of `supabase/schema.sql`
3. Then run `supabase/rls-policies.sql` for public access

#### 3. Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your credentials from Supabase:
   - Go to **Project Settings** > **API**
   - Copy the **Project URL** and **anon public** key

3. Update `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

#### 4. (Optional) Seed Initial Data
```bash
node supabase/seed-supabase.mjs
```

#### 5. Deploy to Vercel
1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Building for Production

```bash
npm run build
```

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL) or localStorage
- **Deployment**: Vercel

## Project Structure

```
src/
├── api/          # API layer (entities, integrations)
├── components/   # React components
├── data/         # Seed data (hospitals, doctors)
├── lib/          # Supabase client, utilities
├── pages/        # Page components
└── services/     # Business logic (scraping, etc.)
```
