export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  skills: string[];
  salaryRange?: string;
}

export interface SearchFilters {
  query: string;
  location: string;
  type: string;
  salary: string;
  workLocation: string;
  industry: string;
}

export enum InsightType {
  SUMMARY = 'summary',
  SKILLS = 'skills',
  COVER_LETTER = 'cover_letter'
}