import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';


export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to normalize success status
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      if (response.data.status === 'success') {
        response.data.success = true;
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// TypeScript Interfaces
export interface Subject {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
  subject_id: string;
}

export interface SubTopic {
  id: string;
  name: string;
  topic_id: string;
}

export interface Test {
  id: string;
  name: string;
  type: string;
  subject: string; // subject-uuid or subject name (GET list has subject name, POST has subject-uuid)
  topics: string[]; // topic uuids or topic names
  sub_topics?: string[]; // subtopic uuids
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  total_time: number;
  total_marks: number;
  total_questions: number;
  status: 'draft' | 'live' | null | string;
  questions?: string[]; // question uuids
  created_at?: string;
}

export interface Question {
  id?: string;
  type: 'mcq' | string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: 'option1' | 'option2' | 'option3' | 'option4' | string;
  explanation?: string;
  difficulty?: string;
  test_id: string;
  subject?: string;       // subject UUID — required by bulk create API
  topic_id?: string;
  sub_topic_id?: string;
  media_url?: string;
}

// API Service Functions
export const apiService = {
  // Auth
  login: async (userId: string, password: string) => {
    const response = await api.post('/auth/login', { userId, password });
    return response.data;
  },

  // Subjects
  getSubjects: async (): Promise<{ success: boolean; data: Subject[] }> => {
    const response = await api.get('/subjects');
    return response.data;
  },

  // Topics
  getTopicsBySubject: async (subjectId: string): Promise<{ success: boolean; data: Topic[] }> => {
    const response = await api.get(`/topics/subject/${subjectId}`);
    return response.data;
  },

  // Sub-topics
  getSubTopicsByTopic: async (topicId: string): Promise<{ success: boolean; data: SubTopic[] }> => {
    const response = await api.get(`/sub-topics/topic/${topicId}`);
    return response.data;
  },

  getSubTopicsMultiTopics: async (topicIds: string[]): Promise<{ success: boolean; data: SubTopic[] }> => {
    const response = await api.post('/sub-topics/multi-topics', { topicIds });
    return response.data;
  },

  // Tests
  getTests: async (): Promise<{ success: boolean; data: Test[] }> => {
    const response = await api.get('/tests');
    return response.data;
  },

  getTestById: async (id: string): Promise<{ success: boolean; data: Test }> => {
    const response = await api.get(`/tests/${id}`);
    return response.data;
  },

  createTest: async (testData: Omit<Test, 'id' | 'status'>): Promise<{ success: boolean; data: Test; message: string }> => {
    const response = await api.post('/tests', { ...testData, status: 'draft' });
    return response.data;
  },


  updateTest: async (id: string, testData: Partial<Test>): Promise<{ success: boolean; data: Test }> => {
    const response = await api.put(`/tests/${id}`, testData);
    return response.data;
  },

  publishTest: async (id: string): Promise<{ success: boolean; data: Test }> => {
    const response = await api.put(`/tests/${id}`, { status: 'live' });
    return response.data;
  },

  deleteTest: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.delete(`/tests/${id}`);
      // 204 No Content → response.data is empty string or null → treat as success
      // 200 with body → response.data.success is already normalized by interceptor
      const data = response.data;
      if (!data || (typeof data === 'string' && data.trim() === '')) {
        return { success: true }; // 204 No Content
      }
      if (data.success || data.status === 'success') {
        return { success: true };
      }
      return { success: false, message: data.message || 'Delete failed.' };
    } catch (error: any) {
      const status = error?.response?.status;
      // 404 means already deleted — treat as success
      if (status === 404) return { success: true };
      const msg = error?.response?.data?.message || 'Failed to delete test.';
      return { success: false, message: msg };
    }
  },

  // Questions
  bulkCreateQuestions: async (questions: Question[]): Promise<{ success: boolean; data: Question[]; message: string }> => {
    const response = await api.post('/questions/bulk', { questions });
    return response.data;
  },

  fetchBulkQuestions: async (questionIds: string[]): Promise<{ success: boolean; data: Question[] }> => {
    const response = await api.post('/questions/fetchBulk', { question_ids: questionIds });
    return response.data;
  },
};
