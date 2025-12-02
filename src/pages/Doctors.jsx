
import React, { useState, useEffect } from "react";
import { Doctor } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Search, Users, Upload, CheckCircle, AlertCircle, Activity, BellRing, UserX, FileClock, RotateCcw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DoctorCard from "../components/doctors/DoctorCard";
import DoctorCsvUploader from "../components/doctors/DoctorCsvUploader";
import { Application } from "@/api/entities";
import { Job } from "@/api/entities";
import { subDays, formatDistanceToNow } from "date-fns";
import ApplicationStatusDialog from "../components/applications/ApplicationStatusDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAnimalAvatar } from "../components/utils/AvatarGenerator";
import { Badge } from "@/components/ui/badge";
import { loadSeedDoctors } from "@/data/seedDoctors";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [alert, setAlert] = useState(null);

  // State for the new Action Center
  const [actionableData, setActionableData] = useState({
    activeCandidates: [],
    staleApplications: [],
    unmatchedDoctors: [],
  });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  // Load seed doctors on first load
  useEffect(() => {
    loadSeedDoctors();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [doctorsData, applicationsData, jobsData] = await Promise.all([
        Doctor.list("-updated_date", 200),
        Application.list("-updated_date", 500).catch(() => []),
        Job.filter({ isActive: true }).catch(() => [])
      ]);
      
      setDoctors(doctorsData);

      // --- Process data for Action Center ---
      const activeStatuses = ['APPLIED', 'INTERVIEWING', 'OFFERED'];
      const sevenDaysAgo = subDays(new Date(), 7);

      // 1. Find Stale Applications
      const staleApplications = applicationsData
        .filter(app => activeStatuses.includes(app.status) && new Date(app.updated_date) < sevenDaysAgo)
        .map(app => ({
          ...app,
          doctor: doctorsData.find(d => d.id === app.doctorId),
          job: jobsData.find(j => j.id === app.jobId)
        }))
        .filter(app => app.doctor && app.job); // Ensure doctor and job are found

      // 2. Find Active Candidates
      const activeApplications = applicationsData.filter(app => activeStatuses.includes(app.status));
      const activeDoctorIds = [...new Set(activeApplications.map(app => app.doctorId))];
      const activeCandidates = activeDoctorIds.map(doctorId => {
        const doctor = doctorsData.find(d => d.id === doctorId);
        const apps = activeApplications
          .filter(app => app.doctorId === doctorId)
          .map(app => ({...app, job: jobsData.find(j => j.id === app.jobId)}))
          .filter(app => app.job); // Ensure job is found for each application
        return { doctor, applications: apps };
      }).filter(c => c.doctor && c.applications.length > 0); // Ensure doctor is found and has valid applications

      // 3. Find Unmatched Doctors
      const doctorsWithAnyApplication = new Set(applicationsData.map(app => app.doctorId));
      const unmatchedDoctors = doctorsData.filter(d => !doctorsWithAnyApplication.has(d.id));

      setActionableData({ activeCandidates, staleApplications, unmatchedDoctors });

    } catch (error) {
      console.error("Error loading doctors data:", error);
      setAlert({ type: 'error', message: 'Failed to load data for Action Center.' });
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  const handleStatusUpdate = () => {
    setIsStatusDialogOpen(false);
    setSelectedApplication(null);
    loadData(); // Reload all data after status update
    setAlert({ type: 'success', message: 'Application status updated successfully.' });
  };

  // Delete single doctor
  const handleDeleteDoctor = async (doctorId) => {
    try {
      await Doctor.delete(doctorId);
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
      setAlert({ type: 'success', message: 'Doctor deleted successfully.' });
      loadData(); // Refresh action center data too
    } catch (error) {
      console.error("Error deleting doctor:", error);
      setAlert({ type: 'error', message: 'Failed to delete doctor.' });
    }
  };

  // Delete all doctors
  const handleDeleteAllDoctors = async () => {
    try {
      // Delete all doctors one by one
      for (const doctor of doctors) {
        await Doctor.delete(doctor.id);
      }
      setDoctors([]);
      setAlert({ type: 'success', message: `All ${doctors.length} doctors deleted successfully.` });
      loadData();
    } catch (error) {
      console.error("Error deleting all doctors:", error);
      setAlert({ type: 'error', message: 'Failed to delete all doctors.' });
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const firstName = doctor.firstName || doctor.first_name || '';
    const lastName = doctor.lastName || doctor.last_name || '';
    const email = doctor.email || '';
    const specialties = doctor.specialties || [];
    
    return !searchTerm || 
      `${firstName} ${lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Doctor Profiles</h1>
            <p className="text-slate-600">Manage your medical professional database</p>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  disabled={doctors.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All ({doctors.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Doctors?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {doctors.length} doctors from the database. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAllDoctors}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button 
              onClick={async () => {
                setIsLoading(true);
                localStorage.removeItem('med_match_doctor');
                await loadSeedDoctors(true);
                await loadData();
                setAlert({ type: "success", message: "Reloaded 26 doctors from seed data!" });
              }}
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reload Seed Data
            </Button>
            <Link to={createPageUrl("DoctorForm")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Doctor Manually
              </Button>
            </Link>
          </div>
        </div>

        {alert && (
          <Alert className={`mb-6 ${alert.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
            {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertTitle>{alert.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              All Doctors ({doctors.length})
            </TabsTrigger>
            <TabsTrigger value="action-center" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Action Center
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              CSV Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {/* Search and Stats */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search doctors by name, specialty, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-200 h-12"
                />
              </div>
              <Card className="lg:w-48">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Total Doctors</div>
                    <div className="text-xl font-bold text-slate-900">{doctors.length}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Doctor Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <Card className="h-80 bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {searchTerm ? 'No doctors found' : 'No doctors yet'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Get started by adding a doctor or uploading a CSV'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setActiveTab('upload')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload a CSV
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDoctors.map((doctor) => (
                  <DoctorCard 
                    key={doctor.id} 
                    doctor={doctor} 
                    showDelete={true}
                    onDelete={handleDeleteDoctor}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="action-center">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <Card className="h-[250px] bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* STALE APPLICATIONS */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <BellRing className="w-5 h-5" />
                      Follow-Up Needed
                    </CardTitle>
                    <p className="text-sm text-slate-500">Applications not updated in over 7 days.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {actionableData.staleApplications.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">All applications are up-to-date!</p>
                    ) : (
                      <>
                        {actionableData.staleApplications.slice(0, 5).map(app => (
                          <div key={app.id} className="p-3 bg-orange-50/50 border border-orange-100 rounded-lg">
                            <div className="font-semibold">{app.doctor.firstName} {app.doctor.lastName}</div>
                            <div className="text-sm text-slate-600">{app.job.title}</div>
                            <div className="text-xs text-orange-700 mt-1">
                              Last update: {formatDistanceToNow(new Date(app.updated_date), { addSuffix: true })}
                            </div>
                          </div>
                        ))}
                        {actionableData.staleApplications.length > 5 && (
                          <p className="text-xs text-slate-500 text-center">... and {actionableData.staleApplications.length - 5} more</p>
                        )}
                        <Link to={createPageUrl("FollowUpNeeded")} className="block">
                          <Button size="sm" variant="outline" className="w-full mt-2">
                            View All ({actionableData.staleApplications.length})
                          </Button>
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                {/* ACTIVE CANDIDATES */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <FileClock className="w-5 h-5" />
                      Active Candidates
                    </CardTitle>
                    <p className="text-sm text-slate-500">Doctors with ongoing applications.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {actionableData.activeCandidates.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No active candidates.</p>
                    ) : (
                      <>
                        {actionableData.activeCandidates.slice(0, 5).map(({ doctor, applications }) => (
                          <div key={doctor.id} className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <Link to={createPageUrl(`DoctorDetail?id=${doctor.id}`)} className="font-semibold hover:underline">
                              {doctor.firstName} {doctor.lastName}
                            </Link>
                            <div className="text-xs text-slate-600 mt-1">
                              {applications.length} active application{applications.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                        {actionableData.activeCandidates.length > 5 && (
                          <p className="text-xs text-slate-500 text-center">... and {actionableData.activeCandidates.length - 5} more</p>
                        )}
                        <Link to={createPageUrl("ActiveCandidates")} className="block">
                          <Button size="sm" variant="outline" className="w-full mt-2">
                            View All ({actionableData.activeCandidates.length})
                          </Button>
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* UNMATCHED DOCTORS */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <UserX className="w-5 h-5" />
                      Find a Position
                    </CardTitle>
                    <p className="text-sm text-slate-500">Doctors without any active applications.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {actionableData.unmatchedDoctors.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">All doctors have active applications.</p>
                    ) : (
                      <>
                        {actionableData.unmatchedDoctors.slice(0, 5).map(doctor => {
                          const firstName = doctor.firstName || doctor.first_name || '';
                          const lastName = doctor.lastName || doctor.last_name || '';
                          const specialties = doctor.specialties || [];
                          return (
                            <div key={doctor.id} className="p-3 bg-green-50/50 border border-green-100 rounded-lg flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-sm">{firstName} {lastName}</div>
                                <div className="text-xs text-slate-600">{specialties.slice(0, 2).join(', ')}</div>
                              </div>
                              <Link to={createPageUrl(`DoctorDetail?id=${doctor.id}`)}>
                                  <Button size="sm" variant="outline" className="text-xs px-2">View</Button>
                              </Link>
                            </div>
                          );
                        })}
                        {actionableData.unmatchedDoctors.length > 5 && (
                          <p className="text-xs text-slate-500 text-center">... and {actionableData.unmatchedDoctors.length - 5} more</p>
                        )}
                        <Link to={createPageUrl("UnmatchedDoctors")} className="block">
                          <Button size="sm" variant="outline" className="w-full mt-2">
                            View All ({actionableData.unmatchedDoctors.length})
                          </Button>
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload">
            <DoctorCsvUploader 
              onSuccess={() => {
                loadData(); // Changed from loadDoctors to loadData
                setAlert({ type: 'success', message: 'CSV processed successfully! Doctors have been added.' });
                setActiveTab('list');
              }} 
              setAlert={setAlert} 
            />
          </TabsContent>
        </Tabs>
        
        {selectedApplication && (
          <ApplicationStatusDialog
            application={selectedApplication}
            doctor={selectedApplication.doctor} // Pass the doctor object associated with the application
            open={isStatusDialogOpen}
            onOpenChange={setIsStatusDialogOpen}
            onSuccess={handleStatusUpdate}
          />
        )}
      </div>
    </div>
  );
}
