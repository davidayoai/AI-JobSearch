import React, { useState } from 'react';
import type { Job } from '../types';
import { parseJobPosting } from '../services/geminiService';
import { CloseIcon, SparklesIcon } from './icons';
import JobCard from './JobCard';
import Spinner from './Spinner';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobSaved: (job: Job) => void;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ isOpen, onClose, onJobSaved }) => {
  const [jobText, setJobText] = useState('');
  const [parsedJob, setParsedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    // Reset state on close
    setJobText('');
    setParsedJob(null);
    setIsLoading(false);
    setError(null);
    onClose();
  };

  const handleParse = async () => {
    if (!jobText.trim()) {
      setError("Please paste a job description first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setParsedJob(null);
    try {
      const result = await parseJobPosting(jobText);
      setParsedJob(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (parsedJob) {
      onJobSaved(parsedJob);
      handleClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={handleClose}>
      <div className="bg-base-200 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="p-4 sm:p-6 border-b border-base-300 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Parse Job Posting with AI</h2>
            <p className="text-sm text-base-content">Paste a job description to extract and save it.</p>
          </div>
          <button onClick={handleClose} className="text-base-content hover:text-white transition-colors p-2 rounded-full hover:bg-base-300">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <textarea
            className="w-full h-48 bg-base-300 border border-base-300 rounded-md shadow-sm p-3 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
            placeholder="Paste the full job description here..."
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            disabled={isLoading}
          />
          
          {error && <p className="text-sm text-red-400">{error}</p>}
          
          {isLoading && <Spinner />}

          {parsedJob && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">AI Parsing Result</h3>
              <div className="pointer-events-none">
                 <JobCard 
                    job={parsedJob}
                    onSelect={() => {}}
                    isSaved={false} // It's not saved yet, so this is always false here
                    onSave={() => {}}
                    onUnsave={() => {}}
                 />
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-base-300 flex justify-end items-center gap-4 flex-shrink-0 bg-base-200">
          <button 
            onClick={handleClose} 
            className="px-4 py-2 rounded-md text-sm font-medium text-base-content hover:bg-base-300 transition-colors"
          >
            Cancel
          </button>
          
          {parsedJob ? (
             <button
                onClick={handleSave}
                className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out"
            >
                Save Job
             </button>
          ) : (
            <button
                onClick={handleParse}
                disabled={isLoading || !jobText.trim()}
                className="flex items-center justify-center bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-secondary transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <SparklesIcon className="w-5 h-5 mr-2" />
                {isLoading ? 'Parsing...' : 'Parse with AI'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default AddJobModal;
