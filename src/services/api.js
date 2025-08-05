import axios from 'axios'

// Create axios instance with base configuration
const apiClient = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Development mode notification
if (import.meta.env.DEV) {
  console.log('🚧 Vue Dashboard: Running in development mode')
  console.log('📡 API calls that fail will return mock data')
  console.log('🔧 To use real data, ensure backend endpoints exist')
}

// Request interceptor for adding auth headers if needed
apiClient.interceptors.request.use(
  config => {
    // Get config from global
    const dashboardConfig = window.DASHBOARD_CONFIG
    if (dashboardConfig) {
      // Add Knack API headers if needed
      if (dashboardConfig.knackAppId) {
        config.headers['X-Knack-Application-Id'] = dashboardConfig.knackAppId
      }
      if (dashboardConfig.knackApiKey) {
        config.headers['X-Knack-REST-API-KEY'] = dashboardConfig.knackApiKey
      }
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error Details:')
    console.error('- URL:', error.config?.url)
    console.error('- Method:', error.config?.method)
    console.error('- Status:', error.response?.status)
    console.error('- Response:', error.response?.data)
    console.error('- Message:', error.message)
    
    if (error.response?.status === 0 || error.message === 'Network Error') {
      console.error('⚠️ CORS Error: The backend is not allowing requests from localhost:3000')
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// Mock data for development
const MOCK_DATA = {
  academicYears: ['2023-24', '2022-23', '2021-22'],
  keyStages: ['KS3', 'KS4', 'KS5'],
  yearGroups: ['7', '8', '9', '10', '11', '12', '13'],
  statistics: {
    totalStudents: 450,
    averageERI: 72.5,
    eriChange: 2.3,
    completionRate: 89,
    averageScore: 68.4,
    scoreChange: 1.8,
    nationalERI: 70.2,
    eriTrend: 'up',
    vespaScores: {
      vision: 75,
      effort: 82,
      systems: 68,
      practice: 71,
      attitude: 78,
      nationalVision: 72,
      nationalEffort: 80,
      nationalSystems: 65,
      nationalPractice: 69,
      nationalAttitude: 75
    },
    comparison: {
      school: [75, 82, 68, 71, 78],
      national: [72, 80, 65, 69, 75]
    },
    yearGroupPerformance: {
      labels: ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'],
      scores: [72, 75, 71, 68, 74]
    }
  },
  qlaData: {
    questions: [
      { id: 'q1', text: 'How confident are you in your ability to succeed?', subTheme: 'Self-belief', vespaArea: 'Vision' },
      { id: 'q2', text: 'How well do you manage your time?', subTheme: 'Organization', vespaArea: 'Systems' },
      { id: 'q3', text: 'How often do you practice past papers?', subTheme: 'Revision', vespaArea: 'Practice' }
    ],
    responses: {
      q1: Array(50).fill(null).map(() => ({ score: Math.floor(Math.random() * 5) + 1 })),
      q2: Array(45).fill(null).map(() => ({ score: Math.floor(Math.random() * 5) + 1 })),
      q3: Array(48).fill(null).map(() => ({ score: Math.floor(Math.random() * 5) + 1 }))
    }
  },
  wordCloudData: [
    { text: 'helpful', size: 40 },
    { text: 'organized', size: 35 },
    { text: 'supportive', size: 30 },
    { text: 'challenging', size: 28 },
    { text: 'engaging', size: 25 },
    { text: 'improved', size: 22 },
    { text: 'confident', size: 20 }
  ],
  commentInsights: {
    positive: [
      { id: 1, name: 'Teacher Support', count: 145 },
      { id: 2, name: 'Peer Collaboration', count: 98 },
      { id: 3, name: 'Resources Quality', count: 76 }
    ],
    improvement: [
      { id: 4, name: 'Time Management', count: 67 },
      { id: 5, name: 'Exam Preparation', count: 54 },
      { id: 6, name: 'Study Space', count: 32 }
    ],
    samples: [
      { id: 1, text: 'The teachers have been incredibly supportive this term.', yearGroup: 'Year 10', date: '2024-01-15' },
      { id: 2, text: 'I feel more confident about my exams after using the study techniques.', yearGroup: 'Year 11', date: '2024-01-12' }
    ]
  }
}

// API service matching the previous implementation
export const API = {
  // Get base URL from config
  getBaseUrl() {
    // In development, use relative URLs so Vite proxy works
    if (import.meta.env.DEV) {
      return ''  // Empty string means use relative URLs
    }
    const config = window.DASHBOARD_CONFIG
    return config?.herokuAppUrl || 'https://vespa-dashboard-9a1f84ee5341.herokuapp.com'
  },

  // Supabase endpoints
  async getSchools() {
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/schools`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch schools:', error)
      // Return mock data in development
      if (import.meta.env.DEV) {
        console.warn('Using mock schools data')
        return [
          { id: 'est_1', name: 'Sample High School', type: 'Secondary' },
          { id: 'est_2', name: 'Sample Primary School', type: 'Primary' }
        ]
      }
      throw error
    }
  },

  async checkSuperUser(email) {
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/check-super-user`, {
        params: { email }
      })
      return response.data
    } catch (error) {
      console.error('Failed to check super user status:', error)
      // Return mock data in development
      if (import.meta.env.DEV) {
        console.warn('Using mock super user check')
        return { is_super_user: false }
      }
      throw error
    }
  },

  async getAcademicYears() {
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/academic-years`)
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Using mock data for academic years')
        return MOCK_DATA.academicYears
      }
      throw error
    }
  },

  async getKeyStages() {
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/key-stages`)
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Using mock data for key stages')
        return MOCK_DATA.keyStages
      }
      throw error
    }
  },

  async getYearGroups(establishmentId) {
    try {
      const params = establishmentId ? { establishment_id: establishmentId } : {}
      const response = await apiClient.get(`${this.getBaseUrl()}/api/year-groups`, { params })
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Using mock data for year groups')
        return MOCK_DATA.yearGroups
      }
      throw error
    }
  },

  async getGroups(establishmentId) {
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/groups`, {
        params: { establishment_id: establishmentId }
      })
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Using mock data for groups')
        return ['Group A', 'Group B', 'Group C']
      }
      throw error
    }
  },

  async getFaculties(establishmentId) {
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/faculties`, {
        params: { establishment_id: establishmentId }
      })
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Using mock data for faculties')
        return ['Mathematics', 'Science', 'English', 'History', 'Arts']
      }
      throw error
    }
  },

  async searchStudents(establishmentId, searchTerm) {
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/students/search`, {
        params: { 
          establishment_id: establishmentId,
          q: searchTerm
        }
      })
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Using mock data for student search')
        return [
          { id: '1', name: 'John Doe', yearGroup: '10', displayText: 'John Doe (10)' },
          { id: '2', name: 'Jane Smith', yearGroup: '11', displayText: 'Jane Smith (11)' }
        ]
      }
      throw error
    }
  },

  async getStatistics(establishmentId, filters = {}) {
    try {
      console.log('[API] getStatistics called with filters:', filters)
      const response = await apiClient.get(`${this.getBaseUrl()}/api/statistics`, {
        params: {
          establishment_id: establishmentId,
          ...filters
        }
      })
      console.log('[API] getStatistics response:', response.data)
      console.log('[API] National ERI from response:', response.data.nationalERI)
      console.log('[API] Total Students:', response.data.totalStudents, 'Total Responses:', response.data.totalResponses)
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Using mock data for statistics')
        return MOCK_DATA.statistics
      }
      throw error
    }
  },

  async getQLAData(establishmentId, filters = {}) {
    console.log('[API] getQLAData called with establishmentId:', establishmentId, 'filters:', filters)
    try {
      const url = `${this.getBaseUrl()}/api/qla`
      console.log('[API] QLA URL:', url)
      const response = await apiClient.get(url, {
        params: {
          establishment_id: establishmentId,
          ...filters
        }
      })
      console.log('[API] getQLAData response:', response.data)
      return response.data
    } catch (error) {
      console.error('[API] getQLAData error:', error)
      console.error('[API] QLA Error details:', error.response?.data || error.message)
      // Return structure with empty questions but mock insights for now
      return {
        highLowQuestions: {
          topQuestions: [],
          bottomQuestions: []
        },
        insights: [
          { id: 'growth_mindset', title: 'Growth Mindset', percentageAgreement: 0, questionIds: ['Q5', 'Q26'], icon: '🌱', totalResponses: 0 },
          { id: 'academic_momentum', title: 'Academic Momentum', percentageAgreement: 0, questionIds: ['Q14', 'Q16', 'Q17', 'Q9'], icon: '🚀', totalResponses: 0 },
          { id: 'study_effectiveness', title: 'Study Effectiveness', percentageAgreement: 0, questionIds: ['Q7', 'Q12', 'Q15'], icon: '📚', totalResponses: 0 },
          { id: 'exam_confidence', title: 'Exam Confidence', percentageAgreement: 0, questionIds: ['OUTCOME_Q_CONFIDENT'], icon: '🎯', totalResponses: 0 },
          { id: 'organization_skills', title: 'Organization Skills', percentageAgreement: 0, questionIds: ['Q2', 'Q22', 'Q11'], icon: '📋', totalResponses: 0 },
          { id: 'resilience_factor', title: 'Resilience', percentageAgreement: 0, questionIds: ['Q13', 'Q8', 'Q27'], icon: '💪', totalResponses: 0 },
          { id: 'stress_management', title: 'Stress Management', percentageAgreement: 0, questionIds: ['Q20', 'Q28'], icon: '😌', totalResponses: 0 },
          { id: 'active_learning', title: 'Active Learning', percentageAgreement: 0, questionIds: ['Q7', 'Q23', 'Q19'], icon: '🎓', totalResponses: 0 },
          { id: 'support_readiness', title: 'Support Readiness', percentageAgreement: 0, questionIds: ['OUTCOME_Q_SUPPORT'], icon: '🤝', totalResponses: 0 },
          { id: 'time_management', title: 'Time Management', percentageAgreement: 0, questionIds: ['Q2', 'Q4', 'Q11'], icon: '⏰', totalResponses: 0 },
          { id: 'academic_confidence', title: 'Academic Confidence', percentageAgreement: 0, questionIds: ['Q10', 'Q8'], icon: '⭐', totalResponses: 0 },
          { id: 'revision_readiness', title: 'Revision Ready', percentageAgreement: 0, questionIds: ['OUTCOME_Q_EQUIPPED'], icon: '📖', totalResponses: 0 }
        ]
      }
    }
  },

  async getWordCloudData(establishmentId, filters = {}) {
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/word-cloud`, {
        params: {
          establishment_id: establishmentId,
          ...filters
        }
      })
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Using mock data for word cloud')
        return MOCK_DATA.wordCloudData
      }
      throw error
    }
  },

  async getCommentInsights(establishmentId, filters = {}) {
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/comment-insights`, {
        params: {
          establishment_id: establishmentId,
          ...filters
        }
      })
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Using mock data for comment insights')
        return MOCK_DATA.commentInsights
      }
      throw error
    }
  },

  async getEstablishmentName(establishmentId) {
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/establishment/${establishmentId}`)
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Using mock establishment name')
        return { name: 'Demo School' }
      }
      throw error
    }
  },

  // Utility methods
  handleResponse(response) {
    if (!response.ok) {
      throw new Error(response.statusText || 'Request failed')
    }
    return response.json()
  },

  buildQueryString(params) {
    return Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
  },

  async getStudentResponses(studentId, cycle = 1) {
    console.log('[API] getStudentResponses called with studentId:', studentId, 'cycle:', cycle)
    
    if (!studentId) {
      console.error('[API] Student ID is missing')
      throw new Error('Student ID is required')
    }
    
    try {
      const response = await apiClient.get(`${this.getBaseUrl()}/api/student-responses`, {
        params: {
          student_id: studentId,
          cycle: cycle
        }
      })
      console.log('[API] Student responses received:', response.data)
      return response.data
    } catch (error) {
      console.error('[API] Error fetching student responses:', error)
      if (import.meta.env.DEV) {
        console.warn('Using mock data for student responses')
        // Return mock data for development
        return {
          student: {
            name: 'John Doe',
            email: 'john.doe@school.edu'
          },
          cycle: cycle,
          summary: {
            green: 15,
            amber: 8,
            red: 3,
            none: 0
          },
          responses: [
            { questionId: 'q1', questionText: 'I work as hard as I can in most classes', responseValue: 4, ragRating: 'green' },
            { questionId: 'q2', questionText: 'I complete all my homework on time', responseValue: 3, ragRating: 'amber' },
            { questionId: 'q3', questionText: 'I enjoy studying', responseValue: 2, ragRating: 'red' }
          ]
        }
      }
      // Throw the actual error from the backend if available
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error)
      }
      throw error
    }
  }
}

// Also export individual methods for convenience
export const {
  getSchools,
  checkSuperUser,
  getAcademicYears,
  getKeyStages,
  getYearGroups,
  getStatistics,
  getQLAData,
  getWordCloudData,
  getCommentInsights,
  getEstablishmentName,
  getStudentResponses
} = API