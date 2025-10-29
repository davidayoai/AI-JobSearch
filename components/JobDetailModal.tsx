import React, { useState, useEffect, useRef } from 'react';
import type { Job } from '../types';
import { InsightType } from '../types';
import { getJobInsight, analyzeResume } from '../services/geminiService';
import { CloseIcon, SparklesIcon, BuildingIcon, LocationIcon, BriefcaseIcon, DocumentTextIcon, BookmarkIcon, UploadIcon } from './icons';
import Spinner from './Spinner';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  isSaved: boolean;
  onSave: (job: Job) => void;
  onUnsave: (jobId: string) => void;
}

interface Insight {
  type: InsightType;
  title: string;
  content: string | null;
  isLoading: boolean;
  error: string | null;
}

const InsightButton: React.FC<{ title: string; onClick: () => void; isLoading: boolean }> = ({ title, onClick, isLoading }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className="w-full flex items-center justify-center text-sm bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-300 focus:ring-brand-secondary transition duration-150 ease-in-out disabled:opacity-60"
  >
    {isLoading ? (
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    ) : (
      <>
        <SparklesIcon className="w-4 h-4 mr-2" />
        {title}
      </>
    )}
  </button>
);

// FIX: Moved TabButton outside of the JobDetailModal component to prevent re-creation on every render. This is a React best practice and can resolve subtle bugs with type inference and component state.
// FIX: Explicitly defined TabButton props with an interface and used React.FC to resolve a 'children' prop type error.
interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
        isActive
          ? 'bg-base-200 text-white'
          : 'bg-transparent text-base-content hover:bg-base-100/50'
      }`}
    >
      {children}
    </button>
  );

const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, isSaved, onSave, onUnsave }) => {
  const [insights, setInsights] = useState<Insight[]>([
    { type: InsightType.SUMMARY, title: 'Summarize', content: null, isLoading: false, error: null },
    { type: InsightType.SKILLS, title: 'Key Skills', content: null, isLoading: false, error: null },
    { type: InsightType.COVER_LETTER, title: 'Cover Letter Helper', content: null, isLoading: false, error: null },
  ]);
  
  const [activeTab, setActiveTab] = useState('insights');
  const [resumeText, setResumeText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset state when a new job is selected
    setInsights(prev => prev.map(i => ({ ...i, content: null, isLoading: false, error: null })));
    setActiveTab('insights');
    setResumeText('');
    setUploadedFile(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
  }, [job]);

  if (!job) return null;

  const handleSaveToggle = () => {
    if (isSaved) {
      onUnsave(job.id);
    } else {
      onSave(job);
    }
  };

  const handleFetchInsight = async (type: InsightType) => {
    setInsights(prev => prev.map(i => i.type === type ? { ...i, isLoading: true, error: null } : i));
    try {
      const content = await getJobInsight(job, type);
      setInsights(prev => prev.map(i => i.type === type ? { ...i, content, isLoading: false } : i));
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setInsights(prev => prev.map(i => i.type === type ? { ...i, error: errorMessage, isLoading: false } : i));
    }
  };

  const handleAnalyzeResume = async () => {
    if ((!resumeText.trim() && !uploadedFile) || !job) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const resumeData = uploadedFile 
          ? { file: { data: uploadedFile.data, mimeType: uploadedFile.mimeType } }
          : { text: resumeText };
      const result = await analyzeResume(resumeData, job);
      setAnalysisResult(result);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAnalysisError(null); // Reset error on new upload attempt

    const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.type)) {
        setAnalysisError('Invalid file type. Please upload a PDF or DOCX file.');
        if (event.target) event.target.value = ''; // Clear input for re-selection
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64Data = dataUrl.split(',')[1];
        setUploadedFile({ name: file.name, data: base64Data, mimeType: file.type });
        setResumeText(''); // Clear pasted text
    };
    reader.onerror = () => {
        setAnalysisError('Failed to read the file.');
    };
    reader.readAsDataURL(file);
    if (event.target) event.target.value = ''; // Clear input for re-selection
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-base-200 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="p-4 sm:p-6 border-b border-base-300 flex justify-between items-center flex-shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{job.title}</h2>
            <div className="flex items-center text-sm text-base-content mt-1">
              <BuildingIcon className="w-4 h-4 mr-2" />
              <span>{job.company}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <button 
                onClick={handleSaveToggle} 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isSaved ? 'bg-brand-primary/20 text-brand-primary' : 'bg-base-300 text-base-content'
                } hover:bg-brand-primary/30`}
                aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
                <BookmarkIcon className="w-4 h-4" filled={isSaved} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button onClick={onClose} className="text-base-content hover:text-white transition-colors p-2 rounded-full hover:bg-base-300">
                <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto">
            <div className="flex flex-col lg:flex-row">
                <div className="lg:w-2/3 p-4 sm:p-6">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-base-content mb-4">
                        <div className="flex items-center"><LocationIcon className="w-4 h-4 mr-2" />{job.location}</div>
                        <div className="flex items-center"><BriefcaseIcon className="w-4 h-4 mr-2" />{job.type}</div>
                        {job.salaryRange && <div className="flex items-center font-semibold text-green-400"><span>💰</span><span className="ml-2">{job.salaryRange}</span></div>}
                    </div>

                    <h3 className="font-bold text-lg text-white mb-2">Job Description</h3>
                    <div className="prose prose-sm prose-invert max-w-none text-base-content whitespace-pre-wrap">{job.description}</div>

                    <h3 className="font-bold text-lg text-white mt-6 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {job.skills.map(skill => (
                            <span key={skill} className="text-sm bg-base-300 text-base-content px-3 py-1 rounded-full">{skill}</span>
                        ))}
                    </div>
                </div>

                <aside className="lg:w-1/3 bg-base-300 lg:border-l lg:border-base-200">
                    <div className="sticky top-0 bg-base-300 px-4 pt-4">
                        <h3 className="font-bold text-lg text-white mb-2">AI Assistant</h3>
                        <div className="border-b border-base-200 flex space-x-2">
                            <TabButton isActive={activeTab === 'insights'} onClick={() => setActiveTab('insights')}>
                                <span className="flex items-center"><SparklesIcon className="w-4 h-4 mr-2" />Insights</span>
                            </TabButton>
                            <TabButton isActive={activeTab === 'resume'} onClick={() => setActiveTab('resume')}>
                                <span className="flex items-center"><DocumentTextIcon className="w-4 h-4 mr-2" />Resume Analyzer</span>
                            </TabButton>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6">
                        {activeTab === 'insights' && (
                             <div className="space-y-4">
                                {insights.map(insight => (
                                    <div key={insight.type}>
                                        <InsightButton title={insight.title} onClick={() => handleFetchInsight(insight.type)} isLoading={insight.isLoading} />
                                        {insight.content && (
                                            <div className="mt-3 p-3 bg-base-100 rounded-md text-sm text-base-content whitespace-pre-wrap">
                                                {insight.content}
                                            </div>
                                        )}
                                        {insight.error && <p className="mt-2 text-sm text-red-400">{insight.error}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === 'resume' && (
                            <div>
                               <p className="text-sm text-base-content mb-3">Paste your resume below or upload a PDF/DOCX to see how it matches up.</p>
                               <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    className="hidden"
                                    aria-hidden="true"
                                />
                               <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mb-3 w-full flex items-center justify-center text-sm bg-base-100 hover:bg-base-200 border border-base-200 text-base-content hover:text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-300 focus:ring-brand-secondary transition duration-150 ease-in-out"
                                >
                                    <UploadIcon className="w-4 h-4 mr-2" />
                                    Upload Resume (.pdf, .docx)
                                </button>
                                {uploadedFile ? (
                                    <div className="flex items-center justify-between p-2 mb-3 bg-base-100 rounded-md text-sm text-base-content">
                                        <span className="truncate pr-2">{uploadedFile.name}</span>
                                        <button 
                                            onClick={() => setUploadedFile(null)}
                                            className="p-1 rounded-full text-base-content hover:text-white hover:bg-base-300 transition-colors"
                                            aria-label="Remove file"
                                        >
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <textarea
                                        className="w-full h-40 bg-base-100 border border-base-200 rounded-md shadow-sm p-2 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
                                        placeholder="Paste your resume here..."
                                        value={resumeText}
                                        onChange={(e) => setResumeText(e.target.value)}
                                    ></textarea>
                                )}
                                <button
                                    onClick={handleAnalyzeResume}
                                    disabled={isAnalyzing || (!resumeText.trim() && !uploadedFile)}
                                    className="mt-3 w-full flex items-center justify-center text-sm bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-300 focus:ring-brand-secondary transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isAnalyzing ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        'Analyze Resume'
                                    )}
                                </button>
                                {analysisError && <p className="mt-2 text-sm text-red-400">{analysisError}</p>}
                                {analysisResult && (
                                    <div className="mt-4 p-3 bg-base-100 rounded-md">
                                        <div className="prose prose-sm prose-invert max-w-none text-base-content">
                                            {analysisResult.split('\n').map((line, index) => {
                                                if (line.startsWith('###')) {
                                                    return <h3 key={index} className="text-white font-bold mt-3 mb-1">{line.replace('###', '').trim()}</h3>;
                                                }
                                                if (line.startsWith('- ')) {
                                                    return <li key={index} className="ml-4">{line.replace('- ', '').trim()}</li>;
                                                }
                                                return <p key={index}>{line}</p>;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;