<template>
  <div class="overview-section">
    <!-- Loading State -->
    <div v-if="loading" class="section-loading">
      <div class="spinner"></div>
      <p>Loading overview data...</p>
    </div>

    <!-- Content -->
    <div v-else class="overview-content">
      <!-- Statistics Cards -->
      <div class="statistics-grid">
        <StatCard 
          v-for="stat in statistics" 
          :key="stat.id"
          :title="stat.title"
          :value="stat.value"
          :change="stat.change"
          :icon="stat.icon"
          :color="stat.color"
        />
      </div>

      <!-- VESPA Score Histograms -->
      <div class="histograms-section">
        <h3 class="section-title">VESPA Score Distributions</h3>
        <div class="histograms-grid">
          <VespaHistogram
            v-for="element in vespaElements"
            :key="element.key"
            :title="element.name"
            :distribution="getDistribution(element.key)"
            :national-average="getNationalAverage(element.key)"
            :color="element.color"
            :element-key="element.key"
          />
        </div>
      </div>

      <!-- VESPA Radar Chart -->
      <div class="charts-grid">
        <div class="chart-card">
          <h3 class="chart-title">VESPA Scores Overview</h3>
          <VespaRadarChart :data="vespaScoresForRadar" />
        </div>
      </div>

      <!-- ERI Gauge -->
      <div class="eri-section">
        <ERIGauge 
          :value="eriScore" 
          :nationalAverage="nationalERI"
          :trend="eriTrend"
        />
      </div>

      <!-- Year Group Performance -->
      <div class="chart-card full-width">
        <h3 class="chart-title">Performance by Year Group</h3>
        <YearGroupChart :data="yearGroupData" />
      </div>
      
      <!-- Automated Insights -->
      <InsightsGrid
        :responses="responses"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatCard from './StatCard.vue'
import VespaRadarChart from './VespaRadarChart.vue'
import VespaHistogram from './VespaHistogram.vue'
import ERIGauge from './ERIGauge.vue'
import YearGroupChart from './YearGroupChart.vue'
import InsightsGrid from './InsightsGrid.vue'

const props = defineProps({
  data: Object,
  filters: Object,
  loading: Boolean
})

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

// Get distribution for a specific element
function getDistribution(elementKey) {
  if (!props.data?.statistics?.distributions) {
    // Return empty distribution if no data
    return Array(11).fill(0)
  }
  return props.data.statistics.distributions[elementKey] || Array(11).fill(0)
}

// Get national average for a specific element
function getNationalAverage(elementKey) {
  if (!props.data?.statistics?.vespaScores) return null
  const nationalKey = `national${elementKey.charAt(0).toUpperCase() + elementKey.slice(1)}`
  return props.data.statistics.vespaScores[nationalKey] || null
}

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
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.histograms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
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