
import React, { useState, useEffect, useCallback } from "react";
import { EmailConfig } from "@/api/entities";
import { EmailTemplate } from "@/api/entities"; // New import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // New import
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import ReactQuill from 'react-quill'; // New import
import 'react-quill/dist/quill.snow.css'; // New import
import { Mail, Settings, CheckCircle, AlertTriangle, KeyRound, FileText, Info } from "lucide-react"; // New icons
import { useToast } from "@/components/ui/use-toast";

export default function EmailSettings() {
  const [config, setConfig] = useState(null);
  const [template, setTemplate] = useState(null); // New state
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState(""); // New state
  const [bodyTemplate, setBodyTemplate] = useState(""); // New state
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("config"); // New state
  const { toast } = useToast();

  const defaultTemplate = `Dear Hiring Manager,
<br><br>
I am writing to recommend an excellent candidate, {DOCTOR_NAME}, for the {JOB_TITLE} position at {HOSPITAL_NAME}.
<br><br>
<b>CANDIDATE OVERVIEW</b><br>
- Name: {DOCTOR_NAME}<br>
- Email: {DOCTOR_EMAIL}<br>
- Experience: {DOCTOR_EXPERIENCE}<br>
- Specialties: {DOCTOR_SPECIALTIES}<br>
- Authorization: {DOCTOR_WORK_PERMIT}<br>
<br>
{CV_LINK}
<br><br>
This candidate is a strong match based on specialty alignment and their interest in this region. 
<br><br>
Please feel free to contact me or reach out to the candidate directly to schedule an interview.
<br><br>
Best regards,<br>
{USER_NAME}<br>
{USER_EMAIL}<br>
(Sent via MedMatch Platform)`;

  // Renamed from loadConfig and updated to load both configs and templates
  const loadData = useCallback(async () => {
    try {
      const [configs, templates] = await Promise.all([
        EmailConfig.list(),
        EmailTemplate.list()
      ]);
      
      if (configs.length > 0) {
        setConfig(configs[0]);
        setApiKey(configs[0].resendApiKey || "");
        setFromEmail(configs[0].fromEmail || "");
        setFromName(configs[0].fromName || "MedMatch Recruiting");
      } else {
        setFromName("MedMatch Recruiting");
      }

      if (templates.length > 0) {
        setTemplate(templates[0]);
        setSubjectTemplate(templates[0].subjectTemplate);
        setBodyTemplate(templates[0].bodyTemplate);
      } else {
        setSubjectTemplate("Application for {JOB_TITLE} - {DOCTOR_NAME}");
        setBodyTemplate(defaultTemplate);
      }
    } catch (error) {
      toast({
        title: "Error Loading Settings",
        description: "Could not load email settings or templates.",
        variant: "destructive",
      });
    }
  }, [toast, defaultTemplate]); // Added defaultTemplate to dependency array

  useEffect(() => {
    loadData();
  }, [loadData]); // Now depends on loadData

  // Existing handleSave function, renamed to handleSaveConfig
  const handleSaveConfig = async () => {
    if (!apiKey || !fromEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide both an API Key and a 'From' email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const data = { 
        resendApiKey: apiKey, 
        fromEmail: fromEmail, 
        fromName: fromName,
        isConfigured: true 
      };

      if (config) {
        await EmailConfig.update(config.id, data);
      } else {
        await EmailConfig.create(data);
      }
      
      toast({
        title: "Settings Saved",
        description: "Your Resend email settings have been updated successfully.",
      });
      loadData(); // Call loadData to refresh both config and template state
    } catch (error) {
      toast({
        title: "Error Saving",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // New function for saving email templates
  const handleSaveTemplate = async () => {
    if (!subjectTemplate || !bodyTemplate) {
      toast({
        title: "Missing Information",
        description: "Please provide both subject and body templates.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const templateData = {
        subjectTemplate: subjectTemplate,
        bodyTemplate: bodyTemplate,
        isDefault: true // Assuming a single default template for now
      };

      if (template) {
        await EmailTemplate.update(template.id, templateData);
      } else {
        await EmailTemplate.create(templateData);
      }
      
      toast({
        title: "Template Saved",
        description: "Your email template has been updated successfully.",
      });
      loadData(); // Call loadData to refresh both config and template state
    } catch (error) {
      toast({
        title: "Error Saving",
        description: `Failed to save template: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to insert placeholders into the Quill editor
  const insertPlaceholder = (placeholder) => {
    setBodyTemplate(prev => {
      // Logic to insert at cursor position can be more complex with Quill,
      // but for simplicity, we'll append for now.
      // A more advanced solution would involve Quill's API (getEditor(), insertText()).
      if (prev.endsWith('<p><br></p>') || prev.endsWith('<br>')) {
        return prev.slice(0, -('<br>'.length)) + ` {${placeholder}}<br>`;
      }
      return prev + ` {${placeholder}}<br>`;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Email Settings</h1>
            <p className="text-slate-600">Configure Resend integration and customize email templates.</p>
          </div>
          {config?.isConfigured && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Configured
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              API Configuration
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Email Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  Resend Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Action Required</AlertTitle>
                  <AlertDescription>
                    The 'From' email address must be from a domain you have verified in your Resend account.
                  </AlertDescription>
                </Alert>
              
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Resend API Key *</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email Address *</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="you@verified-domain.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">Sender Name</Label>
                    <Input
                      id="fromName"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveConfig} // Updated to handleSaveConfig
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="template">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-purple-600" />
                    Available Placeholders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Use these placeholders in your template. They will be automatically replaced with actual values:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'DOCTOR_NAME', 'DOCTOR_EMAIL', 'DOCTOR_EXPERIENCE', 
                      'DOCTOR_SPECIALTIES', 'DOCTOR_WORK_PERMIT',
                      'JOB_TITLE', 'HOSPITAL_NAME', 'CV_LINK',
                      'USER_NAME', 'USER_EMAIL'
                    ].map(placeholder => (
                      <Button
                        key={placeholder}
                        variant="outline"
                        size="sm"
                        className="text-xs justify-start"
                        onClick={() => insertPlaceholder(placeholder)}
                      >
                        {`{${placeholder}}`}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Email Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="subjectTemplate">Subject Line Template *</Label>
                    <Input
                      id="subjectTemplate"
                      value={subjectTemplate}
                      onChange={(e) => setSubjectTemplate(e.target.value)}
                      placeholder="Application for {JOB_TITLE} - {DOCTOR_NAME}"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bodyTemplate">Email Body Template *</Label>
                    <div className="bg-white">
                      <ReactQuill 
                        theme="snow" 
                        value={bodyTemplate} 
                        onChange={setBodyTemplate}
                        style={{ height: '400px', marginBottom: '50px' }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveTemplate} // New save function
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSaving ? "Saving..." : "Save Template"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
