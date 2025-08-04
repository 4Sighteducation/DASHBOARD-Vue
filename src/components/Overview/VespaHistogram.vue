<template>
  <div class="vespa-histogram">
    <!-- Scorecard -->
    <div class="scorecard" :style="scorecardStyle">
      <div class="score-value" :style="{ color: color }">{{ averageScore }}</div>
      <div class="score-comparison" :class="comparisonClass">
        <svg class="arrow-icon" :class="arrowDirection" width="16" height="16" viewBox="0 0 16 16">
          <path d="M8 2L3 7h3v6h4V7h3L8 2z" fill="currentColor"/>
        </svg>
        <span>{{ parseFloat(percentageDifference) > 0 ? '+' : '' }}{{ percentageDifference }}%</span>
      </div>
    </div>
    
    <!-- Chart -->
    <div class="chart-container">
      <canvas :id="canvasId" ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  distribution: {
    type: Array,
    required: true,
    validator: (value) => value.length === 11 // 0-10 scores
  },
  nationalAverage: {
    type: Number,
    default: null
  },
  nationalDistribution: {
    type: Array,
    default: () => []
  },
  color: {
    type: String,
    default: '#60A5FA' // Default blue
  },
  elementKey: {
    type: String,
    required: true
  },
  cycle: {
    type: Number,
    default: 1
  },
  maxYValue: {
    type: Number,
    default: null
  }
})

const chartCanvas = ref(null)
let chartInstance = null
const canvasId = `histogram-${props.elementKey}`

// Calculate total responses for display
const totalResponses = computed(() => {
  return props.distribution.reduce((sum, count) => sum + count, 0)
})

// Calculate average score
const averageScore = computed(() => {
  let weightedSum = 0
  let totalCount = 0
  
  props.distribution.forEach((count, score) => {
    weightedSum += score * count
    totalCount += count
  })
  
  return totalCount > 0 ? (weightedSum / totalCount).toFixed(1) : '0.0'
})

// Calculate percentage difference from national
const percentageDifference = computed(() => {
  if (!props.nationalAverage || props.nationalAverage === 0) return '0.0'
  const schoolAvg = parseFloat(averageScore.value)
  const diff = ((schoolAvg - props.nationalAverage) / props.nationalAverage) * 100
  return diff.toFixed(1) // Keep sign for display
})

// Determine comparison class and arrow direction
const comparisonClass = computed(() => {
  if (!props.nationalAverage) return ''
  const schoolAvg = parseFloat(averageScore.value)
  return schoolAvg >= props.nationalAverage ? 'positive' : 'negative'
})

const arrowDirection = computed(() => {
  if (!props.nationalAverage) return ''
  const schoolAvg = parseFloat(averageScore.value)
  return schoolAvg >= props.nationalAverage ? 'arrow-up' : 'arrow-down'
})

// Scorecard styling
const scorecardStyle = computed(() => {
  // Convert hex color to rgba
  const hexToRgba = (hex, alpha) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return hex
  }
  
  return {
    borderColor: hexToRgba(props.color, 0.25),
    backgroundColor: hexToRgba(props.color, 0.06)
  }
})

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

// Watch for data changes
watch(() => props.distribution, () => {
  if (chartInstance) {
    updateChart()
  }
}, { deep: true })

function createChart() {
  const ctx = chartCanvas.value?.getContext('2d')
  if (!ctx) return

  const labels = Array.from({ length: 11 }, (_, i) => i.toString())
  
  const datasets = [{
    label: 'School',
    data: props.distribution,
    backgroundColor: props.color + '80', // Add transparency
    borderColor: props.color,
    borderWidth: 2,
    barPercentage: 0.8
  }]
  
  // Add national distribution line if available
  if (props.nationalDistribution && props.nationalDistribution.length === 11) {
    // Calculate percentages for national data
    const nationalTotal = props.nationalDistribution.reduce((sum, count) => sum + count, 0)
    const nationalPercentages = props.nationalDistribution.map(count => 
      nationalTotal > 0 ? (count / nationalTotal * 100) : 0
    )
    
    // Scale to match school data display
    const maxSchoolCount = Math.max(...props.distribution)
    const scaleFactor = maxSchoolCount / 100
    const scaledNationalData = nationalPercentages.map(pct => pct * scaleFactor)
    
    datasets.push({
      label: 'National',
      data: scaledNationalData,
      type: 'line',
      borderColor: '#FFD93D',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: '#FFD93D',
      pointBorderColor: '#FFD93D',
      tension: 0.4,
      borderDash: [2, 2]
    })
  }
  
  const chartConfig = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        title: {
          display: true,
          text: `${props.title} Score Distribution - Cycle ${props.cycle || 1}`,
          color: '#E5E7EB',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        legend: {
          display: props.nationalDistribution && props.nationalDistribution.length === 11,
          position: 'top',
          labels: {
            color: '#9CA3AF',
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: props.color,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const value = context.raw
              const total = totalResponses.value
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
              return `${value} students (${percentage}%)`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: props.maxYValue || undefined,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          },
          title: {
            display: true,
            text: 'Number of Students',
            color: '#9CA3AF'
          },
          ticks: {
            color: '#9CA3AF',
            stepSize: props.maxYValue > 0 ? Math.max(10, Math.ceil(props.maxYValue / 10)) : 10,
            callback: function(value) {
              return Number.isInteger(value) ? value : ''
            }
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          },
          title: {
            display: true,
            text: 'Score (0-10)',
            color: '#9CA3AF'
          },
          ticks: {
            color: '#9CA3AF'
          }
        }
      }
    }
  }

  // Add national average line if provided
  if (props.nationalAverage !== null && props.nationalAverage !== undefined) {
    // Find max Y value for the line height
    const maxY = Math.max(...props.distribution)
    
    if (!chartConfig.options.plugins) {
      chartConfig.options.plugins = {}
    }
    
    chartConfig.options.plugins.annotation = {
      annotations: {
        nationalAvgLine: {
          type: 'line',
          scaleID: 'x',
          value: props.nationalAverage,
          borderColor: '#FFD93D',
          borderWidth: 3,
          borderDash: [6, 3],
          label: {
            display: true,
            content: `National: ${props.nationalAverage.toFixed(1)}`,
            position: 'end',
            backgroundColor: 'rgba(255, 217, 61, 0.9)',
            font: {
              weight: 'bold',
              size: 11
            },
            color: '#0F0F23',
            yAdjust: -10
          }
        }
      }
    }
  }

  chartInstance = new Chart(ctx, chartConfig)
}

function updateChart() {
  if (!chartInstance) return
  
  chartInstance.data.datasets[0].data = props.distribution
  chartInstance.options.plugins.title.text = `${props.title} Score Distribution - Cycle ${props.cycle || 1}`
  chartInstance.update()
}
</script>

<style scoped>
.vespa-histogram {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scorecard {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border-width: 2px;
  border-style: solid;
  transition: all 0.3s ease;
}

.score-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--text-primary, #ffffff);
}

.score-comparison {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 1rem;
  font-weight: 600;
}

.score-comparison.positive {
  color: #10B981;
}

.score-comparison.negative {
  color: #EF4444;
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

.arrow-icon.arrow-up {
  transform: rotate(0deg);
}

.arrow-icon.arrow-down {
  transform: rotate(180deg);
}

.chart-container {
  flex: 1;
  position: relative;
}

canvas {
  max-width: 100%;
  height: auto !important;
}
</style>