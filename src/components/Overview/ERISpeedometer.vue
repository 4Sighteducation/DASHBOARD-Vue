<template>
  <div class="eri-speedometer" :style="{ width: size + 'px', height: size + 'px' }">
    <canvas :id="canvasId" ref="chartCanvas"></canvas>
    <div class="eri-value">
      <div class="value">{{ value.toFixed(1) }}</div>
      <div class="label">ERI</div>
      <div class="vs-national" v-if="national">
        vs {{ national.toFixed(1) }} national
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

function createGauge() {
  const ctx = chartCanvas.value?.getContext('2d')
  if (!ctx) return

  // Create a doughnut chart that looks like a gauge
  const data = {
    datasets: [{
      data: [props.value - 1, 5 - props.value], // Current value and remaining
      backgroundColor: [
        getGaugeColor(props.value),
        'rgba(255, 255, 255, 0.1)'
      ],
      borderWidth: 0,
      circumference: 180,
      rotation: 270
    }]
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
    cutout: '75%'
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: options
  })
}

function updateGauge() {
  if (!chartInstance) return
  
  chartInstance.data.datasets[0].data = [props.value - 1, 5 - props.value]
  chartInstance.data.datasets[0].backgroundColor[0] = getGaugeColor(props.value)
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
  top: 65%;
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

.vs-national {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
  opacity: 0.8;
}

canvas {
  max-width: 100%;
  height: auto !important;
}
</style>