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
import annotationPlugin from 'chartjs-plugin-annotation'

// Register Chart.js components including annotation plugin
Chart.register(...registerables, annotationPlugin)

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  distribution: {
    type: Array,
    required: true,
    validator: (value) => value.length === 10 // 1-10 scores
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
  
  props.distribution.forEach((count, index) => {
    const score = index + 1  // Convert index to score (1-10)
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
  console.log(`[VespaHistogram] ${props.title} mounted with:`, {
    nationalAverage: props.nationalAverage,
    nationalDistribution: props.nationalDistribution,
    distribution: props.distribution
  })
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

// Helper function to calculate appropriate step size based on max value
function calculateStepSize(maxValue) {
  if (maxValue <= 10) return 1
  if (maxValue <= 20) return 2
  if (maxValue <= 50) return 5
  if (maxValue <= 100) return 10
  if (maxValue <= 200) return 20
  return Math.ceil(maxValue / 10)
}

function createChart() {
  const ctx = chartCanvas.value?.getContext('2d')
  if (!ctx) return

  const labels = Array.from({ length: 10 }, (_, i) => (i + 1).toString()) // 1-10
  
  const datasets = [{
    label: 'School',
    data: props.distribution,
    backgroundColor: props.color + '80', // Add transparency
    borderColor: props.color,
    borderWidth: 2,
    barPercentage: 0.8
  }]
  
  // Add national distribution line if available
  if (props.nationalDistribution && props.nationalDistribution.length === 10) {
    console.log(`[VespaHistogram] Adding national distribution for ${props.title}:`, props.nationalDistribution)
    // Calculate percentages for national data
    const nationalTotal = props.nationalDistribution.reduce((sum, count) => sum + count, 0)
    const nationalPercentages = props.nationalDistribution.map(count => 
      nationalTotal > 0 ? (count / nationalTotal * 100) : 0
    )
    
    // Calculate the maximum value from school distribution for scaling
    const maxSchoolCount = Math.max(...props.distribution)
    const schoolTotal = props.distribution.reduce((sum, count) => sum + count, 0)
    
    // Scale national percentages to match the school data scale
    // Each national percentage point should be positioned relative to school data
    const scaledNationalData = nationalPercentages.map((pct, index) => {
      // Get school percentage for this score
      const schoolPct = schoolTotal > 0 ? (props.distribution[index] / schoolTotal * 100) : 0
      // Position the national point at the correct height on the bar
      return (pct / 100) * schoolTotal
    })
    
    console.log(`[VespaHistogram] National percentages for ${props.title}:`, nationalPercentages)
    console.log(`[VespaHistogram] Scaled national data for ${props.title}:`, scaledNationalData)
    
    datasets.push({
      label: 'National Distribution',
      data: scaledNationalData,
      type: 'line',
      borderColor: '#FFD93D80',  // Reduced opacity for less contrast
      backgroundColor: '#FFD93D60',  // Reduced opacity
      borderWidth: 1.5,  // Thinner line
      pointRadius: 4,  // Smaller points
      pointBackgroundColor: '#FFD93D80',
      pointBorderColor: '#0F0F2360',  // Less prominent border
      pointBorderWidth: 1,
      tension: 0.2
    })
  } else {
    console.log(`[VespaHistogram] No valid national distribution for ${props.title}:`, {
      hasData: !!props.nationalDistribution,
      length: props.nationalDistribution?.length
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
      layout: {
        padding: {
          top: 20,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      plugins: {
        title: {
          display: true,
          text: `${props.title} Score Distribution - Cycle ${props.cycle || 1}`,
          color: '#E5E7EB',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: {
            top: 0,
            bottom: 10
          }
        },
        legend: {
          display: props.nationalDistribution && props.nationalDistribution.length === 10,
          position: 'top',
          labels: {
            color: '#9CA3AF',
            usePointStyle: true,
            padding: 10,
            font: {
              size: 11
            }
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
              if (context.dataset.type === 'line') {
                // For national distribution line
                const nationalTotal = props.nationalDistribution.reduce((sum, count) => sum + count, 0)
                const nationalPct = nationalTotal > 0 ? 
                  ((props.nationalDistribution[context.dataIndex] / nationalTotal) * 100).toFixed(1) : 0
                return `National: ${nationalPct}%`
              } else {
                // For school bars
                const value = context.raw
                const total = totalResponses.value
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                return `${value} students (${percentage}%)`
              }
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
            stepSize: props.maxYValue > 0 ? calculateStepSize(props.maxYValue) : 10,
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
            text: 'Score (1-10)',
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
    console.log(`[VespaHistogram] Adding national average line for ${props.title}: ${props.nationalAverage}`)
    
    if (!chartConfig.options.plugins) {
      chartConfig.options.plugins = {}
    }
    
    chartConfig.options.plugins.annotation = {
      annotations: {
        nationalAvgLine: {
          type: 'line',
          scaleID: 'x',
          value: props.nationalAverage - 1, // Adjust for 0-based index (score 1 is at index 0)
          borderColor: '#FFD93D80',  // Reduced opacity
          borderWidth: 2,  // Thinner line
          borderDash: [5, 5],
          z: 10, // Bring to front
          label: {
            display: true,
            content: `National: ${props.nationalAverage.toFixed(1)}`,
            position: 'end',
            backgroundColor: 'rgba(255, 217, 61, 0.6)',  // Reduced opacity
            font: {
              weight: 'normal',  // Not bold
              size: 10  // Smaller
            },
            color: '#0F0F23CC',  // Slightly transparent
            yAdjust: -8,
            xAdjust: 0,
            padding: {
              top: 2,
              bottom: 2,
              left: 4,
              right: 4
            },
            z: 10
          }
        }
      },
      clip: false // Allow annotations to extend outside chart area
    }
  } else {
    console.log(`[VespaHistogram] No national average for ${props.title}:`, props.nationalAverage)
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