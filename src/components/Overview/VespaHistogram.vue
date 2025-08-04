<template>
  <div class="vespa-histogram">
    <canvas :id="canvasId" ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
  color: {
    type: String,
    default: '#60A5FA' // Default blue
  },
  elementKey: {
    type: String,
    required: true
  }
})

const chartCanvas = ref(null)
let chartInstance = null
const canvasId = `histogram-${props.elementKey}`

// Calculate total responses for display
const totalResponses = props.distribution.reduce((sum, count) => sum + count, 0)

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
  
  const chartConfig = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Students',
        data: props.distribution,
        backgroundColor: props.color + '80', // Add transparency
        borderColor: props.color,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        title: {
          display: true,
          text: `${props.title} (n=${totalResponses})`,
          color: '#E5E7EB',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        legend: {
          display: false
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
              const percentage = totalResponses > 0 ? ((value / totalResponses) * 100).toFixed(1) : 0
              return `${value} students (${percentage}%)`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
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
            stepSize: 1,
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
    chartConfig.options.plugins.annotation = {
      annotations: {
        nationalAvgLine: {
          type: 'line',
          xMin: props.nationalAverage,
          xMax: props.nationalAverage,
          borderColor: '#FFD93D',
          borderWidth: 3,
          borderDash: [8, 4],
          label: {
            enabled: true,
            content: `National Avg: ${props.nationalAverage.toFixed(1)}`,
            position: 'start',
            backgroundColor: 'rgba(255, 217, 61, 0.9)',
            font: {
              weight: 'bold',
              size: 12
            },
            color: '#0F0F23',
            padding: 4
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
  chartInstance.options.plugins.title.text = `${props.title} (n=${totalResponses})`
  chartInstance.update()
}
</script>

<style scoped>
.vespa-histogram {
  width: 100%;
  height: 100%;
  position: relative;
}

canvas {
  max-width: 100%;
  height: auto !important;
}
</style>