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
watch(() => props.national, (newVal, oldVal) => {
  console.log('[ERISpeedometer] National value changed:', oldVal, '->', newVal)
  if (chartInstance && newVal !== null && newVal !== undefined) {
    // Destroy and recreate the chart to show the national line
    chartInstance.destroy()
    createGauge()
  }
}, { immediate: true })

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
    cutout: '70%',
    // Add onComplete callback to draw national line after chart renders
    animation: {
      onComplete: function() {
        drawNationalLine()
      }
    }
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: options
  })
}

function drawNationalLine() {
  if (!chartInstance || !props.national || props.national <= 0) return
  
  console.log('[ERISpeedometer] Drawing national line at:', props.national)
  
  const ctx = chartInstance.ctx
  const chart = chartInstance
  const centerX = chart.width / 2
  const centerY = chart.height / 2
  
  // Get the actual chart dimensions
  const meta = chart.getDatasetMeta(0)
  if (!meta.data || !meta.data[0]) return
  
  const arc = meta.data[0]
  const innerRadius = arc.innerRadius
  const outerRadius = arc.outerRadius
  
  // Calculate angle for national average
  // The gauge is a semi-circle from left (1) to right (5)
  // Chart.js doughnut starts at -90 degrees (top) by default
  // With rotation: 270, it starts at 180 degrees (left side)
  // We need to map 1-5 scale to 180-360 degrees (left to right)
  const normalizedValue = (props.national - 1) / 4 // 0-1 for 1-5 scale
  const angleInDegrees = 180 + (normalizedValue * 180) // 180 to 360 degrees
  const angleInRadians = angleInDegrees * (Math.PI / 180)
  
  // Draw the national line
  ctx.save()
  
  // Yellow line
  ctx.strokeStyle = '#FFD93D'
  ctx.lineWidth = 3
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  
  ctx.beginPath()
  ctx.moveTo(
    centerX + Math.cos(angleInRadians) * (innerRadius - 5),
    centerY + Math.sin(angleInRadians) * (innerRadius - 5)
  )
  ctx.lineTo(
    centerX + Math.cos(angleInRadians) * (outerRadius + 5),
    centerY + Math.sin(angleInRadians) * (outerRadius + 5)
  )
  ctx.stroke()
  
  // Add text label
  const textX = centerX + Math.cos(angleInRadians) * (outerRadius + 20)
  const textY = centerY + Math.sin(angleInRadians) * (outerRadius + 20)
  
  // Reset shadow for text
  ctx.shadowBlur = 0
  ctx.fillStyle = '#FFD93D'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`National ERI - ${props.national}`, textX, textY)
  
  ctx.restore()
}

function updateGauge() {
  if (!chartInstance) return
  
  // Update the value indicator (second dataset)
  chartInstance.data.datasets[1].data = [props.value - 1, 5 - props.value]
  chartInstance.data.datasets[1].backgroundColor[0] = getGaugeColor(props.value)
  chartInstance.data.datasets[1].borderColor[0] = getGaugeColor(props.value)
  chartInstance.update()
  
  // Redraw national line after update
  setTimeout(() => drawNationalLine(), 100)
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