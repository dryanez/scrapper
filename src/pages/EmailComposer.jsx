
import React, { useState, useEffect, useCallback } from "react";
import { Doctor } from "@/api/entities";
import { Job } from "@/api/entities";
import { Hospital } from "@/api/entities";
import { EmailLog } from "@/api/entities";
import { User } from "@/api/entities";
import { EmailConfig } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Building2, Send, CheckCircle, Loader2, AlertTriangle, Settings, ExternalLink, Download, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";

export default function EmailComposer() {
  const [doctor, setDoctor] = useState(null);
  const [job, setJob] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [hospitalContacts, setHospitalContacts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [emailConfig, setEmailConfig] = useState(null);
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Extract email addresses from hospital contact notes
  const extractEmailAddresses = (text) => {
    if (!text) return [];
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const matches = text.match(emailRegex) || [];
    
    return matches.map(email => {
      const index = text.indexOf(email);
      const contextStart = Math.max(0, index - 50);
      const context = text.substring(contextStart, index).trim();
      const lines = context.split('\n');
      const relevantContext = lines[lines.length - 1] || context;
      
      return {
        email,
        context: relevantContext.trim() || 'Contact'
      };
    });
  };

  const loadData = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const doctorId = urlParams.get('doctorId');
      const jobId = urlParams.get('jobId');
      
      const [userData, configs] = await Promise.all([
        User.me().catch(() => null),
        EmailConfig.list()
      ]);
      
      setCurrentUser(userData);

      if (configs.length > 0 && configs[0].isConfigured) {
        setEmailConfig(configs[0]);
      } else {
        setError("Email is not configured. Please go to Email Settings and enter your API key.");
      }

      if (doctorId) {
        const [doctorData] = await Doctor.filter({ id: doctorId });
        if (doctorData) setDoctor(doctorData);
      }

      if (jobId) {
        const [jobData] = await Job.filter({ id: jobId });
        if (jobData) {
          setJob(jobData);
          
          // Try to find hospital data
          if (jobData.hospitalId) {
            const [hospitalData] = await Hospital.filter({ id: jobData.hospitalId });
            if (hospitalData) setHospital(hospitalData);
          } else if (jobData.hospitalName) {
            const hospitalsByName = await Hospital.filter({ name: jobData.hospitalName });
            if (hospitalsByName.length > 0) {
              setHospital(hospitalsByName[0]);
            }
          }
        }
      }
    } catch (err) {
      setError(`Failed to load necessary data: ${err.message}`);
    }
  }, []);

  // Auto-populate email when data is loaded
  useEffect(() => {
    if (doctor && job && currentUser) {
      // SET THE SUBJECT LINE
      const autoSubject = `Application for ${job.title} - ${doctor.firstName} ${doctor.lastName}`;
      setSubject(autoSubject);
      
      // SET THE EMAIL BODY
      const cvLink = doctor.cvFileUrl ? `You can view their full CV here: <a href="${doctor.cvFileUrl}">Click to View CV</a>` : 'CV available upon request.';
      
      const autoBody = `Dear Hiring Manager,
<br><br>
I am writing to recommend an excellent candidate, ${doctor.firstName} ${doctor.lastName}, for the ${job.title} position at ${job.hospitalName}.
<br><br>
<b>CANDIDATE OVERVIEW</b><br>
- Name: ${doctor.firstName} ${doctor.lastName}<br>
- Email: ${doctor.email}<br>
- Experience: ${doctor.experienceYears ? `${doctor.experienceYears} years` : 'Experienced'}<br>
- Specialties: ${doctor.specialties?.join(', ') || 'N/A'}<br>
- Authorization: ${doctor.workPermitStatus?.replace('_', ' ') || 'N/A'}<br>
<br>
${cvLink}
<br><br>
This candidate is a strong match based on specialty alignment and their interest in this region. 
<br><br>
Please feel free to contact me or reach out to the candidate directly to schedule an interview.
<br><br>
Best regards,<br>
${currentUser?.full_name || 'Medical Recruiter'}<br>
${currentUser?.email || ''}<br>
(Sent via MedMatch Platform)
`;
      setBody(autoBody);

      // The auto-population for the 'To' email field has been removed as requested.
    }
  }, [doctor, job, hospital, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (hospital && hospital.notes) {
      const contacts = extractEmailAddresses(hospital.notes);
      setHospitalContacts(contacts);
    }
  }, [hospital]);

  const handleContactClick = (email) => {
    setToEmail(email);
    toast({
      title: "Email Added",
      description: `${email} has been added to the recipient field.`,
    });
  };

  const exportAsEml = () => {
    if (!toEmail || !subject || !body) {
      toast({
        title: "Incomplete Email",
        description: "Please fill in all email fields before exporting.",
        variant: "destructive",
      });
      return;
    }

    const emlContent = `To: ${toEmail}
Subject: ${subject}
Content-Type: text/html; charset=UTF-8
MIME-Version: 1.0

${body}`;

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doctor?.firstName || 'candidate'}_${job?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'job'}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Email Exported",
      description: "Email file has been downloaded successfully.",
    });
  };

  const handleSendEmail = async () => {
    if (!emailConfig) {
      setError("Email sending is not configured. Please add your API key in Email Settings.");
      return;
    }
    if (!toEmail) {
      setError("Recipient email is missing.");
      return;
    }
    
    setIsSending(true);
    setError(null);
    let logId = null;

    try {
      const logEntry = await EmailLog.create({
        jobId: job.id,
        doctorId: doctor.id,
        toEmail: toEmail,
        subject: subject,
        bodyHtml: body,
        sentByUserId: currentUser.id,
        status: 'QUEUED',
      });
      logId = logEntry.id;
      
      const result = await SendEmail({
        api_key: emailConfig.resendApiKey,
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: [toEmail],
        subject: subject,
        html: body,
      });
      
      await EmailLog.update(logId, { 
        status: 'SENT', 
        sentAt: new Date().toISOString(),
        providerMessageId: result?.id || 'sent-via-resend'
      });
      
      setEmailSent(true);

    } catch (e) {
      console.error("Error sending email:", e);
      setError(`Failed to send email: ${e.message}`);
      if (logId) {
        await EmailLog.update(logId, { status: 'FAILED', errorMessage: e.message });
      }
    } finally {
      setIsSending(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <Card className="max-w-xl w-full">
          <CardHeader className="items-center text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <CardTitle className="text-2xl pt-4">Email Sent Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Link to={createPageUrl("Dashboard")}>
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const buttonDisabled = isSending || !toEmail || !subject || !body || !emailConfig;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl(`JobDetails?id=${job?.id || ''}`)} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Details
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Compose Referral Email
                  </CardTitle>
                  <Button onClick={exportAsEml} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export .eml
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doctor && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={doctor.profilePictureUrl} />
                          <AvatarFallback>{doctor.firstName?.[0]}{doctor.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold">{doctor.firstName} {doctor.lastName}</h3>
                          <p className="text-sm text-slate-500">{doctor.specialties?.join(', ')}</p>
                        </div>
                      </div>
                      <Link to={createPageUrl(`DoctorDetail?id=${doctor.id}`)}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Doctor Profile
                        </Button>
                      </Link>
                    </div>
                  )}
                  
                  {job && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Building2 className="h-12 w-12 text-slate-500" />
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="text-sm text-slate-500">{job.hospitalName}</p>
                        </div>
                      </div>
                      {job.jobDetailsUrl ? (
                        <a
                          href={job.jobDetailsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Original Job
                          </Button>
                        </a>
                      ) : (
                        <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Job Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="to">To Hospital *</Label>
                    <Input 
                      id="to" 
                      type="email" 
                      value={toEmail} 
                      onChange={(e) => setToEmail(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input 
                      id="subject" 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="body">Message</Label>
                    <div className="bg-white">
                      <ReactQuill 
                        theme="snow" 
                        value={body} 
                        onChange={(value) => setBody(value)}
                        style={{ height: '350px', marginBottom: '40px' }}
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">Sending Failed</h4>
                        <p className="text-sm">{error}</p>
                        {error.includes("not configured") && (
                           <Link to={createPageUrl("EmailSettings")}><Button variant="link" className="p-0 h-auto mt-2">Go to Settings</Button></Link>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSendEmail} disabled={buttonDisabled} className="bg-green-600 hover:bg-green-700">
                      {isSending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send Email</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hospital Contacts Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="w-4 h-4" />
                    Hospital Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hospitalContacts.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 mb-3">Click any email to auto-fill recipient:</p>
                      {hospitalContacts.map((contact, index) => (
                        <div 
                          key={index}
                          className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                          onClick={() => handleContactClick(contact.email)}
                        >
                          <div className="flex items-center gap-2">
                            <Copy className="w-3 h-3 text-slate-400" />
                            <div>
                              <div className="text-xs text-slate-600">{contact.context}</div>
                              <div className="text-sm font-mono text-blue-600">{contact.email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No contact information available for this hospital.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
