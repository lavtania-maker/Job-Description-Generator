export interface FAQ {
  question: string;
  answer: string;
}

export interface Section {
  heading: string;
  content: string;
}

export interface JobContent {
  category: string;
  summary: string;
  shortIntro: string;
  description: string;
  homepageDescription?: string;
  sections: Section[];
  responsibilities: string[];
  requirements: string[];
  faqs: FAQ[];
}

export interface Job {
  id: string;
  slug: string;
  jobTitle: string;
  industry: string;
  category: string;
  location: string;
  content: JobContent;
  published?: boolean;
  createdAt: string;
}

export interface JobSummary {
  id: string;
  slug: string;
  jobTitle: string;
  industry: string;
  category: string;
  published?: boolean;
  createdAt: string;
}
