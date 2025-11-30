import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Doctors from "./Doctors";

import Scraping from "./Scraping";

import JobDetails from "./JobDetails";

import Hospitals from "./Hospitals";

import DoctorDetail from "./DoctorDetail";

import EmailComposer from "./EmailComposer";

import EmailSettings from "./EmailSettings";

import HospitalDetail from "./HospitalDetail";

import HospitalCount from "./HospitalCount";

import HospitalAnalysis from "./HospitalAnalysis";

import Applications from "./Applications";

import FollowUpNeeded from "./FollowUpNeeded";

import ActiveCandidates from "./ActiveCandidates";

import UnmatchedDoctors from "./UnmatchedDoctors";

import DoctorMatches from "./DoctorMatches";

import AmeosScraper from "./AmeosScraper";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Doctors: Doctors,
    
    Scraping: Scraping,
    
    JobDetails: JobDetails,
    
    Hospitals: Hospitals,
    
    DoctorDetail: DoctorDetail,
    
    EmailComposer: EmailComposer,
    
    EmailSettings: EmailSettings,
    
    HospitalDetail: HospitalDetail,
    
    HospitalCount: HospitalCount,
    
    HospitalAnalysis: HospitalAnalysis,
    
    Applications: Applications,
    
    FollowUpNeeded: FollowUpNeeded,
    
    ActiveCandidates: ActiveCandidates,
    
    UnmatchedDoctors: UnmatchedDoctors,
    
    DoctorMatches: DoctorMatches,
    
    AmeosScraper: AmeosScraper,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Doctors" element={<Doctors />} />
                
                <Route path="/Scraping" element={<Scraping />} />
                
                <Route path="/JobDetails" element={<JobDetails />} />
                
                <Route path="/Hospitals" element={<Hospitals />} />
                
                <Route path="/DoctorDetail" element={<DoctorDetail />} />
                
                <Route path="/EmailComposer" element={<EmailComposer />} />
                
                <Route path="/EmailSettings" element={<EmailSettings />} />
                
                <Route path="/HospitalDetail" element={<HospitalDetail />} />
                
                <Route path="/HospitalCount" element={<HospitalCount />} />
                
                <Route path="/HospitalAnalysis" element={<HospitalAnalysis />} />
                
                <Route path="/Applications" element={<Applications />} />
                
                <Route path="/FollowUpNeeded" element={<FollowUpNeeded />} />
                
                <Route path="/ActiveCandidates" element={<ActiveCandidates />} />
                
                <Route path="/UnmatchedDoctors" element={<UnmatchedDoctors />} />
                
                <Route path="/DoctorMatches" element={<DoctorMatches />} />
                
                <Route path="/AmeosScraper" element={<AmeosScraper />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}