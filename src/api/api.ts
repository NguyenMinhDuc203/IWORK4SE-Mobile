import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/config';
import {
  ApiResponse,
  ApiError,
  JobPost,
  JobPostPageResponse,
  Application,
  SavedJob,
  CV,
  Applicant,
  JobCategory,
  CVPageResponse,
  NotificationPageResponse,
  NotificationItem,
  AIChatResponse,
} from '../types/api';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refreshToken),
    });

    if (!response.ok) {
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
      return null;
    }

    const data = await response.json();
    const newToken = data.data.token;
    const newRefreshToken = data.data.refreshToken;

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, newToken],
      [STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken],
    ]);

    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
    return null;
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 403) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));

      if (error.message && error.message.includes('JWT expired')) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh(async (newToken: string) => {
              const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              };

              try {
                const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                  ...options,
                  headers: retryHeaders,
                  signal: controller.signal,
                });

                if (!retryResponse.ok) {
                  const retryError = await retryResponse.json().catch(() => ({ message: 'An error occurred' }));
                  reject(new ApiError(retryResponse.status, retryError.message || 'An error occurred'));
                } else {
                  resolve(retryResponse.json());
                }
              } catch (err) {
                reject(err);
              }
            });
          });
        }

        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);

          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          };

          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: retryHeaders,
            signal: controller.signal,
          });

          if (!retryResponse.ok) {
            const retryError = await retryResponse.json().catch(() => ({ message: 'An error occurred' }));
            throw new ApiError(retryResponse.status, retryError.message || 'An error occurred');
          }

          return retryResponse.json();
        }
      }

      throw new ApiError(response.status, error.message || 'An error occurred');
    }

    if (!response.ok) {
      let message = response.statusText || 'An error occurred';
      try {
        const errJson = await response.json();
        message = errJson?.message || errJson?.error?.message || errJson?.data?.message || message;
      } catch {
        try {
          const text = await response.text();
          if (text) message = text;
        } catch {
          // ignore
        }
      }
      throw new ApiError(response.status, message);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout - Server không phản hồi');
      }
      if (error.message.includes('Network request failed')) {
        throw new ApiError(0, 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      }
    }

    throw new ApiError(500, 'Lỗi không xác định: ' + (error as Error).message);
  }
}

export const api = {
  // Authentication
  login: (credentials: {
    username: string;
    password: string;
    platform?: string;
    versionApp?: string;
    deviceToken?: string;
  }) =>
    fetchApi<
      ApiResponse<{
        accessToken: string;
        refreshToken: string;
        role: string;
        userId: string;
        fullName: string;
        email: string;
        phone: string;
      }>
    >('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  refreshToken: (refreshToken: string) =>
    fetchApi<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify(refreshToken),
    }),

  logout: () =>
    fetchApi<ApiResponse<string>>('/auth/logout', {
      method: 'POST',
    }),

  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    password: string;
    userType: 'APPLICANT' | 'EMPLOYER';
  }) =>
    fetchApi<ApiResponse<any>>('/user/sign-up', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) =>
    fetchApi<ApiResponse<any>>('/user/change-pwd', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Job Posts
  getJobs: (params?: {
    keyword?: string;
    sort?: string;
    page?: number;
    size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());

    return fetchApi<ApiResponse<JobPostPageResponse>>(`/job-post/?${queryParams.toString()}`);
  },

  getJobById: (id: string) => fetchApi<ApiResponse<JobPost>>(`/job-post/${id}`),

  searchJobPosts: (params: {
    keywords?: string;
    jobStatus?: 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'EXPIRED';
    jobType?: 'INTERNSHIP' | 'FRESHER' | 'JUNIOR' | 'SENIOR' | 'MANAGER';
    location?: string;
    minSalary?: number;
    maxSalary?: number;
    experience?: string;
    categoryId?: number;
    employerId?: string;
    postedAfter?: string;
    closingBefore?: string;
    page?: number;
    size?: number;
  }) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== ''),
    );

    // Backend /search/job-posts returns a Spring Page<JobPostDocument> directly (not wrapped).
    // So we return the page object as-is.
    return fetchApi<{
      content: JobPost[];
      pageNumber: number;
      pageSize: number;
      totalPages: number;
      totalElements: number;
    }>(`/search/job-posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filteredParams),
    });
  },

  // Applications
  createApplication: (data: {
    jobId: string;
    cvId: string;
    applicantId: string;
    coverLetter?: string;
  }) =>
    fetchApi<ApiResponse<any>>('/application/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getApplicationsByApplicant: (applicantId: string, page = 0, size = 10) =>
    fetchApi<ApiResponse<{ content: Application[]; pageNumber: number; pageSize: number; totalPages: number; totalElements: number }>>(
      `/application/applicant/${applicantId}?page=${page}&size=${size}`,
      {
        method: 'GET',
      },
    ),

  withdrawApplication: (id: string) =>
    fetchApi<ApiResponse<any>>(`/application/${id}/withdraw`, {
      method: 'PUT',
    }),

  hasApplicantApplied: (applicantId: string, jobId: string) =>
    fetchApi<ApiResponse<boolean>>(`/application/check?applicantId=${applicantId}&jobId=${jobId}`),

  // CV Management
  uploadCV: (formData: FormData) =>
    fetchApi<ApiResponse<any>>('/cv/', {
      method: 'POST',
      body: formData,
    }),

  getCVsByApplicant: (applicantId: string, page = 0, size = 10) =>
    fetchApi<ApiResponse<CVPageResponse>>(`/cv/applicant/${applicantId}?page=${page}&size=${size}`),

  deleteCV: (id: string) =>
    fetchApi<ApiResponse<any>>(`/cv/${id}`, {
      method: 'DELETE',
    }),

  // Saved Jobs
  toggleSaveJob: async (jobPostId: string) => {
    const applicantId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!applicantId) throw new Error('Missing applicantId in storage');

    const url = `/saved-job/toggle?applicantId=${applicantId}&jobId=${jobPostId}`;

    return fetchApi<ApiResponse<any>>(url, {
      method: 'POST',
    });
  },

  getSavedJobsByApplicant: ({
    applicantId,
    page = 0,
    size = 10,
  }: {
    applicantId: string;
    page?: number;
    size?: number;
  }) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    const url = `/saved-job/applicant/${applicantId}?${queryParams.toString()}`;

    return fetchApi<ApiResponse<{ content: SavedJob[]; pageNumber: number; pageSize: number; totalPages: number; totalElements: number }>>(
      url,
      {
        method: 'GET',
      },
    );
  },

  deleteSavedJob: (id: string) =>
    fetchApi<ApiResponse<any>>(`/saved-job/${id}`, {
      method: 'DELETE',
    }),

  // Applicant Management
  updateApplicant: (data: Applicant) =>
    fetchApi<ApiResponse<any>>('/applicant/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getApplicantById: (id: string) => fetchApi<ApiResponse<Applicant>>(`/applicant/${id}`),

  // Job Categories
  getAllJobCategories: () => fetchApi<ApiResponse<JobCategory[]>>('/job-category/all'),

  // Notifications
  getNotificationsByUser: (userId: string, page = 0, size = 20) =>
    fetchApi<ApiResponse<NotificationPageResponse>>(`/notification/user/${userId}?page=${page}&size=${size}`),

  // AI Chat
  sendAIMessage: (message: string, conversationHistory?: string) =>
    fetchApi<AIChatResponse | ApiResponse<AIChatResponse>>('/api/ai-chat/send', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    }),
};

