<template>
  <div class="student-vespa-scores">
    <div class="student-header">
      <h3>Individual VESPA Scores - Cycle {{ cycle }}</h3>
      <p class="student-name">{{ studentName }}</p>
    </div>
    
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
  { name: 'Vision', key: 'vision', color: '#10B981' },
  { name: 'Effort', key: 'effort', color: '#3B82F6' },
  { name: 'Systems', key: 'systems', color: '#8B5CF6' },
  { name: 'Practice', key: 'practice', color: '#EC4899' },
  { name: 'Attitude', key: 'attitude', color: '#F59E0B' }
]

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
  createChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

// Watch for data changes
watch(() => props.vespaScores, () => {
  if (chartInstance) {
    updateChart()
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
          borderColor: '#FFD93D',
          backgroundColor: 'transparent',
          borderWidth: 3,
          pointBackgroundColor: '#FFD93D',
          pointBorderColor: '#FFD93D',
          pointRadius: 5,
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
</style>