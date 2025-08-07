<template>
  <div class="report-visualizations">
    <!-- Heat Map for Question-Level Comparison -->
    <div class="viz-section">
      <h3>Question Performance Heat Map</h3>
      <div class="heatmap-container">
        <canvas ref="heatmapCanvas"></canvas>
      </div>
      <div class="heatmap-legend">
        <span class="legend-label">Lower Performance</span>
        <div class="gradient-bar"></div>
        <span class="legend-label">Higher Performance</span>
      </div>
    </div>

    <!-- Trend Lines for Progression -->
    <div v-if="reportType === 'cycle_progression'" class="viz-section">
      <h3>Performance Trends</h3>
      <div class="trend-chart-container">
        <canvas ref="trendCanvas"></canvas>
      </div>
    </div>

    <!-- Spider/Radar Chart for VESPA -->
    <div class="viz-section">
      <h3>VESPA Profile Comparison</h3>
      <div class="radar-chart-container">
        <canvas ref="radarCanvas"></canvas>
      </div>
    </div>

    <!-- Question Level Analysis Section -->
    <div class="qla-section">
      <h3>Question Level Analysis</h3>
      
      <!-- Top Differentiators -->
      <div class="qla-subsection">
        <h4>Biggest Differences Between Groups</h4>
        <div class="question-diff-cards">
          <div 
            v-for="(question, idx) in topDifferentiators" 
            :key="question.id"
            class="diff-card"
            :class="getDiffCardClass(question.difference)"
          >
            <div class="diff-rank">{{ idx + 1 }}</div>
            <div class="diff-content">
              <p class="question-text">{{ question.text }}</p>
              <div class="diff-scores">
                <div class="score-group">
                  <span class="group-label">{{ group1Label }}</span>
                  <span class="score-value">{{ question.group1Score.toFixed(2) }}</span>
                </div>
                <div class="diff-indicator">
                  <svg v-if="question.difference > 0" class="arrow up" width="24" height="24">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" fill="currentColor"/>
                  </svg>
                  <svg v-else class="arrow down" width="24" height="24">
                    <path d="M12 20l8-8h-5V4H9v8H4z" fill="currentColor"/>
                  </svg>
                  <span class="diff-value">{{ Math.abs(question.difference).toFixed(2) }}</span>
                </div>
                <div class="score-group">
                  <span class="group-label">{{ group2Label }}</span>
                  <span class="score-value">{{ question.group2Score.toFixed(2) }}</span>
                </div>
              </div>
              <div class="vespa-category">
                <span class="category-badge" :class="getCategoryClass(question.category)">
                  {{ question.category }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Distribution Comparison -->
      <div class="qla-subsection">
        <h4>Response Distribution Analysis</h4>
        <div class="distribution-charts">
          <div v-for="question in selectedQuestions" :key="question.id" class="dist-chart">
            <h5>{{ question.text }}</h5>
            <div class="stacked-bar">
              <div class="bar-row">
                <span class="row-label">{{ group1Label }}</span>
                <div class="bar-container">
                  <div 
                    v-for="(value, idx) in question.group1Distribution" 
                    :key="idx"
                    class="bar-segment"
                    :class="`response-${idx + 1}`"
                    :style="{ width: `${value}%` }"
                  >
                    <span v-if="value > 5">{{ value }}%</span>
                  </div>
                </div>
              </div>
              <div class="bar-row">
                <span class="row-label">{{ group2Label }}</span>
                <div class="bar-container">
                  <div 
                    v-for="(value, idx) in question.group2Distribution" 
                    :key="idx"
                    class="bar-segment"
                    :class="`response-${idx + 1}`"
                    :style="{ width: `${value}%` }"
                  >
                    <span v-if="value > 5">{{ value }}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="distribution-legend">
              <span class="legend-item"><span class="dot response-1"></span> Strongly Disagree</span>
              <span class="legend-item"><span class="dot response-2"></span> Disagree</span>
              <span class="legend-item"><span class="dot response-3"></span> Neutral</span>
              <span class="legend-item"><span class="dot response-4"></span> Agree</span>
              <span class="legend-item"><span class="dot response-5"></span> Strongly Agree</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistical Significance Indicators -->
      <div class="qla-subsection">
        <h4>Statistical Analysis</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <h5>Questions with Significant Differences</h5>
            <div class="stat-value">{{ significantQuestions.length }}</div>
            <div class="stat-subtitle">p < 0.05</div>
          </div>
          <div class="stat-card">
            <h5>Average Effect Size</h5>
            <div class="stat-value">{{ averageEffectSize.toFixed(2) }}</div>
            <div class="stat-subtitle">Cohen's d</div>
          </div>
          <div class="stat-card">
            <h5>Largest Difference</h5>
            <div class="stat-value">{{ largestDifference.toFixed(2) }}</div>
            <div class="stat-subtitle">points</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights Box -->
    <div class="insights-box">
      <h4>AI-Generated Question Level Insights</h4>
      <div class="insight-content">
        <p v-for="insight in qlaInsights" :key="insight" class="insight-item">
          <svg class="insight-icon" width="16" height="16">
            <circle cx="8" cy="8" r="3" fill="#60a5fa"/>
          </svg>
          {{ insight }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  reportType: String,
  comparisonData: Object,
  questionData: Object,
  group1Label: String,
  group2Label: String
})

// Canvas refs
const heatmapCanvas = ref(null)
const trendCanvas = ref(null)
const radarCanvas = ref(null)

// Chart instances
let heatmapChart = null
let trendChart = null
let radarChart = null

// Computed data
const topDifferentiators = computed(() => {
  if (!props.questionData) return []
  
  // Calculate differences and sort
  const diffs = props.questionData.questions.map(q => ({
    ...q,
    difference: q.group2Score - q.group1Score
  }))
  
  // Get top 5 positive and negative differences
  const sorted = diffs.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
  return sorted.slice(0, 10)
})

const selectedQuestions = computed(() => {
  // Show questions with interesting distributions
  return topDifferentiators.value.slice(0, 5)
})

const significantQuestions = computed(() => {
  if (!props.questionData) return []
  return props.questionData.questions.filter(q => q.pValue < 0.05)
})

const averageEffectSize = computed(() => {
  if (!props.questionData) return 0
  const effects = props.questionData.questions.map(q => Math.abs(q.cohensD || 0))
  return effects.reduce((a, b) => a + b, 0) / effects.length
})

const largestDifference = computed(() => {
  if (!topDifferentiators.value.length) return 0
  return Math.max(...topDifferentiators.value.map(q => Math.abs(q.difference)))
})

const qlaInsights = computed(() => {
  // These would come from AI analysis
  return props.questionData?.insights || [
    'Students in Group 2 show significantly higher confidence in exam preparation questions',
    'The largest gap appears in "Systems" related questions, suggesting different organizational approaches',
    'Both groups score similarly on effort-related questions, indicating comparable motivation levels'
  ]
})

// Methods
const getDiffCardClass = (difference) => {
  const abs = Math.abs(difference)
  if (abs > 1.5) return 'high-diff'
  if (abs > 0.8) return 'medium-diff'
  return 'low-diff'
}

const getCategoryClass = (category) => {
  const map = {
    'VISION': 'vision',
    'EFFORT': 'effort',
    'SYSTEMS': 'systems',
    'PRACTICE': 'practice',
    'ATTITUDE': 'attitude'
  }
  return map[category] || 'default'
}

const createHeatmap = () => {
  if (!heatmapCanvas.value || !props.questionData) return
  
  // Create a heat map showing all questions and their scores for both groups
  const ctx = heatmapCanvas.value.getContext('2d')
  
  // Prepare data for heatmap
  const labels = props.questionData.questions.map(q => q.text.substring(0, 30) + '...')
  const group1Data = props.questionData.questions.map(q => q.group1Score)
  const group2Data = props.questionData.questions.map(q => q.group2Score)
  
  heatmapChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: props.group1Label,
          data: group1Data,
          backgroundColor: group1Data.map(v => `rgba(96, 165, 250, ${v/5})`),
          borderColor: '#60a5fa',
          borderWidth: 1
        },
        {
          label: props.group2Label,
          data: group2Data,
          backgroundColor: group2Data.map(v => `rgba(139, 92, 246, ${v/5})`),
          borderColor: '#8b5cf6',
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'white'
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${context.parsed.x.toFixed(2)}/5`
            }
          }
        }
      },
      scales: {
        x: {
          min: 1,
          max: 5,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'white'
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: 'white',
            font: {
              size: 10
            }
          }
        }
      }
    }
  })
}

const createTrendChart = () => {
  if (!trendCanvas.value || props.reportType !== 'cycle_progression') return
  
  const ctx = trendCanvas.value.getContext('2d')
  
  // Create trend lines for VESPA scores across cycles
  const cycles = Object.keys(props.comparisonData).map(k => k.replace('cycle_', 'Cycle '))
  const vespaElements = ['vision', 'effort', 'systems', 'practice', 'attitude', 'overall']
  
  const datasets = vespaElements.map((element, idx) => ({
    label: element.charAt(0).toUpperCase() + element.slice(1),
    data: cycles.map((_, i) => {
      const cycleData = props.comparisonData[`cycle_${i + 1}`]
      return cycleData?.vespa?.[element] || 0
    }),
    borderColor: `hsl(${idx * 60}, 70%, 60%)`,
    backgroundColor: `hsla(${idx * 60}, 70%, 60%, 0.1)`,
    tension: 0.3
  }))
  
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: cycles,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'white'
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'white'
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'white'
          }
        }
      }
    }
  })
}

const createRadarChart = () => {
  if (!radarCanvas.value) return
  
  const ctx = radarCanvas.value.getContext('2d')
  
  // VESPA comparison radar
  const vespaLabels = ['Vision', 'Effort', 'Systems', 'Practice', 'Attitude']
  
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: vespaLabels,
      datasets: [
        {
          label: props.group1Label,
          data: vespaLabels.map(l => props.comparisonData.group1?.vespa?.[l.toLowerCase()] || 0),
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.2)',
          pointBackgroundColor: '#60a5fa',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#60a5fa'
        },
        {
          label: props.group2Label,
          data: vespaLabels.map(l => props.comparisonData.group2?.vespa?.[l.toLowerCase()] || 0),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          pointBackgroundColor: '#8b5cf6',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#8b5cf6'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'white'
          }
        }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          pointLabels: {
            color: 'white',
            font: {
              size: 12
            }
          },
          ticks: {
            color: 'white',
            backdropColor: 'transparent'
          }
        }
      }
    }
  })
}

onMounted(() => {
  createHeatmap()
  createTrendChart()
  createRadarChart()
})

// Cleanup
onUnmounted(() => {
  if (heatmapChart) heatmapChart.destroy()
  if (trendChart) trendChart.destroy()
  if (radarChart) radarChart.destroy()
})
</script>

<style scoped>
.report-visualizations {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

.viz-section,
.qla-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
}

.viz-section h3,
.qla-section h3 {
  color: white;
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
}

.heatmap-container,
.trend-chart-container,
.radar-chart-container {
  position: relative;
  height: 400px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.gradient-bar {
  width: 200px;
  height: 20px;
  background: linear-gradient(90deg, 
    rgba(96, 165, 250, 0.2) 0%, 
    rgba(96, 165, 250, 1) 100%);
  border-radius: 10px;
}

.legend-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

/* Question Level Analysis Styles */
.qla-subsection {
  margin-top: 2rem;
}

.qla-subsection h4 {
  color: #60a5fa;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.question-diff-cards {
  display: grid;
  gap: 1rem;
}

.diff-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.2s;
}

.diff-card.high-diff {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.diff-card.medium-diff {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.05);
}

.diff-card.low-diff {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.diff-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(96, 165, 250, 0.2);
  border-radius: 50%;
  color: #60a5fa;
  font-weight: bold;
  flex-shrink: 0;
}

.diff-content {
  flex: 1;
}

.question-text {
  color: white;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.diff-scores {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
}

.score-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.group-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.score-value {
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
}

.diff-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.arrow {
  transition: all 0.2s;
}

.arrow.up {
  color: #10b981;
}

.arrow.down {
  color: #ef4444;
}

.diff-value {
  color: white;
  font-weight: bold;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.category-badge.vision {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.category-badge.effort {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.category-badge.systems {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.category-badge.practice {
  background: rgba(251, 146, 60, 0.2);
  color: #fb923c;
}

.category-badge.attitude {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

/* Distribution Charts */
.distribution-charts {
  display: grid;
  gap: 2rem;
}

.dist-chart h5 {
  color: white;
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
}

.stacked-bar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.row-label {
  width: 100px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
}

.bar-container {
  flex: 1;
  height: 30px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  overflow: hidden;
  display: flex;
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.3s;
}

.bar-segment.response-1 {
  background: #ef4444;
}

.bar-segment.response-2 {
  background: #fb923c;
}

.bar-segment.response-3 {
  background: #fbbf24;
}

.bar-segment.response-4 {
  background: #84cc16;
}

.bar-segment.response-5 {
  background: #22c55e;
}

.distribution-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* Statistical Analysis */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.stat-card h5 {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  font-weight: normal;
}

.stat-value {
  color: #60a5fa;
  font-size: 2rem;
  font-weight: bold;
}

.stat-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Insights Box */
.insights-box {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
}

.insights-box h4 {
  color: white;
  margin: 0 0 1rem 0;
}

.insight-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  margin: 0;
}

.insight-icon {
  flex-shrink: 0;
  margin-top: 0.25rem;
}
</style>
