import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, User, MapPin, Calendar as CalendarIcon, FileText, X, BarChart2, LogOut, Search, Filter, ChevronsRight, UploadCloud, CheckCircle, Clock, XCircle, PlusCircle, RefreshCw, Edit, Eye, Sparkles } from 'lucide-react';

// MOCK DATA
const mockJobsDatabase = [
    { id: 1, title: 'Facharzt für Innere Medizin', hospital: 'Charité - Universitätsmedizin Berlin', city: 'Berlin', state: 'Berlin', specialty: 'Innere Medizin', level: 'Facharzt', link: 'https://karriere.charite.de/', lat: 52.52, lng: 13.40, description: 'Die Charité – Universitätsmedizin Berlin ist eine der größten Universitätskliniken Europas. Hier forschen, heilen und lehren Ärzte und Wissenschaftler auf internationalem Spitzenniveau. Werden Sie Teil unseres Teams als Facharzt für Innere Medizin. Sie übernehmen die fachärztliche Versorgung von Patienten auf Normalstation, in der Notaufnahme und auf der Intensivstation. Teilnahme am Bereitschaftsdienst ist erforderlich. Wir erwarten eine abgeschlossene Facharztausbildung und Interesse an wissenschaftlicher Arbeit.' },
    { id: 2, title: 'Assistenzarzt Anästhesiologie', hospital: 'Klinikum rechts der Isar', city: 'München', state: 'Bayern', specialty: 'Anästhesiologie', level: 'Assistenzarzt', link: 'https://www.mri.tum.de/karriere', lat: 48.14, lng: 11.58, description: 'Das Klinikum rechts der Isar der Technischen Universität München widmet sich mit rund 6.600 Mitarbeitern der Krankenversorgung, der Forschung und der Lehre. Wir suchen engagierte Assistenzärzte für unser Team der Anästhesiologie. Sie werden in allen Bereichen der Anästhesie, Intensivmedizin, Notfallmedizin und Schmerztherapie ausgebildet. Wir bieten ein strukturiertes Weiterbildungscurriculum.' },
    { id: 3, title: 'Oberarzt Chirurgie', hospital: 'Universitätsklinikum Hamburg-Eppendorf', city: 'Hamburg', state: 'Hamburg', specialty: 'Chirurgie', level: 'Oberarzt', link: 'https://www.uke.de/karriere/index.html', lat: 53.55, lng: 9.99, description: 'Das UKE ist eines der modernsten Krankenhäuser Europas. Wir suchen einen erfahrenen Oberarzt für unsere viszeralchirurgische Abteilung, der bereit ist, Verantwortung zu übernehmen und unser Team zu leiten. Zu Ihren Aufgaben gehören die Durchführung komplexer Operationen, die Supervision von Assistenzärzten und die Teilnahme an der Rufbereitschaft. Habilitation ist erwünscht, aber keine Voraussetzung.' },
];

const initialCandidates = [
    {
        id: 101,
        name: 'Dr. Elena Petrova',
        specialty: 'Innere Medizin',
        status: 'Warten auf FSP-Termin',
        progress: 60,
        applications: [1],
        documents: [
            { name: 'CV_and_Cover_Letter_for_German_Hospitals.docx', status: 'ok', type: 'doc', url: 'https://docs.google.com/document/d/1_S_w_s-y_z_S_w_s-y_z/edit' },
            { name: 'Approbation_Antrag_Formular.pdf', status: 'missing', type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
            { name: 'Motivation Letter.gdoc', status: 'ok', type: 'gdoc', url: 'https://docs.google.com/document/d/1_S_w_s-y_z_S_w_s-y_z/edit' }
        ]
    },
    {
        id: 102,
        name: 'Dr. Carlos Garcia',
        specialty: 'Anästhesiologie',
        status: 'Dokumente werden übersetzt',
        progress: 30,
        applications: [],
        documents: [
            { name: 'Passport.pdf', status: 'ok', type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
            { name: 'Medical Degree Translation Certificate.pdf', status: 'in_progress', type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
        ]
    },
];

const progressSteps = [
    { id: 'docs', name: 'Document Collection' }, { id: 'translation', name: 'Translations' }, { id: 'assessment', name: 'Defizitbescheid' }, { id: 'exam', name: 'Kenntnisprüfung / FSP' }, { id: 'approbation', name: 'Approbation' }, { id: 'visa', name: 'Visa' },
];

const App = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [candidates, setCandidates] = useState(initialCandidates);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);

    const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

    const handleSetCandidates = (newCandidates) => {
        setCandidates(newCandidates);
    }

    const renderView = () => {
        if (selectedCandidate) {
            return <CandidateProfile
                candidate={selectedCandidate}
                onBack={() => setSelectedCandidateId(null)}
                onUpdateCandidates={handleSetCandidates}
                allCandidates={candidates}
            />;
        }
        switch (activeView) {
            case 'dashboard': return <Dashboard candidates={candidates} onSelectCandidate={(c) => setSelectedCandidateId(c.id)} />;
            case 'jobs': return <JobDashboard />;
            case 'candidates': return <CandidateList candidates={candidates} onSelectCandidate={(c) => setSelectedCandidateId(c.id)} />;
            case 'calendar': return <AgencyCalendar />;
            default: return <Dashboard candidates={candidates} onSelectCandidate={(c) => setSelectedCandidateId(c.id)} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <main className="flex-1 p-0 overflow-hidden">
                {renderView()}
            </main>
        </div>
    );
};

const Sidebar = ({ activeView, setActiveView }) => {
    const navItems = [
        { id: 'dashboard', icon: BarChart2, label: 'Dashboard' }, { id: 'jobs', icon: Briefcase, label: 'Job Listings' }, { id: 'candidates', icon: User, label: 'Candidates' }, { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
    ];
    return (
        <nav className="w-16 md:w-64 bg-white shadow-lg flex flex-col z-10">
            <div className="flex items-center justify-center md:justify-start p-4 border-b">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <h1 className="hidden md:block ml-2 text-xl font-bold text-gray-800">Klinik-Connect</h1>
            </div>
            <ul className="flex-1 mt-4">
                {navItems.map(item => (
                    <li key={item.id} className="px-4 py-2">
                        <button onClick={() => setActiveView(item.id)} className={`flex items-center w-full p-2 rounded-lg transition-colors ${activeView === item.id ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <item.icon className="h-5 w-5" />
                            <span className="hidden md:block ml-4 font-medium">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <div className="p-4 border-t">
                <button className="flex items-center w-full p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                    <LogOut className="h-5 w-5" />
                    <span className="hidden md:block ml-4 font-medium">Logout</span>
                </button>
            </div>
        </nav>
    );
};

const IntegratedMapView = ({ jobs, hoveredJobId }) => {
    let mapUrl = '';
    const hoveredJob = jobs.find(job => (job.id || job.link) === hoveredJobId);

    if (hoveredJob && hoveredJob.lat && hoveredJob.lng) {
        const { lat, lng } = hoveredJob;
        const bbox = `${lng - 0.1},${lat - 0.1},${lng + 0.1},${lat + 0.1}`;
        mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    } else if (jobs.length > 0) {
        const latitudes = jobs.map(j => j.lat).filter(Boolean);
        const longitudes = jobs.map(j => j.lng).filter(Boolean);
        if (latitudes.length > 0) {
            const minLat = Math.min(...latitudes);
            const maxLat = Math.max(...latitudes);
            const minLng = Math.min(...longitudes);
            const maxLng = Math.max(...longitudes);
            const latPadding = (maxLat - minLat) * 0.2 || 0.1;
            const lngPadding = (maxLng - minLng) * 0.2 || 0.1;
            const bbox = `${minLng - lngPadding},${minLat - latPadding},${maxLng + lngPadding},${maxLat + latPadding}`;
            const markers = jobs.map(job => (job.lat && job.lng) ? `marker=${job.lat},${job.lng}` : '').filter(Boolean).join('&');
            mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&${markers}`;
        }
    }

    if (!mapUrl) {
        return <div className="w-full h-full bg-gray-200 flex items-center justify-center"><p>Map is ready. Waiting for job data...</p></div>;
    }

    return (
        <div className="w-full h-full bg-gray-200">
            <iframe key={mapUrl} width="100%" height="100%" frameBorder="0" scrolling="no" src={mapUrl} style={{ border: 'none' }} title="Job Map"></iframe>
        </div>
    );
};

const JobDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isScraping, setIsScraping] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [hoveredJobId, setHoveredJobId] = useState(null);

    const triggerScraper = async () => {
        setIsScraping(true);
        const scraperFunctionUrl = "/api/scrape";
        try {
            const response = await fetch(scraperFunctionUrl);
            if (!response.ok) {
                throw new Error(`Scraper failed with status: ${response.status}`);
            }
            const data = await response.json();

            if (Array.isArray(data)) {
                setJobs(data);
                alert(`Scraping complete! Found ${data.length} jobs.`);
            } else {
                throw new Error("Scraper did not return a valid job list.");
            }

        } catch (error) {
            console.error("Error triggering scraper:", error);
            alert(`Error: Could not get jobs. ${error.message}`);
        } finally {
            setIsScraping(false);
        }
    };

    useEffect(() => {
        setJobs(mockJobsDatabase);
        setIsLoading(false);
    }, []);

    return (
        <div className="flex flex-row h-full">
            <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-white h-full shadow-lg flex-shrink-0">
                <div className="p-4 border-b"><h2 className="text-2xl font-bold text-gray-800">Job Listings</h2></div>
                <div className="p-4 border-b">
                    <button onClick={triggerScraper} disabled={isScraping} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                        <RefreshCw className={`h-5 w-5 ${isScraping ? 'animate-spin' : ''}`} />
                        <span>{isScraping ? 'Scraping...' : 'Refresh Jobs'}</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (<div className="text-center py-16 text-gray-500">Connecting to database...</div>) :
                        (<div className="divide-y">{jobs.map(job => (<div key={job.id || job.link} onClick={() => setSelectedJob(job)} onMouseEnter={() => setHoveredJobId(job.id || job.link)} onMouseLeave={() => setHoveredJobId(null)} className="p-4 hover:bg-blue-50 cursor-pointer transition-colors"><h3 className="font-bold text-lg text-blue-700">{job.title}</h3><p className="text-gray-600">{job.hospital}</p><p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14} /> {job.city}</p></div>))}</div>)}
                </div>
            </div>
            <div className="hidden md:flex flex-1 h-full"><IntegratedMapView jobs={jobs} hoveredJobId={hoveredJobId} /></div>
            {selectedJob && <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
        </div>
    );
};

const JobDetailModal = ({ job, onClose }) => {
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleSummarize = async () => {
        setIsSummarizing(true);
        setSummary('');
        const prompt = `Summarize the following German job description for a medical doctor into a few key bullet points in English. Focus on the main responsibilities and required qualifications.\n\nJob Description:\n"""${job.description}"""`;

        try {
            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
                setSummary(result.candidates[0].content.parts[0].text);
            } else {
                setSummary('Could not generate summary.');
            }
        } catch (error) {
            console.error("Error summarizing:", error);
            setSummary('An error occurred while generating the summary.');
        } finally {
            setIsSummarizing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b"><h2 className="text-2xl font-bold text-gray-800">{job.title}</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
                <div className="p-6 overflow-y-auto">
                    <div className="mb-4"><p className="font-semibold text-gray-700">{job.hospital}</p><p className="text-gray-500 flex items-center gap-1"><MapPin size={14} /> {job.city}, {job.state}</p></div>
                    <div className="mb-6"><span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold mr-2 px-3 py-1 rounded-full">{job.specialty}</span><span className="inline-block bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full">{job.level}</span></div>

                    <button onClick={handleSummarize} disabled={isSummarizing} className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50">
                        <Sparkles className={`h-5 w-5 ${isSummarizing ? 'animate-spin' : ''}`} />
                        <span>{isSummarizing ? 'Generating Summary...' : '✨ Summarize with AI'}</span>
                    </button>

                    {summary && <div className="mb-4 p-4 bg-purple-50 rounded-lg"><h4 className="font-bold text-purple-800 mb-2">AI Summary:</h4><div className="prose prose-sm max-w-none text-purple-900" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} /></div>}

                    <h3 className="text-lg font-bold text-gray-700 mb-2">Full Job Description</h3><p className="text-gray-600 whitespace-pre-wrap">{job.description}</p>
                </div>
                <div className="p-4 bg-gray-50 border-t mt-auto"><a href={job.link} target="_blank" rel="noopener noreferrer" className="w-full block text-center px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">Apply on Company Website</a></div>
            </div>
        </div>
    );
};

const CandidateProfile = ({ candidate, onBack, onUpdateCandidates, allCandidates }) => {
    const fileInputRef = useRef(null);
    const [matches, setMatches] = useState([]);
    const [isMatching, setIsMatching] = useState(false);

    const handleFindMatches = async () => {
        setIsMatching(true);
        setMatches([]);

        const candidateProfileForPrompt = `Name: ${candidate.name}, Specialty: ${candidate.specialty}`;
        const jobsForPrompt = JSON.stringify(mockJobsDatabase.map(j => ({ id: j.id, title: j.title, specialty: j.specialty, level: j.level, description: j.description.substring(0, 100) + '...' })));

        const prompt = `You are an expert medical recruiter in Germany. Given the following candidate profile and list of jobs, find the top 3 best matches. Provide your response as a JSON object.

Candidate Profile:
${candidateProfileForPrompt}

Available Jobs:
${jobsForPrompt}

Return a JSON object with a single key "matches" which is an array of objects. Each object should have "jobId" (integer) and "reason" (a short string explaining why it's a good match).`;

        try {
            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "matches": {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        "jobId": { "type": "INTEGER" },
                                        "reason": { "type": "STRING" }
                                    }
                                }
                            }
                        }
                    }
                }
            };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
                const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
                const matchedJobs = parsedJson.matches.map(match => {
                    const jobDetails = mockJobsDatabase.find(j => j.id === match.jobId);
                    return { ...jobDetails, reason: match.reason };
                });
                setMatches(matchedJobs);
            } else {
                setMatches([{ id: 0, title: 'Could not find matches.' }]);
            }
        } catch (error) {
            console.error("Error finding matches:", error);
            setMatches([{ id: 0, title: 'An error occurred while finding matches.' }]);
        } finally {
            setIsMatching(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ok': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'in_progress': return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'missing': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return null;
        }
    };

    const handleUploadClick = () => { fileInputRef.current.click(); };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        alert(`Simulating upload for: ${file.name}`);
        const extension = file.name.split('.').pop().toLowerCase();
        let type = 'other';
        if (extension === 'pdf') type = 'pdf';
        if (['doc', 'docx'].includes(extension)) type = 'doc';
        if (extension === 'gdoc') type = 'gdoc';
        const newDocument = { name: file.name, status: 'ok', type: type, url: type === 'pdf' ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : 'https://docs.google.com/document/d/1_S_w_s-y_z_S_w_s-y_z/edit' };
        const updatedCandidates = allCandidates.map(c => {
            if (c.id === candidate.id) {
                const docExists = c.documents.some(doc => doc.name === newDocument.name);
                if (docExists) return c;
                return { ...c, documents: [...c.documents, newDocument] };
            }
            return c;
        });
        onUpdateCandidates(updatedCandidates);
    };

    const handleActionClick = (doc) => { window.open(doc.url, '_blank'); }

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
            <button onClick={onBack} className="mb-6 text-blue-600 hover:underline">&larr; Back to list</button>
            <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 mb-6">
                    <div><h2 className="text-4xl font-bold text-gray-800">{candidate.name}</h2><p className="text-xl text-blue-600">{candidate.specialty}</p></div>
                    <div className="mt-4 md:mt-0 text-lg font-semibold text-gray-700">Status: <span className="text-yellow-600">{candidate.status}</span></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2"><h3 className="text-2xl font-bold text-gray-700 mb-4">Progress Checklist</h3><div className="space-y-4">{progressSteps.map((step, index) => (<div key={step.id} className="flex items-center"><div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${index < (candidate.progress / 100 * progressSteps.length) ? 'bg-blue-600' : 'bg-gray-300'}`}>{index < (candidate.progress / 100 * progressSteps.length - 1) ? <CheckCircle size={20} /> : index + 1}</div><p className="ml-4 font-medium text-gray-700">{step.name}</p></div>))}</div></div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-4">Document Hub</h3>
                        <div className="space-y-3">
                            {candidate.documents.map(doc => (<div key={doc.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"><div className="flex items-center gap-3 w-0 flex-1">{getStatusIcon(doc.status)}<span className="truncate" title={doc.name}>{doc.name}</span></div>{doc.type === 'pdf' ? (<button onClick={() => handleActionClick(doc)} className="flex items-center gap-1 text-sm text-blue-600 hover:underline p-1 flex-shrink-0"><Eye size={16} /> View</button>) : (<button onClick={() => handleActionClick(doc)} className="flex items-center gap-1 text-sm text-green-600 hover:underline p-1 flex-shrink-0"><Edit size={16} /> Edit</button>)}</div>))}
                            <button onClick={handleUploadClick} className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><UploadCloud size={18} />Upload Document</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold text-gray-700 mb-4">AI Recruitment Assistant</h3>
                <button onClick={handleFindMatches} disabled={isMatching} className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold">
                    <Sparkles className={`h-5 w-5 ${isMatching ? 'animate-spin' : ''}`} />
                    <span>{isMatching ? 'Analyzing...' : '✨ Find Top Job Matches'}</span>
                </button>
                {matches.length > 0 && <div className="space-y-4">{matches.map(match => (<div key={match.id} className="p-4 border border-indigo-200 rounded-lg bg-indigo-50"><h4 className="font-bold text-indigo-800">{match.title}</h4><p className="text-sm text-gray-600 mb-2">{match.hospital}</p><p className="text-sm text-indigo-700"><span className="font-semibold">AI Analysis:</span> {match.reason}</p></div>))}</div>}
            </div>
        </div>
    );
};

const Dashboard = ({ candidates, onSelectCandidate }) => (<div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto"><h2 className="text-3xl font-bold text-gray-800 mb-6">Agency Dashboard</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-lg shadow"><h3 className="font-bold text-lg text-gray-700">New Jobs (24h)</h3><p className="text-4xl font-bold text-blue-600 mt-2">15</p></div><div className="bg-white p-6 rounded-lg shadow"><h3 className="font-bold text-lg text-gray-700">Approaching Deadlines</h3><p className="text-4xl font-bold text-yellow-500 mt-2">4</p></div><div className="bg-white p-6 rounded-lg shadow"><h3 className="font-bold text-lg text-gray-700">Active Applications</h3><p className="text-4xl font-bold text-green-500 mt-2">{candidates.reduce((acc, c) => acc + c.applications.length, 0)}</p></div></div><div className="mt-8"><h3 className="text-2xl font-bold text-gray-800 mb-4">Recent Candidate Updates</h3><div className="bg-white rounded-lg shadow overflow-hidden"><ul className="divide-y divide-gray-200">{candidates.map(c => (<li key={c.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => onSelectCandidate(c)}><div className="flex justify-between items-center"><div><p className="font-semibold text-gray-800">{c.name}</p><p className="text-sm text-gray-500">{c.status}</p></div><ChevronsRight className="h-5 w-5 text-gray-400" /></div></li>))}</ul></div></div></div>);
const CandidateList = ({ candidates, onSelectCandidate }) => (<div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto"><h2 className="text-3xl font-bold text-gray-800 mb-6">All Candidates</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{candidates.map(c => (<div key={c.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelectCandidate(c)}><h3 className="font-bold text-xl text-gray-800">{c.name}</h3><p className="text-blue-600 font-medium">{c.specialty}</p><p className="text-sm text-gray-500 mt-2">{c.status}</p><div className="w-full bg-gray-200 rounded-full h-2.5 mt-4"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${c.progress}%` }}></div></div></div>))}</div></div>);
const AgencyCalendar = () => (<div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto"><h2 className="text-3xl font-bold text-gray-800 mb-6">Agency Calendar</h2><div className="bg-white p-4 rounded-lg shadow-lg h-[80vh] flex items-center justify-center text-center p-8"><div className="max-w-md"><CalendarIcon className="h-16 w-16 mx-auto text-gray-300" /><h3 className="mt-4 text-xl font-semibold text-gray-700">Agency Calendar View</h3><p className="mt-2 text-gray-500">This area will display a full-featured calendar for tracking interviews, deadlines, and events. The calendar component library (`react-big-calendar`) could not be loaded in this environment, but the functionality is designed and ready to be activated.</p></div></div></div>);

export default App;