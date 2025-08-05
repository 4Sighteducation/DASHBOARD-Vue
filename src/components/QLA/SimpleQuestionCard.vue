<template>
  <div 
    class="simple-question-card"
    :class="[colorClass]"
  >
    <div class="question-rank">{{ rank }}</div>
    <div class="question-content">
      <h4 class="question-text">{{ questionText }}</h4>
      <div class="score-and-chart">
        <div class="score-section">
          <span class="score-value">{{ formattedScore }}</span>
          <span class="score-label">AVERAGE</span>
        </div>
        <div class="chart-section">
          <canvas :id="`mini-chart-${uniqueId}`" class="mini-chart"></canvas>
        </div>
      </div>
      <div class="question-meta">
        <span class="response-count">n = {{ responseCount }}</span>
        <span class="std-dev">σ = {{ formattedStdDev }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, nextTick, ref } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  rank: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    default: 'top' // 'top' or 'bottom'
  }
})

// Generate unique ID for canvas
const uniqueId = ref(`${props.question.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

// Computed properties
const questionText = computed(() => {
  return props.question.text || props.question.question_text || `Question ${props.question.id}`
})

const score = computed(() => {
  return props.question.score || props.question.mean || 0
})

const formattedScore = computed(() => {
  return score.value.toFixed(2)
})

const responseCount = computed(() => {
  return props.question.count || props.question.n || 0
})

const formattedStdDev = computed(() => {
  const stdDev = props.question.std_dev || 0
  return stdDev.toFixed(2)
})

// Color class based on score with new breakpoints
const colorClass = computed(() => {
  // Same breakpoints for both top and bottom questions
  // Bottom questions are already sorted by lowest score
  if (score.value >= 4.4) return 'excellent'
  if (score.value >= 3.4) return 'good'
  if (score.value >= 2.4) return 'average'
  return 'poor' // < 2.4 = Needs Attention
})

// Generate distribution data from mean and std dev
const generateDistribution = () => {
  const mean = score.value
  const stdDev = props.question.std_dev || 0.87
  const count = responseCount.value || 100
  const distribution = [0, 0, 0, 0, 0]
  
  // Generate a normal-like distribution
  for (let i = 1; i <= 5; i++) {
    const distance = Math.abs(i - mean)
    const probability = Math.exp(-(distance * distance) / (2 * stdDev * stdDev))
    distribution[i - 1] = Math.round(probability * count * 0.4)
  }
  
  // Normalize to ensure reasonable total
  const total = distribution.reduce((sum, val) => sum + val, 0)
  if (total > 0) {
    const scaleFactor = count / total
    for (let i = 0; i < 5; i++) {
      distribution[i] = Math.round(distribution[i] * scaleFactor)
    }
  }
  
  return distribution
}

// Create the mini chart
const createMiniChart = async () => {
  await nextTick()
  
  const canvas = document.getElementById(`mini-chart-${uniqueId.value}`)
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  
  // Get color based on score
  const colors = {
    excellent: '#10b981',
    good: '#3b82f6',
    average: '#f59e0b',
    poor: '#ef4444'
  }
  
  const color = colors[colorClass.value] || '#64748b'
  const distribution = props.question.distribution || generateDistribution()
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1', '2', '3', '4', '5'],
      datasets: [{
        data: distribution,
        backgroundColor: color + '66', // 40% opacity
        borderColor: color,
        borderWidth: 1,
        borderRadius: 2,
        barPercentage: 0.9,
        categoryPercentage: 0.95
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        y: {
          display: false,
          beginAtZero: true
        },
        x: {
          display: true,
          grid: {
            display: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.4)',
            font: {
              size: 8
            }
          }
        }
      },
      layout: {
        padding: 0
      }
    }
  })
}

// Mount hook to create chart
onMounted(() => {
  createMiniChart()
})
</script>

<style scoped>
.simple-question-card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border-bottom-width: 4px;
  height: 100%;
  min-height: 220px;
  display: flex;
  flex-direction: column;
}

.simple-question-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.question-rank {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--text-primary);
  z-index: 10;
}

.question-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.question-text {
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--text-primary);
  margin: 0;
  margin-right: 30px; /* Space for rank number */
  margin-bottom: var(--spacing-sm);
  min-height: 2.8em; /* Ensure minimum height for 2 lines */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

/* Score and Chart Container */
.score-and-chart {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  justify-content: space-between;
  margin: var(--spacing-md) 0;
  flex: 1;
}

.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
}

.score-value {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 0.625rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
  opacity: 0.7;
}

/* Chart Section */
.chart-section {
  flex: 1;
  height: 60px;
  position: relative;
  max-width: 120px;
}

.mini-chart {
  width: 100%;
  height: 100%;
}

.question-meta {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  font-size: 0.625rem;
  color: var(--text-muted);
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--border-color);
  margin-top: auto;
  opacity: 0.8;
}

/* Color variations */
.excellent {
  border-bottom-color: #10b981;
  background: linear-gradient(to bottom, var(--card-bg) 90%, rgba(16, 185, 129, 0.1));
}

.excellent .score-value {
  color: #10b981;
}

.excellent .question-rank {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.good {
  border-bottom-color: #3b82f6;
  background: linear-gradient(to bottom, var(--card-bg) 90%, rgba(59, 130, 246, 0.1));
}

.good .score-value {
  color: #3b82f6;
}

.good .question-rank {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.average {
  border-bottom-color: #f59e0b;
  background: linear-gradient(to bottom, var(--card-bg) 90%, rgba(245, 158, 11, 0.1));
}

.average .score-value {
  color: #f59e0b;
}

.average .question-rank {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.poor {
  border-bottom-color: #ef4444;
  background: linear-gradient(to bottom, var(--card-bg) 90%, rgba(239, 68, 68, 0.1));
}

.poor .score-value {
  color: #ef4444;
}

.poor .question-rank {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Responsive adjustments */
@media (max-width: 1400px) {
  .score-and-chart {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .chart-section {
    width: 100%;
    max-width: none;
    height: 50px;
  }
}

@media (max-width: 768px) {
  .simple-question-card {
    min-height: 200px;
  }
  
  .question-text {
    font-size: 0.8rem;
    min-height: 2.4em;
  }
  
  .score-value {
    font-size: 2rem;
  }
  
  .chart-section {
    height: 45px;
  }
}

@media (max-width: 480px) {
  .simple-question-card {
    min-height: 180px;
  }
  
  .score-value {
    font-size: 1.75rem;
  }
}
</style>