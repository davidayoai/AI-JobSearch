import React, { useState } from 'react';
import type { SearchFilters } from '../types';
import { SearchIcon } from './icons';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters: SearchFilters;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialFilters, isLoading }) => {
  const [query, setQuery] = useState(initialFilters.query);
  const [location, setLocation] = useState(initialFilters.location);
  const [type, setType] = useState(initialFilters.type);
  const [salary, setSalary] = useState(initialFilters.salary);
  const [workLocation, setWorkLocation] = useState(initialFilters.workLocation);
  const [industry, setIndustry] = useState(initialFilters.industry);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, location, type, salary, workLocation, industry });
  };

  return (
    <div className="bg-base-200 p-4 md:p-6 rounded-lg shadow-lg sticky top-4 z-10 backdrop-blur-sm bg-opacity-80">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="query" className="block text-sm font-medium text-base-content mb-1">Role or Keyword</label>
            <input
              id="query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'React Native Developer'"
              className="w-full bg-base-300 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-base-content mb-1">Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., 'Remote'"
              className="w-full bg-base-300 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
            />
          </div>
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-base-content mb-1">Industry</label>
            <input
              id="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., 'Fintech', 'Healthcare'"
              className="w-full bg-base-300 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-base-content mb-1">Job Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-base-300 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
            >
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
           <div>
            <label htmlFor="workLocation" className="block text-sm font-medium text-base-content mb-1">Work Preference</label>
            <select
              id="workLocation"
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              className="w-full bg-base-300 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
            >
              <option value="">Any</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-base-content mb-1">Desired Salary</label>
            <input
              id="salary"
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g., '$120,000'"
              className="w-full bg-base-300 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto sm:float-right flex items-center justify-center bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-secondary transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <SearchIcon className="h-5 w-5 mr-2" />
              Find Jobs
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;