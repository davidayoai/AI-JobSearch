import React from 'react';
import { CheckCircleIcon } from './icons';

interface LiveSearchStatusProps {
  status: {
    completed: string[];
    current: string | null;
  };
  sources: string[];
}

const LiveSearchStatus: React.FC<LiveSearchStatusProps> = ({ status, sources }) => {
  return (
    <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8 animate-fade-in">
      <h3 className="text-xl font-bold text-white mb-4">Searching for jobs...</h3>
      <p className="text-base-content mb-6">Our AI is scanning top job boards in real-time to find the best matches for you.</p>
      <div className="space-y-3">
        {sources.map(source => {
          const isCompleted = status.completed.includes(source);
          const isCurrent = status.current === source;

          return (
            <div key={source} className="flex items-center p-3 bg-base-300 rounded-md transition-all duration-300">
              {isCompleted ? (
                <CheckCircleIcon className="w-6 h-6 text-green-400 mr-4" />
              ) : isCurrent ? (
                <div className="w-6 h-6 mr-4 flex items-center justify-center">
                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div>
                </div>
              ) : (
                <div className="w-6 h-6 mr-4 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full bg-base-100 border-2 border-base-content/50"></div>
                </div>
              )}
              <span className={`font-medium ${isCompleted ? 'text-green-400' : isCurrent ? 'text-white' : 'text-base-content'}`}>
                {source}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveSearchStatus;
