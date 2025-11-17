export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  userType: 'APPLICANT' | 'EMPLOYER';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

export interface JobPost {
  id: string;
  title: string;
  description: string;
  jobPosition: string;
  location: string;
  experience: string;
  minSalary: number;
  maxSalary: number;
  postedDate: string;
  closingDate: string;
  vacancies: number;
  jobStatus: 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'EXPIRED';
  jobType: 'INTERNSHIP' | 'FRESHER' | 'JUNIOR' | 'SENIOR' | 'MANAGER';
  updateAt: string;
  employerId: string;
  employerName: string;
  companyName?: string;
  logoUrl?: string;
  categoryId: string;
  categoryName: string;
  searchableText?: string;
}

export interface JobPostPageResponse {
  content: JobPost[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

export interface Application {
  id: string;
  applicantId: string;
  applicantName: string;
  jobId: string;
  jobTitle: string;
  jobPosition: string;
  logoUrl: string;
  companyName: string;
  location: string;
  minSalary: number;
  maxSalary: number;
  closingDate: string;
  appliedDate: string;
  status: 'PENDING' | 'VIEWED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  cvFileName: string;
  cvId: string;
  cvUrl: string;
  updateAt: string;
}

export interface SavedJob {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  logoUrl?: string;
  jobLocation: string;
  minSalary: number;
  maxSalary: number;
  closingDate: string;
  savedDate: string;
  postedDate: string;
  jobType: string;
}

export interface CV {
  id: string;
  applicantId: string;
  fileName?: string;
  url: string;
  uploadedDate: string;
  isUsedInApplication?: boolean;
  applicationId?: string | null;
}

export interface Applicant {
  id?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  gender: 'MALE' | 'FEMALE';
  careerObjective?: string;
  yearsOfExperience: number;
  skills: string[];
  certificates: Certificate[];
  universityName: string;
  major: string;
  degreeLevel: string;
  graduationYear: number;
  gpa: number;
}

export interface Certificate {
  certificateId?: string;
  certificateName: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  certificateUrl?: string;
  notes?: string;
}

export interface JobCategory {
  id: number;
  categoryName: string;
  description: string;
  createAt: string;
  updateAt: string;
  jobPostCount?: number;
}

export interface CVPageResponse {
  content: CV[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  userName: string;
  applicationId?: string | null;
  jobPostId?: string | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPageResponse {
  content: NotificationItem[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

export interface AIChatResponse {
  response: string;
  conversationHistory?: string;
}

