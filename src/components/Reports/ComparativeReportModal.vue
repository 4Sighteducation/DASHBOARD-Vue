<template>
  <div>
    <!-- Main wizard modal -->
    <Modal v-if="show && !showReportViewer" @close="handleClose" class="comparative-report-modal">
      <template #header>
        <div class="modal-header-content">
          <h3>Generate Comparative Report</h3>
          <span class="super-user-badge">
            <svg class="badge-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            Premium Feature
          </span>
        </div>
      </template>

      <div class="wizard-container">
        <!-- Progress Steps (3 steps) -->
        <div class="progress-steps">
          <div 
            v-for="(step, index) in steps" 
            :key="step.id"
            :class="['step', { 
              active: currentStep === index,
              completed: currentStep > index 
            }]"
            @click="currentStep > index ? currentStep = index : null"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-label">{{ step.label }}</div>
          </div>
        </div>

        <!-- Step Content -->
        <div class="step-content">
          <!-- Step 1: Report Type -->
          <div v-if="currentStep === 0" class="report-type-selection">
            <h4>Select Report Type</h4>
            <div class="report-type-grid">
              <div 
                v-for="type in reportTypes" 
                :key="type.id"
                :class="['report-type-card', { selected: reportConfig.type === type.id }]"
                @click="selectReportType(type.id)"
              >
                <div class="type-icon">{{ type.icon }}</div>
                <h5>{{ type.name }}</h5>
                <p>{{ type.description }}</p>
                <div v-if="type.availability === 'future'" class="coming-soon-badge">Coming Soon</div>
              </div>
            </div>
          </div>

          <!-- Step 2: Configuration -->
          <div v-if="currentStep === 1" class="configuration-step">
            <h4>Configure Comparison</h4>
            
            <!-- Dynamic configuration based on report type -->
            <div class="config-section">
              <!-- Cycle vs Cycle -->
              <div v-if="reportConfig.type === 'cycle_vs_cycle'" class="config-group">
                <label>Select Two Cycles to Compare:</label>
                <div class="dual-select">
                  <select v-model="reportConfig.cycle1" class="form-select">
                    <option value="">Cycle 1</option>
                    <option value="1">Cycle 1</option>
                    <option value="2">Cycle 2</option>
                    <option value="3" v-if="hasCycle3Data">Cycle 3</option>
                  </select>
                  <span class="vs-text">vs</span>
                  <select v-model="reportConfig.cycle2" class="form-select">
                    <option value="">Cycle 2</option>
                    <option value="1">Cycle 1</option>
                    <option value="2">Cycle 2</option>
                    <option value="3" v-if="hasCycle3Data">Cycle 3</option>
                  </select>
                </div>
              </div>

              <!-- Year Group vs Year Group -->
              <div v-if="reportConfig.type === 'year_group_vs_year_group'" class="config-group">
                <label>Select Two Year Groups to Compare:</label>
                <div class="dual-select">
                  <select v-model="reportConfig.yearGroup1" class="form-select">
                    <option value="">Select Year Group</option>
                    <option v-for="yg in availableYearGroups" :key="yg" :value="yg">Year {{ yg }}</option>
                  </select>
                  <span class="vs-text">vs</span>
                  <select v-model="reportConfig.yearGroup2" class="form-select">
                    <option value="">Select Year Group</option>
                    <option v-for="yg in availableYearGroups" :key="yg" :value="yg">Year {{ yg }}</option>
                  </select>
                </div>
              </div>

              <!-- Group vs Group -->
              <div v-if="reportConfig.type === 'group_vs_group'" class="config-group">
                <label>Select Cycle:</label>
                <select v-model="reportConfig.cycle" class="form-select">
                  <option value="1">Cycle 1</option>
                  <option value="2">Cycle 2</option>
                  <option value="3" v-if="hasCycle3Data">Cycle 3</option>
                </select>
                
                <label class="mt-3">Select Groups to Compare (up to 4):</label>
                <div class="checkbox-grid">
                  <label v-for="group in availableGroups" :key="group" class="checkbox-item">
                    <input 
                      type="checkbox" 
                      :value="group"
                      v-model="reportConfig.selectedGroups"
                      :disabled="reportConfig.selectedGroups.length >= 4 && !reportConfig.selectedGroups.includes(group)"
                    >
                    {{ group }}
                  </label>
                </div>
              </div>

              <!-- Progress Report -->
              <div v-if="reportConfig.type === 'progress'" class="config-group">
                <label>Select Group Type:</label>
                <div class="radio-group">
                  <label>
                    <input type="radio" v-model="reportConfig.progressType" value="year_group">
                    Year Group
                  </label>
                  <label>
                    <input type="radio" v-model="reportConfig.progressType" value="group">
                    Group
                  </label>
                </div>
                
                <label class="mt-3">Select Specific {{ reportConfig.progressType === 'year_group' ? 'Year Group' : 'Group' }}:</label>
                <select v-model="reportConfig.progressGroup" class="form-select">
                  <option value="">Select...</option>
                  <option v-for="item in (reportConfig.progressType === 'year_group' ? availableYearGroups : availableGroups)" 
                          :key="item" :value="item">
                    {{ reportConfig.progressType === 'year_group' ? 'Year ' + item : item }}
                  </option>
                </select>
              </div>

              <!-- Hybrid -->
              <div v-if="reportConfig.type === 'hybrid'" class="config-group">
                <label>Primary Comparison - Select Two Cycles:</label>
                <div class="dual-select">
                  <select v-model="reportConfig.cycle1" class="form-select">
                    <option value="1">Cycle 1</option>
                    <option value="2">Cycle 2</option>
                    <option value="3" v-if="hasCycle3Data">Cycle 3</option>
                  </select>
                  <span class="vs-text">vs</span>
                  <select v-model="reportConfig.cycle2" class="form-select">
                    <option value="1">Cycle 1</option>
                    <option value="2">Cycle 2</option>
                    <option value="3" v-if="hasCycle3Data">Cycle 3</option>
                  </select>
                </div>
                
                <label class="mt-3">Secondary Dimension:</label>
                <select v-model="reportConfig.hybridDimension" class="form-select">
                  <option value="year_group">Year Group Comparison</option>
                  <option value="group">Group Comparison</option>
                </select>
                
                <div v-if="reportConfig.hybridDimension" class="mt-3">
                  <label>Select Items to Compare:</label>
                  <div class="dual-select">
                    <select v-model="reportConfig.hybridItem1" class="form-select">
                      <option value="">Select...</option>
                      <option v-for="item in (reportConfig.hybridDimension === 'year_group' ? availableYearGroups : availableGroups)" 
                              :key="item" :value="item">
                        {{ reportConfig.hybridDimension === 'year_group' ? 'Year ' + item : item }}
                      </option>
                    </select>
                    <span class="vs-text">vs</span>
                    <select v-model="reportConfig.hybridItem2" class="form-select">
                      <option value="">Select...</option>
                      <option v-for="item in (reportConfig.hybridDimension === 'year_group' ? availableYearGroups : availableGroups)" 
                              :key="item" :value="item">
                        {{ reportConfig.hybridDimension === 'year_group' ? 'Year ' + item : item }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Context & Scope -->
          <div v-if="currentStep === 2" class="context-step">
            <h4>Provide Context for AI Analysis</h4>
            <p class="info-text">Help the AI understand your specific needs and concerns to generate more relevant insights.</p>
            
            <div class="context-section">
              <div class="form-group">
                <label>Background & Scope</label>
                <textarea 
                  v-model="reportConfig.organizationalContext"
                  placeholder="E.g., 'We expected Year 13 students to show more exam confidence and academic momentum as they approach their exams, but the data shows the opposite. We're particularly concerned about the decline in effort and practice scores.'"
                  rows="4"
                  class="context-textarea"
                ></textarea>
                <span class="field-hint">Describe your expectations, concerns, or specific areas of focus</span>
              </div>
              
              <div class="form-group">
                <label>Specific Questions to Address</label>
                <textarea 
                  v-model="reportConfig.specificQuestions"
                  placeholder="E.g., 'Why might Year 13 students be showing lower engagement? What interventions could help improve practice scores? Are there patterns in the timing of these declines?'"
                  rows="3"
                  class="context-textarea"
                ></textarea>
                <span class="field-hint">List any specific questions you want the analysis to answer</span>
              </div>
              
              <div class="form-group">
                <label>Historical Context (Optional)</label>
                <textarea 
                  v-model="reportConfig.historicalContext"
                  placeholder="E.g., 'Last year we implemented a new mentoring program. We've recently changed our assessment schedule. There have been staffing changes in key departments.'"
                  rows="3"
                  class="context-textarea"
                ></textarea>
                <span class="field-hint">Mention any recent changes or historical factors that might be relevant</span>
              </div>
            </div>
          </div>

          <!-- Step 4: Visualizations -->
          <div v-if="currentStep === 3" class="visualization-step">
            <h4>Select Report Components</h4>
            <p class="info-text">VESPA charts and Radar chart are always included</p>
            
            <div class="visualization-options">
              <label class="viz-option">
                <input type="checkbox" v-model="reportConfig.includeDistributions">
                <span class="viz-label">
                  <span class="viz-icon">📊</span>
                  Distribution Charts
                  <span class="viz-desc">Score distribution histograms for each VESPA element</span>
                </span>
              </label>
              
              <label class="viz-option">
                <input type="checkbox" v-model="reportConfig.includeTopBottom">
                <span class="viz-label">
                  <span class="viz-icon">🎯</span>
                  Top/Bottom Questions
                  <span class="viz-desc">Highest and lowest scoring questions</span>
                </span>
              </label>
              
              <label class="viz-option">
                <input type="checkbox" v-model="reportConfig.includeInsights">
                <span class="viz-label">
                  <span class="viz-icon">💡</span>
                  12 Psychometric Insights
                  <span class="viz-desc">AI-analyzed questionnaire insights</span>
                </span>
              </label>
              
              <label class="viz-option">
                <input type="checkbox" v-model="reportConfig.includeWordCloud">
                <span class="viz-label">
                  <span class="viz-icon">☁️</span>
                  Word Cloud
                  <span class="viz-desc">Student comment analysis visualization</span>
                </span>
              </label>
              
              <label class="viz-option">
                <input type="checkbox" v-model="reportConfig.includeHeatmap">
                <span class="viz-label">
                  <span class="viz-icon">🔥</span>
                  Question Heatmap
                  <span class="viz-desc">Cycle comparison heatmap for all questions</span>
                </span>
              </label>
            </div>

            <!-- Save Configuration Option -->
            <div class="save-config-section">
              <label class="save-option">
                <input type="checkbox" v-model="saveConfiguration">
                <span>Save this configuration for future use</span>
              </label>
              <input 
                v-if="saveConfiguration" 
                v-model="configurationName"
                type="text" 
                placeholder="Configuration name..."
                class="form-input mt-2"
              >
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="wizard-footer">
          <button 
            v-if="currentStep > 0"
            @click="currentStep--"
            class="btn-secondary"
          >
            Back
          </button>
          
          <div class="spacer"></div>

          <button 
            v-if="currentStep < steps.length - 1"
            @click="nextStep"
            :disabled="!canProceed"
            class="btn-primary"
          >
            Next
          </button>

          <button 
            v-if="currentStep === steps.length - 1"
            @click="generateReport"
            :disabled="!canGenerate || generating"
            class="btn-generate"
          >
            <span v-if="!generating">Generate Report</span>
            <span v-else>
              <span class="spinner"></span>
              Generating...
            </span>
          </button>
        </div>
      </div>

      <!-- Generation Progress -->
      <div v-if="generating" class="generation-overlay">
        <div class="generation-modal">
          <div class="generation-content">
            <div class="spinner-large"></div>
            <h3>Generating Your Report</h3>
            <p>{{ generationStatus }}</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: generationProgress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
    
    <!-- Report Viewer Modal -->
    <ReportViewer
      v-if="showReportViewer"
      :show="showReportViewer"
      :html-content="generatedHtml"
      :report-data="reportData"
      :report-insights="reportInsights"
      @close="closeReportViewer"
      @exported="handleExported"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDashboardStore } from '../../stores/dashboard'
import Modal from '../common/Modal.vue'
import ReportViewer from './ReportViewer.vue'
import { API } from '../../services/api'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'report-generated'])

const store = useDashboardStore()

// Wizard state
const currentStep = ref(0)
const generating = ref(false)
const generationStatus = ref('')
const generationProgress = ref(0)

// Report viewer state
const showReportViewer = ref(false)
const generatedHtml = ref('')
const reportData = ref({})
const reportInsights = ref({})

// Configuration saving
const saveConfiguration = ref(false)
const configurationName = ref('')

// Steps configuration (simplified to 3)
const steps = [
  { id: 'type', label: 'Report Type' },
  { id: 'configure', label: 'Configure' },
  { id: 'context', label: 'Context & Scope' },
  { id: 'visualize', label: 'Visualizations' }
]

// Report configuration
const reportConfig = ref({
  type: '',
  // Cycle comparisons
  cycle1: '',
  cycle2: '',
  cycle: '1',
  // Year group comparisons
  yearGroup1: '',
  yearGroup2: '',
  // Group comparisons
  selectedGroups: [],
  // Progress report
  progressType: 'year_group',
  progressGroup: '',
  // Hybrid
  hybridDimension: '',
  hybridItem1: '',
  hybridItem2: '',
  // Context for AI insights
  organizationalContext: '',
  specificQuestions: '',
  historicalContext: '',
  // Visualizations
  includeDistributions: true,
  includeTopBottom: true,
  includeInsights: true,
  includeWordCloud: false,
  includeHeatmap: true
})

// Report types with better descriptions
const reportTypes = [
  {
    id: 'cycle_vs_cycle',
    name: 'Cycle Comparison',
    icon: '🔄',
    description: 'Compare performance across 2 assessment cycles',
    availability: 'available'
  },
  {
    id: 'year_group_vs_year_group',
    name: 'Year Group Comparison',
    icon: '📚',
    description: 'Compare different year groups',
    availability: 'available'
  },
  {
    id: 'academic_year_vs_academic_year',
    name: 'Academic Year Comparison',
    icon: '📅',
    description: 'Compare across academic years',
    availability: 'future'
  },
  {
    id: 'group_vs_group',
    name: 'Group Comparison',
    icon: '👥',
    description: 'Compare up to 4 groups within a single cycle',
    availability: 'available'
  },
  {
    id: 'progress',
    name: 'Progress Report',
    icon: '📈',
    description: 'Track one group\'s journey over 3 cycles',
    availability: 'available'
  },
  {
    id: 'hybrid',
    name: 'Hybrid Analysis',
    icon: '🔀',
    description: 'Cycle comparison with additional dimension',
    availability: 'available'
  }
]

// Available data (populated from store)
const availableYearGroups = ref([])
const availableGroups = ref([])
const hasCycle3Data = ref(false)

// Load available options from store
onMounted(async () => {
  console.log('[ComparativeReportModal] Component mounted')
  
  // Get establishment ID
  const establishmentId = store.selectedEstablishment || store.staffAdminEstablishmentId
  console.log('[ComparativeReportModal] Using establishment ID:', establishmentId)
  
  // Load year groups
  try {
    const response = await API.getYearGroups(establishmentId)
    const years = Array.isArray(response) ? response : (response?.data || [])
    availableYearGroups.value = years
    console.log('[ComparativeReportModal] Year groups fetched:', availableYearGroups.value)
  } catch (error) {
    console.error('[ComparativeReportModal] Failed to fetch year groups:', error)
    availableYearGroups.value = []
  }
  
  // Load groups
  try {
    const groupsResponse = await API.getGroups(establishmentId)
    const groups = Array.isArray(groupsResponse) ? groupsResponse : (groupsResponse?.data || [])
    availableGroups.value = groups
    console.log('[ComparativeReportModal] Groups fetched:', availableGroups.value)
  } catch (error) {
    console.error('[ComparativeReportModal] Failed to load groups:', error)
    availableGroups.value = []
  }
  
  // Check if Cycle 3 data exists - for now assume it doesn't unless we have evidence
  // TODO: Check actual data to determine if Cycle 3 exists
  hasCycle3Data.value = false
})

// Computed properties
const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return reportConfig.value.type !== '' && 
           reportTypes.find(t => t.id === reportConfig.value.type)?.availability === 'available'
  }
  
  if (currentStep.value === 1) {
    switch (reportConfig.value.type) {
      case 'cycle_vs_cycle':
        return reportConfig.value.cycle1 && reportConfig.value.cycle2 && 
               reportConfig.value.cycle1 !== reportConfig.value.cycle2
      case 'year_group_vs_year_group':
        return reportConfig.value.yearGroup1 && reportConfig.value.yearGroup2 && 
               reportConfig.value.yearGroup1 !== reportConfig.value.yearGroup2
      case 'group_vs_group':
        return reportConfig.value.selectedGroups.length >= 2 && 
               reportConfig.value.selectedGroups.length <= 4
      case 'progress':
        return reportConfig.value.progressGroup !== ''
      case 'hybrid':
        return reportConfig.value.cycle1 && reportConfig.value.cycle2 && 
               reportConfig.value.cycle1 !== reportConfig.value.cycle2 &&
               reportConfig.value.hybridItem1 && reportConfig.value.hybridItem2 &&
               reportConfig.value.hybridItem1 !== reportConfig.value.hybridItem2
      default:
        return false
    }
  }
  
  return true
})

const canGenerate = computed(() => {
  return canProceed.value
})

// Methods
const selectReportType = (type) => {
  const reportType = reportTypes.find(t => t.id === type)
  if (reportType?.availability === 'available') {
    reportConfig.value.type = type
    console.log('[ComparativeReportModal] Selected report type:', type)
  }
}

const nextStep = () => {
  if (canProceed.value) {
    currentStep.value++
    console.log('[ComparativeReportModal] Moving to step:', currentStep.value)
  }
}

const handleClose = () => {
  currentStep.value = 0
  reportConfig.value.type = ''
  emit('close')
}

const closeReportViewer = () => {
  showReportViewer.value = false
  currentStep.value = 0
  handleClose()
}

const handleExported = (exportInfo) => {
  console.log('[ComparativeReportModal] Report exported:', exportInfo)
}

const generateReport = async () => {
  generating.value = true
  generationProgress.value = 0
  generationStatus.value = 'Initializing report generation...'

  try {
    // Update progress
    generationProgress.value = 20
    generationStatus.value = 'Preparing data...'

    // Prepare request data based on report type
      // Get establishment info - selectedEstablishment is the ID itself, not an object
  const establishmentId = store.selectedEstablishment || store.staffAdminEstablishmentId
  
  // Get establishment name from the store's loaded data
  const establishmentName = store.statistics?.establishment_name || 
                           store.staffData?.establishment_name || 
                           'Unknown School'
  
  console.log('[ComparativeReportModal] Establishment info:', {
    establishmentId,
    establishmentName,
    selectedEstablishment: store.selectedEstablishment,
    staffAdminEstablishmentId: store.staffAdminEstablishmentId,
    statistics: store.statistics
  })
  
    const requestData = {
    establishmentId,
    establishmentName,
    reportType: reportConfig.value.type,
    config: {
      ...reportConfig.value,
      establishmentLogoUrl: '', // Can be added later
      primaryColor: '#667eea'
    },
        filters: store.filters,
    data: {
      statistics: store.dashboardData?.statistics || {},
      qlaData: store.dashboardData?.qlaData || {},
      wordCloudData: store.dashboardData?.wordCloudData || {},
      commentInsights: store.dashboardData?.commentInsights || {}
      }
    }

    console.log('[ComparativeReportModal] Sending report request:', requestData)

    // Call API
    generationProgress.value = 40
    generationStatus.value = 'Generating report...'

    const response = await API.generateComparativeReport(requestData)
    
    console.log('[ComparativeReportModal] API Response received:', response)

    generationProgress.value = 80
    generationStatus.value = 'Finalizing...'

    // Handle response
    if (response.data && response.data.success) {
      generationProgress.value = 100
      generationStatus.value = 'Opening report viewer...'

      // Store the generated content
      generatedHtml.value = response.data.html || '<!DOCTYPE html><html><body><h1>Report Generated</h1></body></html>'
      reportData.value = response.data.data || {}
      reportInsights.value = response.data.insights || {}
      
      console.log('[ComparativeReportModal] Report content stored, HTML length:', generatedHtml.value.length)

      // Save configuration if requested
      if (saveConfiguration.value && configurationName.value) {
        saveReportConfiguration()
      }

      // Hide generation overlay and show report viewer
      setTimeout(() => {
        generating.value = false
        showReportViewer.value = true
        console.log('[ComparativeReportModal] Showing report viewer')
      }, 500)

      // Emit success event
      emit('report-generated', { 
        type: reportConfig.value.type,
        timestamp: new Date(),
        data: response.data.data,
        insights: response.data.insights
      })
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('[ComparativeReportModal] Failed to generate report:', error)
    generationStatus.value = 'Failed to generate report. Please try again.'
    generationProgress.value = 0
    
    setTimeout(() => {
      generating.value = false
    }, 3000)
  }
}

const saveReportConfiguration = () => {
  // Save to localStorage for now, could be saved to backend later
  const savedConfigs = JSON.parse(localStorage.getItem('reportConfigurations') || '[]')
  savedConfigs.push({
    name: configurationName.value,
    config: { ...reportConfig.value },
    timestamp: new Date().toISOString()
  })
  localStorage.setItem('reportConfigurations', JSON.stringify(savedConfigs))
  console.log('[ComparativeReportModal] Configuration saved:', configurationName.value)
}
</script>

<style scoped>
.comparative-report-modal :deep(.modal-container) {
  max-width: 900px;
  width: 90%;
  max-height: 85vh;
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.super-user-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.wizard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.progress-steps {
  display: flex;
  justify-content: space-around;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.step.active,
.step.completed {
  opacity: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.3s;
}

.step.active .step-number {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.step.completed .step-number {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.step-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.step-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* Report Type Selection */
.report-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.report-type-card {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.report-type-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
}

.report-type-card.selected {
  background: rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.type-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.report-type-card h5 {
  margin: 0.5rem 0;
  color: white;
}

.report-type-card p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.coming-soon-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #f59e0b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* Configuration Step */
.config-section {
  margin-top: 1rem;
}

.config-group {
  margin-bottom: 1.5rem;
}

.config-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.form-select option {
  background: #2a3c7a;
  color: white;
}

.dual-select {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.vs-text {
  color: #667eea;
  font-weight: 600;
  font-size: 1.2rem;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
}

.radio-group {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Visualization Step */
.visualization-options {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.viz-option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.viz-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.viz-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.viz-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.viz-desc {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 2rem;
}

.info-text {
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  margin-bottom: 1rem;
}

.save-config-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.save-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Context Step Styles */
.context-step {
  padding: 1rem;
}

.context-step h4 {
  color: white;
  margin-bottom: 0.5rem;
}

.context-section {
  margin-top: 1.5rem;
}

.context-section .form-group {
  margin-bottom: 1.5rem;
}

.context-section label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.context-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  transition: all 0.2s;
}

.context-textarea:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.context-textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
}

.field-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

/* Footer */
.wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.spacer {
  flex: 1;
}

.btn-primary,
.btn-secondary,
.btn-generate {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary,
.btn-generate {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled),
.btn-generate:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-primary:disabled,
.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Generation Overlay */
.generation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.generation-modal {
  background: #2a3c7a;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  max-width: 400px;
}

.generation-content h3 {
  color: white;
  margin-bottom: 1rem;
}

.generation-content p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

.spinner,
.spinner-large {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-large {
  width: 50px;
  height: 50px;
  margin-bottom: 1.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
</style>