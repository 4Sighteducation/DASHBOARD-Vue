<template>
  <div class="eri-speedometer" :style="{ width: size + 'px', height: size + 'px' }">
    <canvas :id="canvasId" ref="chartCanvas"></canvas>
    <div class="eri-value">
      <div class="value">{{ value.toFixed(1) }}</div>
      <div class="label">ERI</div>
      <div class="rating" :style="{ color: getGaugeColor(value) }">
        {{ getRatingText(value) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  national: {
    type: Number,
    default: null
  },
  size: {
    type: Number,
    default: 200
  }
})

const chartCanvas = ref(null)
let chartInstance = null
const canvasId = `eri-gauge-${Math.random().toString(36).substring(7)}`

// Calculate gauge color based on value
function getGaugeColor(value) {
  if (value >= 4) return '#10B981' // Excellent - Green
  if (value >= 3) return '#60A5FA' // Good - Blue
  if (value >= 2) return '#F59E0B' // Fair - Orange
  return '#EF4444' // Poor - Red
}

// Get rating text based on value
function getRatingText(value) {
  if (value >= 4) return 'Excellent'
  if (value >= 3) return 'Good'
  if (value >= 2) return 'Fair'
  return 'Poor'
}

// Calculate angle for value (1-5 scale mapped to 180 degree arc)
function valueToAngle(value) {
  // Map 1-5 to -90 to 90 degrees
  const normalized = (value - 1) / 4 // 0-1
  return -90 + (normalized * 180)
}

onMounted(() => {
  createGauge()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})

watch(() => props.value, () => {
  if (chartInstance) {
    updateGauge()
  }
})

// Watch for national prop changes to redraw the chart with the national line
watch(() => props.national, () => {
  if (chartInstance && props.national) {
    // Destroy and recreate the chart to show the national line
    chartInstance.destroy()
    createGauge()
  }
})

function createGauge() {
  const ctx = chartCanvas.value?.getContext('2d')
  if (!ctx) return

  // Create colored segments for the gauge
  const segments = [
    { value: 1, color: '#EF4444' },  // 1-2: Poor (Red)
    { value: 1, color: '#F59E0B' },  // 2-3: Fair (Orange)
    { value: 1, color: '#60A5FA' },  // 3-4: Good (Blue)
    { value: 1, color: '#10B981' }   // 4-5: Excellent (Green)
  ]

  const data = {
    datasets: [
      // Background segments showing color zones
      {
        data: segments.map(s => s.value),
        backgroundColor: segments.map(s => s.color + '40'), // 40% opacity
        borderWidth: 0,
        circumference: 180,
        rotation: 270
      },
      // Actual value indicator
      {
        data: [props.value - 1, 5 - props.value],
        backgroundColor: [
          getGaugeColor(props.value),
          'transparent'
        ],
        borderWidth: 2,
        borderColor: [
          getGaugeColor(props.value),
          'transparent'
        ],
        circumference: 180,
        rotation: 270
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    cutout: '70%'
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: options,
    plugins: [{
      afterDatasetsDraw: (chart) => {
        // Draw national average indicator if provided
        if (props.national && props.national > 0) {
          const { ctx, chartArea } = chart
          
          // Get proper center from chart area
          const centerX = (chartArea.left + chartArea.right) / 2
          const centerY = (chartArea.top + chartArea.bottom) / 2
          
          // Get the arc dimensions from the dataset meta
          const meta = chart.getDatasetMeta(0)
          if (!meta.data || !meta.data[0]) return
          
          const arc = meta.data[0]
          const innerRadius = arc.innerRadius
          const outerRadius = arc.outerRadius
          
          // Calculate angle for national average
          // Gauge is 180 degrees, from 180 (left) to 360 (right)
          const normalizedValue = (props.national - 1) / 4 // 0-1 for 1-5 scale
          const angleInDegrees = 180 + (normalizedValue * 180) // 180 to 360 degrees
          const angleInRadians = angleInDegrees * (Math.PI / 180)
          
          ctx.save()
          
          // Draw shadow line first
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
          ctx.lineWidth = 5
          ctx.beginPath()
          ctx.moveTo(centerX + Math.cos(angleInRadians) * (innerRadius - 10), 
                     centerY + Math.sin(angleInRadians) * (innerRadius - 10))
          ctx.lineTo(centerX + Math.cos(angleInRadians) * (outerRadius + 10), 
                     centerY + Math.sin(angleInRadians) * (outerRadius + 10))
          ctx.stroke()
          
          // Draw yellow line on top
          ctx.strokeStyle = '#FFD93D'
          ctx.lineWidth = 3
          ctx.setLineDash([])  // Solid line
          ctx.beginPath()
          ctx.moveTo(centerX + Math.cos(angleInRadians) * (innerRadius - 10), 
                     centerY + Math.sin(angleInRadians) * (innerRadius - 10))
          ctx.lineTo(centerX + Math.cos(angleInRadians) * (outerRadius + 10), 
                     centerY + Math.sin(angleInRadians) * (outerRadius + 10))
          ctx.stroke()
          
          // Add text label with background
          const labelX = centerX + Math.cos(angleInRadians) * (outerRadius + 25)
          const labelY = centerY + Math.sin(angleInRadians) * (outerRadius + 25)
          
          const text = `National: ${props.national.toFixed(1)}`
          ctx.font = 'bold 11px sans-serif'
          const textMetrics = ctx.measureText(text)
          const textWidth = textMetrics.width
          
          // Draw background for text
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.fillRect(labelX - textWidth/2 - 4, labelY - 8, textWidth + 8, 16)
          
          // Draw text
          ctx.fillStyle = '#FFD93D'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(text, labelX, labelY)
          
          ctx.restore()
        }
      }
    }]
  })
}

function updateGauge() {
  if (!chartInstance) return
  
  // Update the value indicator (second dataset)
  chartInstance.data.datasets[1].data = [props.value - 1, 5 - props.value]
  chartInstance.data.datasets[1].backgroundColor[0] = getGaugeColor(props.value)
  chartInstance.data.datasets[1].borderColor[0] = getGaugeColor(props.value)
  chartInstance.update()
}
</script>

<style scoped>
.eri-speedometer {
  position: relative;
  display: inline-block;
}

.eri-value {
  position: absolute;
  top: 85%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1;
}

.label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.rating {
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

canvas {
  max-width: 100%;
  height: auto !important;
}
</style>