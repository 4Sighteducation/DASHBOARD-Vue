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
      <!-- Progress Steps -->
      <div class="progress-steps">
        <div 
          v-for="(step, index) in steps" 
          :key="step.id"
          :class="['step', { 
            active: currentStep === index,
            completed: currentStep > index 
          }]"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-label">{{ step.label }}</div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="step-content">
        <transition name="slide-fade" mode="out-in">
          <!-- Step 1: Report Type -->
          <div v-if="currentStep === 0" key="step1" class="step-panel">
            <h4>Select Report Type</h4>
            <p class="step-description">Choose the type of comparison you want to analyze</p>
            
            <div class="report-types">
              <div 
                v-for="type in reportTypes" 
                :key="type.id"
                :class="['report-type-card', { selected: reportConfig.type === type.id }]"
                @click="selectReportType(type.id)"
              >
                <div class="type-icon">{{ type.icon }}</div>
                <div class="type-content">
                  <h5>{{ type.title }}</h5>
                  <p>{{ type.description }}</p>
                </div>
                <div class="type-examples">
                  <span class="example-label">Examples:</span>
                  <ul>
                    <li v-for="example in type.examples" :key="example">{{ example }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Variables Selection -->
          <div v-if="currentStep === 1" key="step2" class="step-panel">
            <h4>{{ variableStepTitle }}</h4>
            <p class="step-description">{{ variableStepDescription }}</p>

            <!-- Cycle Comparison -->
            <div v-if="reportConfig.type === 'cycle_progression'" class="variable-selection">
              <div class="selection-group">
                <label>Select Cycles to Compare</label>
                <div class="cycle-checkboxes">
                  <label v-for="cycle in [1, 2, 3]" :key="cycle" class="checkbox-label">
                    <input 
                      type="checkbox" 
                      :value="cycle"
                      v-model="reportConfig.cycles"
                      :disabled="reportConfig.cycles.length >= 2 && !reportConfig.cycles.includes(cycle)"
                    />
                    <span>Cycle {{ cycle }}</span>
                  </label>
                </div>
                <p class="help-text">Select 2 or more cycles to compare</p>
              </div>
            </div>

            <!-- Group Comparison -->
            <div v-if="reportConfig.type === 'group_comparison'" class="variable-selection">
              <div class="selection-group">
                <label>Comparison Dimension</label>
                <select v-model="reportConfig.groupDimension" class="form-select">
                  <option value="">Select dimension...</option>
                  <option value="year_group">Year Group</option>
                  <option value="faculty">Faculty</option>
                  <option value="gender">Gender</option>
                  <option value="fsm">FSM Status</option>
                  <option value="eal">EAL Status</option>
                </select>
              </div>

              <div v-if="reportConfig.groupDimension" class="selection-group">
                <label>Select Groups to Compare</label>
                <div class="group-selection">
                  <div v-for="group in availableGroups" :key="group.value" class="group-option">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :value="group.value"
                        v-model="reportConfig.groups"
                      />
                      <span>{{ group.label }}</span>
                      <span class="count">({{ group.count }} students)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Benchmark Comparison -->
            <div v-if="reportConfig.type === 'benchmark'" class="variable-selection">
              <div class="selection-group">
                <label>Benchmark Against</label>
                <div class="benchmark-options">
                  <label class="radio-label">
                    <input type="radio" value="national" v-model="reportConfig.benchmarkType" />
                    <span>National Average</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" value="trust" v-model="reportConfig.benchmarkType" />
                    <span>Trust Average</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" value="similar" v-model="reportConfig.benchmarkType" />
                    <span>Similar Schools</span>
                  </label>
                </div>
              </div>

              <div class="selection-group">
                <label>Time Period</label>
                <select v-model="reportConfig.benchmarkCycle" class="form-select">
                  <option :value="1">Cycle 1</option>
                  <option :value="2">Cycle 2</option>
                  <option :value="3">Cycle 3</option>
                  <option value="all">All Cycles</option>
                </select>
              </div>
            </div>

            <!-- Custom Comparison -->
            <div v-if="reportConfig.type === 'custom'" class="variable-selection">
              <div class="custom-builder">
                <p>Build your own comparison by selecting multiple variables</p>
                <!-- Custom comparison builder UI -->
              </div>
            </div>
          </div>

          <!-- Step 3: Metrics Selection -->
          <div v-if="currentStep === 2" key="step3" class="step-panel">
            <h4>Select Metrics to Include</h4>
            <p class="step-description">Choose which metrics to analyze in your report</p>

            <div class="metrics-selection">
              <div class="metric-category">
                <h5>VESPA Scores</h5>
                <div class="metric-options">
                  <label v-for="metric in vespaMetrics" :key="metric.id" class="checkbox-label">
                    <input type="checkbox" v-model="reportConfig.metrics" :value="metric.id" />
                    <span>{{ metric.label }}</span>
                  </label>
                </div>
              </div>

              <div class="metric-category">
                <h5>Additional Analytics</h5>
                <div class="metric-options">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportConfig.includeERI" />
                    <span>ERI Score Analysis</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportConfig.includeQLA" />
                    <span>Top/Bottom Questions</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportConfig.includeThemes" />
                    <span>Comment Themes</span>
                  </label>
                </div>
              </div>

              <div class="metric-category">
                <h5>Statistical Analysis</h5>
                <div class="metric-options">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportConfig.includeStatistics" />
                    <span>Statistical Significance Tests</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportConfig.includeEffectSize" />
                    <span>Effect Size (Cohen's d)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Context & Narrative -->
          <div v-if="currentStep === 3" key="step4" class="step-panel">
            <h4>Organizational Context</h4>
            <p class="step-description">Provide context to help AI generate meaningful insights</p>

            <div class="context-section">
              <div class="context-group">
                <label>Context/Scope (Optional but Recommended)</label>
                <textarea 
                  v-model="reportConfig.organizationalContext"
                  class="context-textarea"
                  placeholder="Example: We are comparing Year 12 and Year 13 students. We expected Year 13 to show higher confidence and readiness for exams given their additional year of preparation. Initial observations suggest this may not be the case. We're particularly interested in understanding factors that might explain any unexpected patterns in the data."
                  rows="6"
                ></textarea>
                <p class="help-text">Provide narrative about your organization, expected outcomes, concerns, or specific areas of focus. This helps the AI generate more relevant and actionable insights.</p>
              </div>

              <div class="context-group">
                <label>Specific Questions for AI Analysis (Optional)</label>
                <textarea 
                  v-model="reportConfig.specificQuestions"
                  class="context-textarea"
                  placeholder="Example:
- Why might Year 13 students show lower confidence than Year 12?
- What factors could explain the decline in Systems scores?
- Are there patterns that suggest intervention opportunities?"
                  rows="4"
                ></textarea>
                <p class="help-text">List specific questions you want the AI to address in its analysis.</p>
              </div>

              <div class="context-group">
                <label>Historical Context (Optional)</label>
                <input 
                  type="text"
                  v-model="reportConfig.historicalContext"
                  class="form-input"
                  placeholder="e.g., Post-COVID cohort, new curriculum implementation, etc."
                />
                <p class="help-text">Any relevant historical or situational factors affecting this cohort.</p>
              </div>
            </div>
          </div>

          <!-- Step 5: Visualization Options -->
          <div v-if="currentStep === 4" key="step5" class="step-panel">
            <h4>Visualization & Branding</h4>
            <p class="step-description">Customize the appearance of your report</p>

            <div class="viz-options">
              <div class="viz-category">
                <h5>Report Branding</h5>
                <div class="branding-options">
                  <div class="logo-upload-section">
                    <label>Establishment Logo URL (Optional)</label>
                    <div class="logo-input-group">
                      <input 
                        type="url"
                        v-model="reportConfig.establishmentLogoUrl"
                        class="form-input"
                        placeholder="https://example.com/logo.png"
                      />
                      <button 
                        v-if="reportConfig.establishmentLogoUrl"
                        @click="previewLogo"
                        class="btn-preview"
                        type="button"
                      >
                        Preview
                      </button>
                    </div>
                    <p class="help-text">Provide a URL to your establishment's logo for the report header</p>
                    
                    <div v-if="logoPreview" class="logo-preview">
                      <img :src="reportConfig.establishmentLogoUrl" alt="Establishment Logo" @error="handleLogoError" />
                      <img :src="vespaLogoUrl" alt="VESPA Logo" />
                    </div>
                  </div>
                  
                  <div class="color-scheme">
                    <label>Primary Color (Optional)</label>
                    <input 
                      type="color"
                      v-model="reportConfig.primaryColor"
                      class="color-input"
                    />
                    <p class="help-text">Customize the primary color for charts and headings</p>
                  </div>
                </div>
              </div>

              <div class="viz-category">
                <h5>Chart Types</h5>
                <div class="chart-options">
                  <label v-for="chart in chartTypes" :key="chart.id" class="checkbox-label">
                    <input type="checkbox" v-model="reportConfig.charts" :value="chart.id" />
                    <span>{{ chart.label }}</span>
                  </label>
                </div>
              </div>

              <div class="viz-category">
                <h5>Report Format</h5>
                <div class="format-options">
                  <label class="radio-label">
                    <input type="radio" value="detailed" v-model="reportConfig.format" />
                    <span>Detailed Report (All data & insights)</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" value="executive" v-model="reportConfig.format" />
                    <span>Executive Summary (Key findings only)</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" value="ai_enhanced" v-model="reportConfig.format" />
                    <span>AI-Enhanced Report (Context-aware insights)</span>
                  </label>
                </div>
              </div>

              <div class="viz-category">
                <h5>Export Options</h5>
                <div class="export-options">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportConfig.includePDF" checked disabled />
                    <span>PDF Report (Default)</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportConfig.includeExcel" />
                    <span>Excel Data Export</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportConfig.includePowerPoint" />
                    <span>PowerPoint Presentation</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 6: Review & Generate -->
          <div v-if="currentStep === 5" key="step6" class="step-panel">
            <h4>Review Your Report Configuration</h4>
            <p class="step-description">Confirm your selections before generating the report</p>

            <div class="review-summary">
              <div class="summary-section">
                <h5>Report Type</h5>
                <p>{{ getReportTypeLabel(reportConfig.type) }}</p>
              </div>

              <div class="summary-section">
                <h5>Comparison Variables</h5>
                <ul>
                  <li v-for="variable in getSelectedVariables()" :key="variable">
                    {{ variable }}
                  </li>
                </ul>
              </div>

              <div class="summary-section">
                <h5>Selected Metrics</h5>
                <ul>
                  <li v-for="metric in getSelectedMetrics()" :key="metric">
                    {{ metric }}
                  </li>
                </ul>
              </div>

              <div v-if="reportConfig.organizationalContext || reportConfig.specificQuestions" class="summary-section">
                <h5>Organizational Context</h5>
                <p v-if="reportConfig.organizationalContext" class="context-preview">
                  {{ reportConfig.organizationalContext.substring(0, 150) }}{{ reportConfig.organizationalContext.length > 150 ? '...' : '' }}
                </p>
                <p v-if="reportConfig.specificQuestions" class="questions-count">
                  <em>{{ reportConfig.specificQuestions.split('\n').filter(q => q.trim()).length }} specific questions for AI analysis</em>
                </p>
              </div>

              <div class="summary-section">
                <h5>Report Settings</h5>
                <ul>
                  <li>Format: {{ reportConfig.format === 'ai_enhanced' ? 'AI-Enhanced' : reportConfig.format }}</li>
                  <li v-if="reportConfig.establishmentLogoUrl">Custom logo included</li>
                  <li>Charts: {{ getSelectedCharts().join(', ') }}</li>
                </ul>
              </div>

              <div class="estimated-time">
                <svg class="time-icon" width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                </svg>
                <span>Estimated generation time: {{ estimatedTime }} seconds</span>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Navigation Buttons -->
      <div class="wizard-footer">
        <button 
          v-if="currentStep > 0" 
          @click="previousStep"
          class="btn-secondary"
        >
          Previous
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
import { ref, computed, watch } from 'vue'
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

// Steps configuration
const steps = [
  { id: 'type', label: 'Report Type' },
  { id: 'variables', label: 'Variables' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'context', label: 'Context' },
  { id: 'visualization', label: 'Visualization' },
  { id: 'review', label: 'Review' }
]

// Report configuration
const reportConfig = ref({
  type: '',
  cycles: [],
  groupDimension: '',
  groups: [],
  benchmarkType: 'national',
  benchmarkCycle: 1,
  metrics: ['overall'],
  includeERI: false,
  includeQLA: false,
  includeThemes: false,
  includeStatistics: false,
  includeEffectSize: false,
  // Context fields
  organizationalContext: '',
  specificQuestions: '',
  historicalContext: '',
  // Branding fields
  establishmentLogoUrl: '',
  primaryColor: '#667eea',
  // Visualization
  charts: ['bar'],
  format: 'detailed',
  includePDF: true,
  includeExcel: false,
  includePowerPoint: false
})

// VESPA logo URL from the search results
const vespaLogoUrl = ref('https://vespa.academy/_astro/vespalogo.BGrK1ARl.png')
const logoPreview = ref(false)

// Report types
const reportTypes = [
  {
    id: 'cycle_progression',
    title: 'Cycle Progression Analysis',
    description: 'Track changes in performance across multiple cycles',
    icon: '📈',
    examples: ['Cycle 1 vs Cycle 3', 'Term-on-term progress', 'Annual trends']
  },
  {
    id: 'group_comparison',
    title: 'Group Comparison',
    description: 'Compare performance between different student groups',
    icon: '👥',
    examples: ['Year groups', 'Gender analysis', 'Faculty comparison']
  },
  {
    id: 'benchmark',
    title: 'Benchmark Analysis',
    description: 'Compare your school against external benchmarks',
    icon: '🎯',
    examples: ['School vs National', 'Trust comparison', 'Similar schools']
  },
  {
    id: 'custom',
    title: 'Custom Report',
    description: 'Build a tailored comparison with multiple variables',
    icon: '⚙️',
    examples: ['Multi-dimensional analysis', 'Complex filters', 'Custom metrics']
  }
]

// VESPA metrics
const vespaMetrics = [
  { id: 'overall', label: 'Overall Score' },
  { id: 'vision', label: 'Vision' },
  { id: 'effort', label: 'Effort' },
  { id: 'systems', label: 'Systems' },
  { id: 'practice', label: 'Practice' },
  { id: 'attitude', label: 'Attitude' }
]

// Chart types
const chartTypes = [
  { id: 'bar', label: 'Bar Chart' },
  { id: 'line', label: 'Line Graph' },
  { id: 'radar', label: 'Radar Chart' },
  { id: 'heatmap', label: 'Heat Map' },
  { id: 'box', label: 'Box Plot' }
]

// Computed properties
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return reportConfig.value.type !== ''
    case 1:
      if (reportConfig.value.type === 'cycle_progression') {
        return reportConfig.value.cycles.length >= 2
      }
      if (reportConfig.value.type === 'group_comparison') {
        return reportConfig.value.groupDimension && reportConfig.value.groups.length >= 2
      }
      return true
    case 2:
      return reportConfig.value.metrics.length > 0
    case 3:
      return reportConfig.value.charts.length > 0
    default:
      return true
  }
})

const canGenerate = computed(() => {
  return canProceed.value && currentStep.value === steps.length - 1
})

const estimatedTime = computed(() => {
  let time = 10 // Base time
  time += reportConfig.value.metrics.length * 2
  time += reportConfig.value.charts.length * 3
  if (reportConfig.value.includeStatistics) time += 5
  if (reportConfig.value.includeThemes) time += 8
  return time
})

const variableStepTitle = computed(() => {
  switch (reportConfig.value.type) {
    case 'cycle_progression':
      return 'Select Cycles to Compare'
    case 'group_comparison':
      return 'Select Groups to Compare'
    case 'benchmark':
      return 'Configure Benchmark Settings'
    case 'custom':
      return 'Build Custom Comparison'
    default:
      return 'Select Variables'
  }
})

const variableStepDescription = computed(() => {
  switch (reportConfig.value.type) {
    case 'cycle_progression':
      return 'Choose which assessment cycles to include in your comparison'
    case 'group_comparison':
      return 'Select the dimension and specific groups to compare'
    case 'benchmark':
      return 'Configure how to benchmark your school\'s performance'
    case 'custom':
      return 'Create a custom comparison with multiple variables'
    default:
      return 'Configure your comparison variables'
  }
})

// Mock data for available groups (would come from API)
const availableGroups = computed(() => {
  if (reportConfig.value.groupDimension === 'year_group') {
    return [
      { value: '7', label: 'Year 7', count: 150 },
      { value: '8', label: 'Year 8', count: 142 },
      { value: '9', label: 'Year 9', count: 138 },
      { value: '10', label: 'Year 10', count: 145 },
      { value: '11', label: 'Year 11', count: 140 }
    ]
  }
  if (reportConfig.value.groupDimension === 'gender') {
    return [
      { value: 'M', label: 'Male', count: 380 },
      { value: 'F', label: 'Female', count: 335 }
    ]
  }
  // Add more group options based on dimension
  return []
})

// Methods
const selectReportType = (type) => {
  reportConfig.value.type = type
}

const nextStep = () => {
  if (canProceed.value && currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const previewLogo = () => {
  logoPreview.value = true
}

const handleLogoError = () => {
  logoPreview.value = false
  alert('Unable to load logo. Please check the URL and ensure it\'s publicly accessible.')
}

const handleClose = () => {
  // Reset wizard
  currentStep.value = 0
  logoPreview.value = false
  reportConfig.value = {
    type: '',
    cycles: [],
    groupDimension: '',
    groups: [],
    benchmarkType: 'national',
    benchmarkCycle: 1,
    metrics: ['overall'],
    includeERI: false,
    includeQLA: false,
    includeThemes: false,
    includeStatistics: false,
    includeEffectSize: false,
    // Context fields
    organizationalContext: '',
    specificQuestions: '',
    historicalContext: '',
    // Branding fields
    establishmentLogoUrl: '',
    primaryColor: '#667eea',
    // Visualization
    charts: ['bar'],
    format: 'detailed',
    includePDF: true,
    includeExcel: false,
    includePowerPoint: false
  }
  emit('close')
}

const getReportTypeLabel = (type) => {
  const reportType = reportTypes.find(t => t.id === type)
  return reportType ? reportType.title : type
}

const getSelectedVariables = () => {
  const variables = []
  if (reportConfig.value.type === 'cycle_progression') {
    variables.push(`Cycles: ${reportConfig.value.cycles.join(', ')}`)
  }
  if (reportConfig.value.type === 'group_comparison') {
    variables.push(`Dimension: ${reportConfig.value.groupDimension}`)
    variables.push(`Groups: ${reportConfig.value.groups.join(', ')}`)
  }
  if (reportConfig.value.type === 'benchmark') {
    variables.push(`Benchmark: ${reportConfig.value.benchmarkType}`)
    variables.push(`Cycle: ${reportConfig.value.benchmarkCycle}`)
  }
  return variables
}

const getSelectedMetrics = () => {
  const metrics = reportConfig.value.metrics.map(m => {
    const metric = vespaMetrics.find(vm => vm.id === m)
    return metric ? metric.label : m
  })
  if (reportConfig.value.includeERI) metrics.push('ERI Score')
  if (reportConfig.value.includeQLA) metrics.push('Question Analysis')
  if (reportConfig.value.includeThemes) metrics.push('Comment Themes')
  if (reportConfig.value.includeStatistics) metrics.push('Statistical Tests')
  return metrics
}

const getSelectedCharts = () => {
  return reportConfig.value.charts.map(c => {
    const chart = chartTypes.find(ct => ct.id === c)
    return chart ? chart.label : c
  })
}

const closeReportViewer = () => {
  showReportViewer.value = false
  // Reset wizard to start
  currentStep.value = 0
  handleClose()
}

const handleExported = (exportInfo) => {
  console.log('Report exported:', exportInfo)
  // Could emit an event or show a notification here
}

const generateReport = async () => {
  generating.value = true
  generationProgress.value = 0
  generationStatus.value = 'Initializing report generation...'

  try {
    // Update progress
    generationProgress.value = 20
    generationStatus.value = 'Fetching comparison data...'

    // Prepare request data
    const requestData = {
      establishmentId: store.selectedEstablishment?.id,
      establishmentName: store.selectedEstablishment?.name || 'Unknown School',
      reportType: reportConfig.value.type,
      config: reportConfig.value,
      filters: store.filters
    }

    // Call API
    generationProgress.value = 40
    generationStatus.value = 'Analyzing data and generating insights...'

    const response = await API.generateComparativeReport(requestData)

    generationProgress.value = 80
    generationStatus.value = 'Preparing downloadable files...'

    // Handle response (show in modal)
    if (response.data && response.data.success) {
      generationProgress.value = 100
      generationStatus.value = 'Opening report editor...'

      // Store the generated content
      generatedHtml.value = response.data.html
      reportData.value = response.data.data || {}
      reportInsights.value = response.data.insights || {}

      // Hide generation overlay and show report viewer
      setTimeout(() => {
        generating.value = false
        showReportViewer.value = true
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
    console.error('Failed to generate report:', error)
    generationStatus.value = 'Failed to generate report. Please try again.'
    generationProgress.value = 0
    
    setTimeout(() => {
      generating.value = false
    }, 3000)
  }
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

.badge-icon {
  flex-shrink: 0;
}

.wizard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  position: relative;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.step.active,
.step.completed {
  opacity: 1;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 18px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.step.completed:not(:last-child)::after {
  background: #60a5fa;
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  z-index: 1;
}

.step.active .step-number {
  background: #60a5fa;
  border-color: #60a5fa;
  color: #0f0f23;
}

.step.completed .step-number {
  background: #34d399;
  border-color: #34d399;
  color: white;
}

.step-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.step.active .step-label,
.step.completed .step-label {
  color: white;
}

.step-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.step-panel h4 {
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 1.25rem;
}

.step-description {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
}

/* Report Type Cards */
.report-types {
  display: grid;
  gap: 1rem;
}

.report-type-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: start;
}

.report-type-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(96, 165, 250, 0.5);
}

.report-type-card.selected {
  background: rgba(96, 165, 250, 0.1);
  border-color: #60a5fa;
}

.type-icon {
  font-size: 2rem;
}

.type-content h5 {
  margin: 0 0 0.5rem 0;
  color: white;
}

.type-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.type-examples {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.example-label {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
}

.type-examples ul {
  margin: 0;
  padding-left: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Variable Selection */
.variable-selection {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.selection-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.selection-group label {
  font-weight: 600;
  color: white;
}

.form-select {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.form-select option {
  background: #1a202c;
}

.cycle-checkboxes,
.group-selection,
.benchmark-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox-label:hover,
.radio-label:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(96, 165, 250, 0.5);
}

.checkbox-label input[type="checkbox"],
.radio-label input[type="radio"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox-label span,
.radio-label span {
  color: white;
  flex: 1;
}

.count {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.help-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  margin: 0;
}

/* Metrics Selection */
.metrics-selection {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.metric-category h5 {
  margin: 0 0 1rem 0;
  color: #60a5fa;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

/* Visualization Options */
.viz-options {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.viz-category h5 {
  margin: 0 0 1rem 0;
  color: #60a5fa;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chart-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.format-options,
.export-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Context Section */
.context-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.context-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.context-group label {
  font-weight: 600;
  color: white;
}

.context-textarea {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
}

.context-textarea:focus {
  outline: none;
  border-color: #60a5fa;
  background: rgba(255, 255, 255, 0.08);
}

.form-input {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #60a5fa;
  background: rgba(255, 255, 255, 0.08);
}

/* Branding Section */
.branding-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.logo-upload-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.logo-input-group {
  display: flex;
  gap: 0.5rem;
}

.logo-input-group .form-input {
  flex: 1;
}

.btn-preview {
  padding: 0.75rem 1rem;
  background: rgba(96, 165, 250, 0.2);
  border: 1px solid #60a5fa;
  border-radius: 8px;
  color: #60a5fa;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preview:hover {
  background: rgba(96, 165, 250, 0.3);
}

.logo-preview {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.logo-preview img {
  max-height: 60px;
  max-width: 200px;
  object-fit: contain;
}

.color-scheme {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-input {
  width: 100px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
}

/* Review Summary */
.review-summary {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.context-preview {
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
  line-height: 1.5;
}

.questions-count {
  color: #60a5fa;
  font-size: 0.9rem;
}

.summary-section {
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.summary-section h5 {
  margin: 0 0 0.5rem 0;
  color: #60a5fa;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-section p,
.summary-section ul {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

.summary-section ul {
  padding-left: 1.25rem;
}

.estimated-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
  color: #60a5fa;
}

.time-icon {
  flex-shrink: 0;
}

/* Footer */
.wizard-footer {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.spacer {
  flex: 1;
}

.btn-secondary,
.btn-primary,
.btn-generate {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  font-size: 1rem;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-primary {
  background: #60a5fa;
  color: #0f0f23;
}

.btn-primary:hover:not(:disabled) {
  background: #3b82f6;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-generate {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-width: 150px;
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

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
  z-index: 2000;
}

.generation-modal {
  background: #1a202c;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.generation-content h3 {
  margin: 1rem 0 0.5rem 0;
  color: white;
}

.generation-content p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1.5rem 0;
}

.spinner-large {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #667eea);
  border-radius: 3px;
  transition: width 0.3s ease;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
