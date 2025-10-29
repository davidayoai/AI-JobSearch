
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="p-2 rounded-md text-base-content hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to previous page"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      <div className="flex items-center space-x-2">
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              currentPage === number
                ? 'bg-brand-primary text-white'
                : 'bg-base-200 text-base-content hover:bg-base-300'
            }`}
          >
            {number}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md text-base-content hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to next page"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </nav>
  );
};

export default Pagination;
