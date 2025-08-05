import { defineStore } from 'pinia'
import { API } from '../services/api'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    // User info
    userEmail: null,
    userRole: null,
    isSuperUser: false,
    staffAdminEstablishmentId: null,
    
    // Establishment data
    establishments: [],
    selectedEstablishment: null,
    
    // Dashboard data
    dashboardData: {
      statistics: null,
      qlaData: null,
      wordCloudData: null,
      commentInsights: null
    },
    
    // Filters
    filters: {
      yearGroup: 'all',
      group: 'all',
      faculty: 'all',
      studentId: null,
      studentName: null,
      cycle: 1
    },
    
    // Filter options are now loaded dynamically in FilterBar component
    
    // Loading states
    loading: {
      init: false,
      data: false
    },
    
    // Error states
    errors: {
      init: null,
      data: null
    }
  }),

  getters: {
    isStaffAdmin: (state) => state.userRole === 'staff_admin',
    hasData: (state) => state.dashboardData.statistics !== null,
    activeFilters: (state) => {
      return Object.entries(state.filters)
        .filter(([key, value]) => value !== 'all')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    }
  },

  actions: {
    async initialize() {
      this.loading.init = true
      this.errors.init = null
      
      try {
        // Get config from window
        const config = window.DASHBOARD_CONFIG
        if (!config) {
          throw new Error('Dashboard configuration not found')
        }
        
        // Get user email from multiple sources
        let userEmail = config.loggedInUserEmail
        
        // If not in config, try to get from Knack
        if (!userEmail && typeof Knack !== 'undefined' && Knack.getUserAttributes) {
          try {
            const userAttributes = Knack.getUserAttributes()
            userEmail = userAttributes.email || userAttributes.values?.email
            console.log('Got user email from Knack.getUserAttributes():', userEmail)
          } catch (e) {
            console.error('Failed to get user email from Knack.getUserAttributes():', e)
          }
        }
        
        // If still no email, try alternative Knack method
        if (!userEmail && typeof Knack !== 'undefined' && Knack.session && Knack.session.user) {
          try {
            userEmail = Knack.session.user.email
            console.log('Got user email from Knack.session.user:', userEmail)
          } catch (e) {
            console.error('Failed to get user email from Knack.session:', e)
          }
        }
        
        if (!userEmail) {
          throw new Error('Unable to determine user email. Please ensure you are logged in.')
        }
        
        this.userEmail = userEmail
        console.log('User email detected:', this.userEmail)
        
        // Check if user is super user
        if (this.userEmail) {
          try {
            console.log('Checking super user status for:', this.userEmail)
            const superUserCheck = await API.checkSuperUser(this.userEmail)
            console.log('Super user check result:', superUserCheck)
            this.isSuperUser = superUserCheck.is_super_user
          } catch (err) {
            console.error('Super user check failed:', err)
            console.error('API URL:', API.getBaseUrl())
            console.warn('Assuming staff admin role')
            this.isSuperUser = false
          }
        }
        
        // Load establishments for super users
        if (this.isSuperUser) {
          await this.loadEstablishments()
        } else {
          // For staff admins, get their establishment from Knack
          await this.loadStaffAdminEstablishment()
        }
        
        // Set default academic year
        const currentYear = this.getCurrentAcademicYear()
        this.filters.academicYear = currentYear
        
        // Filter options are now loaded dynamically in FilterBar component
        
      } catch (error) {
        this.errors.init = error.message
        throw error
      } finally {
        this.loading.init = false
      }
    },

    async loadEstablishments() {
      try {
        const schools = await API.getSchools()
        console.log('Dashboard Store: Loaded schools from API:', schools.length, 'schools')
        console.log('Dashboard Store: First 5 schools:', schools.slice(0, 5).map(s => ({ id: s.id, name: s.name })))
        console.log('Dashboard Store: Raw API response sample:', schools[0])
        this.establishments = schools.map(school => ({
          id: school.id,
          name: school.name,
          type: school.type || 'School'
        }))
      } catch (error) {
        console.error('Failed to load establishments:', error)
        throw error
      }
    },

    async loadStaffAdminEstablishment() {
      // This mimics the getStaffAdminRecordIdByEmail functionality
      const config = window.DASHBOARD_CONFIG
      
      try {
        console.log('Loading staff admin establishment for:', this.userEmail)
        
        // First, get the staff admin record ID from Knack
        const filters = [{
          field: 'field_86', // Staff admin email field
          operator: 'is',
          value: this.userEmail
        }]
        
        const response = await fetch(`https://api.knack.com/v1/objects/${config.objectKeys.staffAdminRoles}/records?filters=${encodeURIComponent(JSON.stringify(filters))}`, {
          headers: {
            'X-Knack-Application-Id': config.knackAppId,
            'X-Knack-REST-API-Key': config.knackApiKey
          }
        })
        
        const data = await response.json()
        
        if (data.records && data.records.length > 0) {
          const staffRecord = data.records[0]
          // Extract establishment ID from field_110_raw
          if (staffRecord.field_110_raw && staffRecord.field_110_raw.length > 0) {
            this.staffAdminEstablishmentId = staffRecord.field_110_raw[0].id
            this.selectedEstablishment = this.staffAdminEstablishmentId
          }
        }
      } catch (error) {
        console.error('Failed to get staff admin establishment:', error)
        throw new Error('Unable to determine your establishment')
      }
    },

    async loadDashboardData() {
      console.log('Dashboard Store: loadDashboardData called, selectedEstablishment:', this.selectedEstablishment)
      if (!this.selectedEstablishment) {
        throw new Error('No establishment selected')
      }
      
      this.loading.data = true
      this.errors.data = null
      
      try {
        // Log the active filters to debug cycle issue
        console.log('Dashboard Store: Loading data with filters:', this.activeFilters)
        console.log('Dashboard Store: Current cycle:', this.filters.cycle)
        
        // Load all data in parallel
        const [statistics, qlaData, wordCloudData, commentInsights] = await Promise.all([
          API.getStatistics(this.selectedEstablishment, this.activeFilters),
          API.getQLAData(this.selectedEstablishment, this.activeFilters).catch(err => {
            console.error('[Dashboard Store] QLA API Error:', err)
            // Return empty structure with insights but no questions
            return {
              highLowQuestions: {
                topQuestions: [],
                bottomQuestions: []
              },
              insights: []
            }
          }),
          API.getWordCloudData(this.selectedEstablishment, this.activeFilters),
          API.getCommentInsights(this.selectedEstablishment, this.activeFilters)
        ])
        
        console.log('[Dashboard Store] QLA Data loaded:', qlaData)
        
        this.dashboardData = {
          statistics,
          qlaData,
          wordCloudData,
          commentInsights
        }
        
      } catch (error) {
        this.errors.data = error.message
        throw error
      } finally {
        this.loading.data = false
      }
    },

    selectEstablishment(establishmentId) {
      console.log('Dashboard Store: selectEstablishment called with:', establishmentId)
      this.selectedEstablishment = establishmentId
      console.log('Dashboard Store: selectedEstablishment set to:', this.selectedEstablishment)
    },

    async updateFilter(filterType, value) {
      if (this.filters.hasOwnProperty(filterType)) {
        this.filters[filterType] = value
        // Reload data when filters change, but only if an establishment is selected
        if (this.selectedEstablishment) {
          await this.loadDashboardData()
        }
      }
    },
    
    getCurrentAcademicYear() {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1 // 1-12
      
      // Academic year starts in August
      if (month >= 8) {
        return `${year}-${(year + 1).toString().slice(-2)}`
      } else {
        return `${year - 1}-${year.toString().slice(-2)}`
      }
    },

    resetFilters() {
      this.filters = {
        yearGroup: 'all',
        group: 'all',
        faculty: 'all',
        studentId: null,
        studentName: null,
        cycle: this.filters.cycle || 1  // Keep the current cycle
      }
      // Only reload data if an establishment is selected
      if (this.selectedEstablishment) {
        this.loadDashboardData()
      }
    }
  }
})