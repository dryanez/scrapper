import React, { useState, useEffect, useMemo } from 'react';
import { Job, Hospital } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckSquare, 
  Square,
  Building2,
  MapPin,
  ExternalLink,
  Database,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

export default function JobDatabase() {
  const [jobs, setJobs] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // Load jobs and hospitals
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, hospitalsData] = await Promise.all([
        Job.list(),
        Hospital.list()
      ]);
      setJobs(jobsData || []);
      setHospitals(hospitalsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  // Get unique values for filters
  const uniqueHospitals = useMemo(() => {
    const hospitalMap = new Map();
    jobs.forEach(job => {
      if (job.hospital_id || job.hospitalId) {
        const hospital = hospitals.find(h => h.id === (job.hospital_id || job.hospitalId));
        if (hospital) {
          hospitalMap.set(hospital.id, hospital);
        }
      }
      if (job.hospitalName) {
        hospitalMap.set(job.hospitalName, { id: job.hospitalName, name: job.hospitalName });
      }
    });
    return Array.from(hospitalMap.values());
  }, [jobs, hospitals]);

  const uniqueStates = useMemo(() => {
    const states = new Set();
    jobs.forEach(job => {
      const hospital = hospitals.find(h => h.id === (job.hospital_id || job.hospitalId));
      if (hospital?.state) {
        states.add(hospital.state);
      }
    });
    return Array.from(states).sort();
  }, [jobs, hospitals]);

  const uniqueSpecialties = useMemo(() => {
    const specialties = new Set();
    jobs.forEach(job => {
      if (job.specialty) {
        specialties.add(job.specialty);
      }
    });
    return Array.from(specialties).sort();
  }, [jobs]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesTitle = job.title?.toLowerCase().includes(search);
        const matchesHospital = job.hospitalName?.toLowerCase().includes(search);
        const matchesDescription = job.description?.toLowerCase().includes(search);
        if (!matchesTitle && !matchesHospital && !matchesDescription) {
          return false;
        }
      }

      // Hospital filter
      if (selectedHospital !== 'all') {
        const jobHospitalId = job.hospital_id || job.hospitalId;
        if (jobHospitalId !== selectedHospital && job.hospitalName !== selectedHospital) {
          return false;
        }
      }

      // State filter
      if (selectedState !== 'all') {
        const hospital = hospitals.find(h => h.id === (job.hospital_id || job.hospitalId));
        if (!hospital || hospital.state !== selectedState) {
          return false;
        }
      }

      // Specialty filter
      if (selectedSpecialty !== 'all') {
        if (job.specialty !== selectedSpecialty) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, searchTerm, selectedHospital, selectedState, selectedSpecialty, hospitals]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(filteredJobs.map(j => j.id)));
    }
  };

  const toggleSelectJob = (jobId) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  // Delete handlers
  const handleDeleteSelected = async () => {
    setDeleting(true);
    try {
      const idsToDelete = Array.from(selectedJobs);
      
      // Delete in batches
      for (const id of idsToDelete) {
        await Job.delete(id);
      }
      
      // Refresh data
      await loadData();
      setSelectedJobs(new Set());
    } catch (error) {
      console.error('Error deleting jobs:', error);
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      // Delete all filtered jobs
      for (const job of filteredJobs) {
        await Job.delete(job.id);
      }
      
      // Refresh data
      await loadData();
      setSelectedJobs(new Set());
    } catch (error) {
      console.error('Error deleting jobs:', error);
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
  };

  // Get hospital name for a job
  const getHospitalName = (job) => {
    if (job.hospitalName) return job.hospitalName;
    const hospital = hospitals.find(h => h.id === (job.hospital_id || job.hospitalId));
    return hospital?.name || 'Unknown';
  };

  // Get hospital state for a job
  const getHospitalState = (job) => {
    const hospital = hospitals.find(h => h.id === (job.hospital_id || job.hospitalId));
    return hospital?.state || '';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedHospital('all');
    setSelectedState('all');
    setSelectedSpecialty('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8" />
            Job Database
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and delete jobs from your database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {jobs.length} Total Jobs
          </Badge>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, hospital, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Hospital Filter */}
            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger>
                <SelectValue placeholder="All Hospitals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hospitals</SelectItem>
                {uniqueHospitals.map(hospital => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* State Filter */}
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger>
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {uniqueStates.map(state => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Specialty Filter */}
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {uniqueSpecialties.map(specialty => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selection Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedJobs.size === filteredJobs.length && filteredJobs.length > 0 ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedJobs.size === filteredJobs.length && filteredJobs.length > 0 
                  ? 'Deselect All' 
                  : 'Select All'}
              </Button>
              
              <span className="text-sm text-muted-foreground">
                {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedJobs.size === 0}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedJobs.size})
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                disabled={filteredJobs.length === 0}
                onClick={() => {
                  setSelectedJobs(new Set(filteredJobs.map(j => j.id)));
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Filtered ({filteredJobs.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {jobs.length === 0 
                        ? 'No jobs in database. Use the Job Scanner to scrape jobs from hospital career pages.'
                        : 'No jobs match your filters. Try adjusting the filter criteria.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow 
                      key={job.id}
                      className={selectedJobs.has(job.id) ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedJobs.has(job.id)}
                          onCheckedChange={() => toggleSelectJob(job.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{job.title}</div>
                        {job.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {job.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{getHospitalName(job)}</span>
                        </div>
                        {getHospitalState(job) && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {getHospitalState(job)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{job.specialty || 'General'}</Badge>
                      </TableCell>
                      <TableCell>
                        {job.location && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {job.location}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {job.created_date 
                          ? format(new Date(job.created_date), 'dd.MM.yyyy')
                          : job.scraped_at 
                            ? format(new Date(job.scraped_at), 'dd.MM.yyyy')
                            : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(job.link || job.jobDetailsUrl) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a 
                                href={job.link || job.jobDetailsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={async () => {
                              await Job.delete(job.id);
                              await loadData();
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectedJobs.size} Job{selectedJobs.size !== 1 ? 's' : ''}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
