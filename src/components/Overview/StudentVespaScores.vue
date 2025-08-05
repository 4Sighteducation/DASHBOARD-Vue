<template>
  <div class="student-vespa-scores">
    <div class="student-header">
      <h3>Individual VESPA Scores - Cycle {{ cycle }}</h3>
      <p class="student-name">{{ studentName }}</p>
      <div v-if="hasData" class="completion-status" :class="completionClass">
        {{ completionStatus }}
      </div>
    </div>
    
    <div v-if="!hasData" class="no-data-message">
      <div class="no-data-icon">📊</div>
      <h4>No VESPA data available</h4>
      <p>This student has not completed the VESPA assessment for Cycle {{ cycle }}.</p>
      <p class="hint">Try selecting a different cycle or checking back later.</p>
    </div>
    
    <div v-else>
      <div class="scores-chart-container">
        <canvas ref="chartCanvas"></canvas>
      </div>
      
      <div class="scores-table">
      <table>
        <thead>
          <tr>
            <th>VESPA Element</th>
            <th>Score</th>
            <th>vs National Average</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="element in vespaElements" :key="element.key">
            <td>{{ element.name }}</td>
            <td class="score">{{ getScore(element.key) }}</td>
            <td class="comparison" :class="getComparisonClass(element.key)">
              {{ getComparison(element.key) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

const props = defineProps({
  vespaScores: {
    type: Object,
    required: true
  },
  nationalAverages: {
    type: Object,
    default: () => ({})
  },
  cycle: {
    type: Number,
    default: 1
  },
  studentName: {
    type: String,
    default: 'Selected Student'
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const vespaElements = [
  { name: 'Vision', key: 'vision', color: '#FF8F00' },  // Orange
  { name: 'Effort', key: 'effort', color: '#86B4F0' },  // Blue
  { name: 'Systems', key: 'systems', color: '#72CB44' }, // Green
  { name: 'Practice', key: 'practice', color: '#7F31A4' }, // Purple
  { name: 'Attitude', key: 'attitude', color: '#F032E6' }  // Pink
]

// Check if student has data
const hasData = computed(() => {
  if (!props.vespaScores) return false
  // Check if at least one VESPA element has a non-zero score
  return vespaElements.some(elem => props.vespaScores[elem.key] && props.vespaScores[elem.key] > 0)
})

// Completion status
const isComplete = computed(() => {
  if (!props.vespaScores) return false
  // Check if all VESPA elements have scores
  return vespaElements.every(elem => props.vespaScores[elem.key] && props.vespaScores[elem.key] > 0)
})

const completionStatus = computed(() => {
  return isComplete.value ? 'Assessment Complete' : 'Assessment Incomplete'
})

const completionClass = computed(() => {
  return isComplete.value ? 'complete' : 'incomplete'
})

// Get score for an element
function getScore(key) {
  const score = props.vespaScores[key] || 0
  return score.toFixed(1)
}

// Get comparison with national average
function getComparison(key) {
  const score = props.vespaScores[key] || 0
  const national = props.nationalAverages[key] || 0
  const diff = score - national
  
  if (diff > 0) return `+${diff.toFixed(1)}`
  return diff.toFixed(1)
}

// Get comparison class for styling
function getComparisonClass(key) {
  const score = props.vespaScores[key] || 0
  const national = props.nationalAverages[key] || 0
  const diff = score - national
  
  if (diff > 0) return 'positive'
  if (diff < 0) return 'negative'
  return 'neutral'
}

// Lifecycle
onMounted(() => {
  if (hasData.value) {
    createChart()
  }
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

// Watch for data changes
watch(() => props.vespaScores, () => {
  if (hasData.value) {
    if (chartInstance) {
      updateChart()
    } else {
      createChart()
    }
  } else if (chartInstance) {
    // Destroy chart if no data
    chartInstance.destroy()
    chartInstance = null
  }
}, { deep: true })

function createChart() {
  const ctx = chartCanvas.value?.getContext('2d')
  if (!ctx) return

  const labels = vespaElements.map(e => e.name)
  const studentData = vespaElements.map(e => props.vespaScores[e.key] || 0)
  const nationalData = vespaElements.map(e => props.nationalAverages[e.key] || 0)

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Student Score',
          data: studentData,
          backgroundColor: vespaElements.map(e => e.color),
          borderColor: vespaElements.map(e => e.color),
          borderWidth: 2
        },
        {
          label: 'National Average',
          data: nationalData,
          type: 'line',
          borderColor: '#FFD93D80',  // Reduced opacity
          backgroundColor: 'transparent',
          borderWidth: 1.5,  // Thinner line
          pointBackgroundColor: '#FFD93D80',
          pointBorderColor: '#FFD93D80',
          pointRadius: 4,  // Smaller points
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 10,
          ticks: {
            stepSize: 1
          },
          title: {
            display: true,
            text: 'Score (1-10)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'VESPA Elements'
          }
        }
      }
    }
  })
}

function updateChart() {
  if (!chartInstance) return
  
  const studentData = vespaElements.map(e => props.vespaScores[e.key] || 0)
  const nationalData = vespaElements.map(e => props.nationalAverages[e.key] || 0)
  
  chartInstance.data.datasets[0].data = studentData
  chartInstance.data.datasets[1].data = nationalData
  chartInstance.update()
}
</script>

<style scoped>
.student-vespa-scores {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.student-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.student-header h3 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
}

.student-name {
  color: var(--text-secondary);
  font-size: 1.125rem;
  margin: 0;
}

.scores-chart-container {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  background: var(--secondary-bg);
  border-radius: var(--radius-sm);
}

.scores-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: var(--secondary-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
}

td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.score {
  font-weight: 600;
  color: var(--text-primary);
}

.comparison {
  font-weight: 500;
}

.comparison.positive {
  color: #10B981;
}

.comparison.negative {
  color: #EF4444;
}

.comparison.neutral {
  color: var(--text-secondary);
}

.completion-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.completion-status.complete {
  background-color: #10B98120;
  color: #10B981;
  border: 1px solid #10B98140;
}

.completion-status.incomplete {
  background-color: #F5970B20;
  color: #F59E0B;
  border: 1px solid #F5970B40;
}

.no-data-message {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-secondary);
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-data-message h4 {
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.no-data-message p {
  margin: 0.5rem 0;
}

.no-data-message .hint {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  font-style: italic;
}
</style>