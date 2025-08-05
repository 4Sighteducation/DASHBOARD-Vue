<template>
  <div class="overview-section">
    <!-- Loading State -->
    <div v-if="loading" class="section-loading">
      <div class="spinner"></div>
      <p>Loading overview data...</p>
    </div>

    <!-- Content -->
    <div v-else class="overview-content">
      <!-- Summary Header -->
      <SummaryHeader 
        :data="props.data"
        :current-cycle="currentCycle"
        @cycle-change="handleCycleChange"
      />
      


      <!-- Individual Student Scores (when student is selected) -->
      <div v-if="isStudentSelected" class="student-scores-section">
        <StudentVespaScores
          :vespa-scores="studentVespaScores"
          :national-averages="nationalAverages"
          :cycle="currentCycle"
          :student-name="selectedStudentName"
        />
      </div>

      <!-- VESPA Score Histograms (when showing all students) -->
      <div v-else class="histograms-section">
        <h3 class="section-title">VESPA Score Distributions</h3>
        
        <!-- Top row: Vision, Effort, Systems -->
        <div class="histograms-row">
          <VespaHistogram
            v-for="element in topRowElements"
            :key="element.key"
            :title="element.name"
            :distribution="getDistribution(element.key)"
            :national-average="getNationalAverage(element.key)"
            :national-distribution="getNationalDistribution(element.key)"
            :color="element.color"
            :element-key="element.key"
            :cycle="currentCycle"
            :max-y-value="maxYValue"
          />
        </div>
        
        <!-- Bottom row: Practice, Attitude, Overall -->
        <div class="histograms-row">
          <VespaHistogram
            v-for="element in bottomRowElements"
            :key="element.key"
            :title="element.name"
            :distribution="getDistribution(element.key)"
            :national-average="getNationalAverage(element.key)"
            :national-distribution="getNationalDistribution(element.key)"
            :color="element.color"
            :element-key="element.key"
            :cycle="currentCycle"
            :max-y-value="maxYValue"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDashboardStore } from '../../stores/dashboard'
import SummaryHeader from './SummaryHeader.vue'
import VespaHistogram from './VespaHistogram.vue'
import StudentVespaScores from './StudentVespaScores.vue'

const props = defineProps({
  data: Object,
  filters: Object,
  loading: Boolean
})

const emit = defineEmits(['update-filter'])

// Store
const store = useDashboardStore()

// State
const currentCycle = ref(1)

// Check if a student is selected
const isStudentSelected = computed(() => {
  return store.filters.studentId !== null
})

// Get selected student name
const selectedStudentName = computed(() => {
  return store.filters.studentName || 'Selected Student'
})

// Get individual student VESPA scores
const studentVespaScores = computed(() => {
  if (!isStudentSelected.value || !props.data?.statistics?.vespaScores) {
    return {}
  }
  // When a student is selected, vespaScores should contain their individual scores
  return props.data.statistics.vespaScores
})

// Get national averages for comparison
const nationalAverages = computed(() => {
  if (!props.data?.statistics?.comparison?.national) {
    return {}
  }
  const national = props.data.statistics.comparison.national
  return {
    vision: national[0] || 0,
    effort: national[1] || 0,
    systems: national[2] || 0,
    practice: national[3] || 0,
    attitude: national[4] || 0
  }
})

// Event handlers
const handleCycleChange = (newCycle) => {
  currentCycle.value = newCycle
  emit('update-filter', 'cycle', newCycle)
}

// Computed properties for formatted data
const statistics = computed(() => {
  if (!props.data?.statistics) return []
  
  const stats = props.data.statistics
  return [
    {
      id: 'total-students',
      title: 'Total Students',
      value: stats.totalStudents || 0,
      change: null,
      icon: 'users',
      color: 'primary'
    },
    {
      id: 'avg-eri',
      title: 'Average ERI',
      value: stats.averageERI ? stats.averageERI.toFixed(1) : '0.0',
      change: stats.eriChange || null,
      icon: 'trending-up',
      color: 'success'
    },
    {
      id: 'completion-rate',
      title: 'Completion Rate',
      value: stats.completionRate ? `${stats.completionRate}%` : '0%',
      change: null,
      icon: 'check-circle',
      color: 'info'
    },
    {
      id: 'avg-score',
      title: 'Average Score',
      value: stats.averageScore ? stats.averageScore.toFixed(1) : '0.0',
      change: stats.scoreChange || null,
      icon: 'chart-bar',
      color: 'warning'
    }
  ]
})

// VESPA elements configuration
const vespaElements = [
  { name: 'Vision', key: 'vision', color: '#FF8F00' },
  { name: 'Effort', key: 'effort', color: '#86B4F0' },
  { name: 'Systems', key: 'systems', color: '#72CB44' },
  { name: 'Practice', key: 'practice', color: '#7F31A4' },
  { name: 'Attitude', key: 'attitude', color: '#F032E6' },
  { name: 'Overall', key: 'overall', color: '#FFD93D' }
]

// Max Y value for histogram standardization - find highest across all distributions
const maxYValue = computed(() => {
  if (!props.data?.statistics?.distributions) {
    return 100
  }
  
  let maxCount = 0
  const distributions = props.data.statistics.distributions
  
  // Check all element distributions
  for (const element of vespaElements) {
    const dist = distributions[element.key]
    if (dist && Array.isArray(dist)) {
      const elementMax = Math.max(...dist)
      maxCount = Math.max(maxCount, elementMax)
    }
  }
  
  // Add 10% padding to the highest distribution for better visibility
  return Math.ceil(maxCount * 1.1)
})

// Split elements for 2-row layout
const topRowElements = vespaElements.slice(0, 3) // Vision, Effort, Systems
const bottomRowElements = vespaElements.slice(3, 6) // Practice, Attitude, Overall

const vespaScoresForRadar = computed(() => {
  if (!props.data?.statistics?.vespaScores) return null
  // Convert scores to 0-100 scale for radar chart
  const scores = props.data.statistics.vespaScores
  return {
    vision: (scores.vision || 0) * 20,
    effort: (scores.effort || 0) * 20,
    systems: (scores.systems || 0) * 20,
    practice: (scores.practice || 0) * 20,
    attitude: (scores.attitude || 0) * 20,
    nationalVision: (scores.nationalVision || 0) * 20,
    nationalEffort: (scores.nationalEffort || 0) * 20,
    nationalSystems: (scores.nationalSystems || 0) * 20,
    nationalPractice: (scores.nationalPractice || 0) * 20,
    nationalAttitude: (scores.nationalAttitude || 0) * 20
  }
})

// These functions are defined later in the file

const eriScore = computed(() => {
  return props.data?.statistics?.averageERI || 0
})

const nationalERI = computed(() => {
  return props.data?.statistics?.nationalERI || 0
})

const eriTrend = computed(() => {
  return props.data?.statistics?.eriTrend || 'stable'
})

const yearGroupData = computed(() => {
  if (!props.data?.statistics?.yearGroupPerformance) return null
  return props.data.statistics.yearGroupPerformance
})

const responses = computed(() => {
  // Get responses data from the dashboard data
  return props.data?.responses || []
})

// Methods for getting distribution data
const getDistribution = (elementKey) => {
  if (!props.data?.statistics?.distributions) {
    // Return empty distribution
    return Array(10).fill(0)
  }
  
  const distributions = props.data.statistics.distributions
  const elementData = distributions[elementKey]
  
  if (!elementData || !Array.isArray(elementData)) {
    return Array(10).fill(0)
  }
  
  return elementData
}

const getNationalAverage = (elementKey) => {
  if (elementKey === 'overall') {
    // Overall is stored separately
    const overallAvg = props.data?.statistics?.vespaScores?.nationalOverall || null
    console.log(`[getNationalAverage] overall: value=${overallAvg}`)
    return overallAvg
  }
  
  if (!props.data?.statistics?.comparison?.national) {
    console.log(`[getNationalAverage] No national comparison data for ${elementKey}`)
    return null
  }
  
  const nationalData = props.data.statistics.comparison.national
  const elementIndex = vespaElements.findIndex(e => e.key === elementKey)
  const nationalAvg = nationalData[elementIndex] || null
  
  console.log(`[getNationalAverage] ${elementKey}: index=${elementIndex}, value=${nationalAvg}, nationalData=`, nationalData)
  return nationalAvg
}

const getNationalDistribution = (elementKey) => {
  if (!props.data?.statistics?.nationalDistributions) {
    console.log(`[getNationalDistribution] No nationalDistributions data for ${elementKey}`)
    return []
  }
  
  const nationalDist = props.data.statistics.nationalDistributions[elementKey]
  
  if (!nationalDist || !Array.isArray(nationalDist)) {
    console.log(`[getNationalDistribution] Invalid distribution for ${elementKey}:`, nationalDist)
    return []
  }
  
  console.log(`[getNationalDistribution] ${elementKey}:`, nationalDist)
  return nationalDist
}
</script>

<style scoped>
.overview-section {
  padding: var(--spacing-lg) 0;
}

.section-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.overview-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.histograms-section {
  margin-top: var(--spacing-xl);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
  text-align: center;
}

.histograms-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

@media (max-width: 1024px) {
  .histograms-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .histograms-row {
    grid-template-columns: 1fr;
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-lg);
}

.chart-card {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.eri-section {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg) 0;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}</style>