
import React from 'react';
import type { Job } from '../types';
import { LocationIcon, BriefcaseIcon, BuildingIcon, BookmarkIcon } from './icons';

interface JobCardProps {
  job: Job;
  onSelect: (job: Job) => void;
  isSaved: boolean;
  onSave: (job: Job) => void;
  onUnsave: (jobId: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onSelect, isSaved, onSave, onUnsave }) => {
    
  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      onUnsave(job.id);
    } else {
      onSave(job);
    }
  };

  return (
    <div 
      onClick={() => onSelect(job)}
      className="bg-base-200 p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-transparent hover:border-brand-primary flex flex-col justify-between animate-fade-in"
    >
      <div>
        <div className="flex justify-between items-start">
            <div className="pr-4">
                <h3 className="text-xl font-bold text-white">{job.title}</h3>
                <div className="flex items-center text-sm text-base-content mt-1">
                    <BuildingIcon className="w-4 h-4 mr-2"/>
                    <p>{job.company}</p>
                </div>
            </div>
            <button 
                onClick={handleSaveToggle} 
                className={`p-2 rounded-full transition-colors ${isSaved ? 'text-brand-primary' : 'text-base-content'} hover:bg-base-300`}
                aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
                <BookmarkIcon className="w-5 h-5" filled={isSaved} />
            </button>
        </div>
        <p className="text-base-content mt-4 text-sm line-clamp-2">{job.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.slice(0, 4).map(skill => (
            <span key={skill} className="text-xs bg-base-300 text-base-content px-2 py-1 rounded-md">{skill}</span>
            ))}
            {job.skills.length > 4 && (
                <span className="text-xs bg-base-300 text-base-content px-2 py-1 rounded-md">+{job.skills.length - 4} more</span>
            )}
        </div>
      </div>
      <div className="border-t border-base-300 mt-4 pt-4 flex justify-between items-center text-sm text-base-content">
        <div className="flex items-center">
            <LocationIcon className="w-4 h-4 mr-2" />
            <span>{job.location}</span>
        </div>
        {job.salaryRange && (
            <div className="flex items-center">
                <span className="text-green-400 font-semibold">{job.salaryRange}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default JobCard;