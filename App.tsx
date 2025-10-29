
import React, { useState, useEffect, useCallback } from 'react';
import type { Job, SearchFilters } from './types';
import { findJobs } from './services/geminiService';
import SearchBar from './components/SearchBar';
import JobCard from './components/JobCard';
import JobDetailModal from './components/JobDetailModal';
import { SearchIcon, BookmarkIcon, PlusCircleIcon } from './components/icons';
import AddJobModal from './components/AddJobModal';
import LiveSearchStatus from './components/LiveSearchStatus';
import Pagination from './components/Pagination';

// FIX: Moved NavButton outside of the App component to prevent re-creation on every render. This is a React best practice and can resolve subtle bugs with type inference and component state.
// FIX: Explicitly defined NavButton props with an interface and used React.FC to resolve a 'children' prop type error.
interface NavButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
const NavButton: React.FC<NavButtonProps> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 focus:ring-offset-base-200/50 flex items-center gap-2 ${
        isActive ? 'bg-brand-primary text-white' : 'text-base-content hover:bg-base-300'
    }`}
  >
    {children}
  </button>
);

const JOBS_PER_PAGE = 9;

const App: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>(() => {
    try {
      const saved = window.localStorage.getItem('savedJobs');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error reading saved jobs from localStorage", error);
      return [];
    }
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    query: 'AI Engineer',
    location: 'Remote',
    type: 'Full-time',
    salary: '',
    workLocation: '',
    industry: '',
  });
  const [activeView, setActiveView] = useState<'search' | 'saved'>('search');
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState<{ completed: string[], current: string | null }>({ completed: [], current: null });
  const [currentPage, setCurrentPage] = useState(1);

  const JOB_SOURCES = ['LinkedIn', 'Indeed', 'Glassdoor', 'Wellfound', 'Google Careers'];

  useEffect(() => {
    try {
      window.localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
    } catch (error) {
      console.error("Error saving jobs to localStorage", error);
    }
  }, [savedJobs]);

  const fetchJobs = useCallback(async (currentFilters: SearchFilters) => {
    setIsLoading(true);
    setError(null);
    setJobs([]);
    setScrapingStatus({ completed: [], current: JOB_SOURCES[0] });

    try {
      const allFetchedJobs = await findJobs(currentFilters);
      
      if (allFetchedJobs.length === 0) {
        setScrapingStatus({ completed: JOB_SOURCES, current: null });
        setIsLoading(false);
        return;
      }

      // Simulate scraping from different sources
      let jobsAdded = 0;
      const jobsPerSource = Math.ceil(allFetchedJobs.length / JOB_SOURCES.length);

      for (let i = 0; i < JOB_SOURCES.length; i++) {
        const source = JOB_SOURCES[i];
        setScrapingStatus(prev => ({ ...prev, current: source }));

        await new Promise(resolve => setTimeout(resolve, 600));

        const jobsToAdd = allFetchedJobs.slice(jobsAdded, jobsAdded + jobsPerSource);
        setJobs(prev => [...prev, ...jobsToAdd]);
        jobsAdded += jobsPerSource;

        setScrapingStatus(prev => ({
          completed: [...prev.completed, source],
          current: JOB_SOURCES[i + 1] || null,
        }));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSaveJob = (jobToSave: Job) => {
    setSavedJobs(prev => {
        if (prev.find(job => job.id === jobToSave.id)) {
            return prev; // Already saved
        }
        return [...prev, jobToSave];
    });
  };

  const handleUnsaveJob = (jobId: string) => {
    setSavedJobs(prev => prev.filter(job => job.id !== jobId));
  };
  
  const isJobSaved = (jobId: string) => {
    return savedJobs.some(job => job.id === jobId);
  };

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setActiveView('search');
    setCurrentPage(1);
    fetchJobs(newFilters);
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
  };
  
  const handleJobParsedAndSaved = (job: Job) => {
    handleSaveJob(job);
    setActiveView('saved'); // Switch to saved view to show the new job
  };

  const handleViewChange = (view: 'search' | 'saved') => {
    setActiveView(view);
    setCurrentPage(1);
  }
  
  // Pagination logic
  const jobsToDisplay = activeView === 'search' ? jobs : savedJobs;
  const totalPages = Math.ceil(jobsToDisplay.length / JOBS_PER_PAGE);
  const indexOfLastJob = currentPage * JOBS_PER_PAGE;
  const indexOfFirstJob = indexOfLastJob - JOBS_PER_PAGE;
  const currentJobsOnPage = jobsToDisplay.slice(indexOfFirstJob, indexOfLastJob);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-base-100">
      <header className="bg-base-200/50 backdrop-blur-lg py-4 shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
             <div className="flex-1">
                 <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                    AI Job Finder
                </h1>
                <p className="text-xs md:text-sm text-base-content hidden sm:block">Your intelligent career copilot</p>
             </div>
             <nav className="flex items-center space-x-2">
                <NavButton isActive={activeView === 'search'} onClick={() => handleViewChange('search')}>
                    <SearchIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Search Jobs</span>
                </NavButton>
                <NavButton isActive={activeView === 'saved'} onClick={() => handleViewChange('saved')}>
                    <BookmarkIcon className="w-4 h-4" filled={activeView === 'saved'}/>
                    <span className="hidden md:inline">Saved Jobs</span>
                    {savedJobs.length > 0 && <span className="bg-brand-secondary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{savedJobs.length}</span>}
                </NavButton>
                <button 
                  onClick={() => setIsAddJobModalOpen(true)}
                  className="p-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 focus:ring-offset-base-200/50 text-base-content hover:bg-base-300"
                  aria-label="Add job from description"
                >
                  <PlusCircleIcon className="w-6 h-6" />
                </button>
             </nav>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6">
        {activeView === 'search' && <SearchBar onSearch={handleSearch} initialFilters={filters} isLoading={isLoading}/>}
        
        <div className="mt-8">
            {activeView === 'search' && (
              <>
                {isLoading && <LiveSearchStatus status={scrapingStatus} sources={JOB_SOURCES} />}
                
                {error && <div className="text-center text-red-400 mt-10">{error}</div>}
                
                {!isLoading && !error && jobs.length === 0 && (
                   <div className="text-center text-base-content mt-10">
                    <h3 className="text-xl font-semibold">No jobs found</h3>
                    <p>Try adjusting your search filters.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentJobsOnPage.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onSelect={handleJobSelect}
                      isSaved={isJobSaved(job.id)}
                      onSave={handleSaveJob}
                      onUnsave={handleUnsaveJob}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}

            {activeView === 'saved' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-6">Your Saved Jobs</h2>
                {savedJobs.length === 0 ? (
                  <div className="text-center text-base-content mt-10">
                    <h3 className="text-xl font-semibold">No saved jobs</h3>
                    <p>Click the bookmark icon on a job to save it here.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentJobsOnPage.map(job => (
                        <JobCard 
                          key={job.id} 
                          job={job} 
                          onSelect={handleJobSelect}
                          isSaved={isJobSaved(job.id)}
                          onSave={handleSaveJob}
                          onUnsave={handleUnsaveJob}
                        />
                      ))}
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </>
                )}
              </>
            )}
        </div>
      </main>
      
      {selectedJob && <JobDetailModal 
        job={selectedJob} 
        onClose={handleCloseModal} 
        isSaved={isJobSaved(selectedJob.id)}
        onSave={handleSaveJob}
        onUnsave={handleUnsaveJob}
      />}

      <AddJobModal
        isOpen={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
        onJobSaved={handleJobParsedAndSaved}
      />
    </div>
  );
};

export default App;