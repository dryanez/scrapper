import React, { useState, useEffect } from 'react';
import { Job } from '@/api/entities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function HospitalJobsDialog({ hospital, open, onOpenChange }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (hospital) {
      const fetchJobs = async () => {
        setIsLoading(true);
        try {
          // Search by both hospitalId and hospitalName for backward compatibility
          const jobsByName = await Job.filter({ hospitalName: hospital.name }, "-created_date", 100);
          let allJobs = jobsByName;
          
          if (hospital.id) {
            const jobsById = await Job.filter({ hospitalId: hospital.id }, "-created_date", 100);
            // Combine and deduplicate
            const existingIds = new Set(jobsByName.map(j => j.id));
            const uniqueJobsById = jobsById.filter(j => !existingIds.has(j.id));
            allJobs = [...jobsByName, ...uniqueJobsById];
          }
          
          setJobs(allJobs);
        } catch (error) {
          console.error("Error fetching hospital jobs:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchJobs();
    }
  }, [hospital]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Jobs at {hospital?.name}</DialogTitle>
          <DialogDescription>
            Found {jobs.length} open position{jobs.length === 1 ? '' : 's'}. Click a job to view details.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No jobs found for this hospital.
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 flex-1 pr-4">{job.title}</h3>
                        <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                            <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                    </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">{job.specialty}</Badge>
                    <Badge variant="outline">{job.seniority}</Badge>
                    {job.contractType && <Badge variant="outline">{job.contractType}</Badge>}
                  </div>
                  <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Posted: {(() => {
                          const dateValue = job.postedAt || job.posted_at || job.created_at || job.created_date || job.scraped_at;
                          if (dateValue) {
                            try {
                              const date = new Date(dateValue);
                              if (!isNaN(date.getTime())) {
                                return format(date, 'MMM d, yyyy');
                              }
                            } catch (e) {}
                          }
                          return 'Recently';
                        })()}
                      </span>
                    </div>
                    {(job.jobDetailsUrl || job.job_details_url) && (
                        <a href={job.jobDetailsUrl || job.job_details_url} target='_blank' rel="noreferrer noopener" className="flex items-center gap-1 text-blue-600 hover:underline">
                            Original <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}