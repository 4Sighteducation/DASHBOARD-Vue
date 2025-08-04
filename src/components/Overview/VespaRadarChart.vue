<template>
  <div class="chart-container" :style="{ width: size + 'px', height: size + 'px' }">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  data: Object,
  size: {
    type: Number,
    default: 300
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const vespaColors = {
  vision: '#ff8f00',
  effort: '#86b4f0',
  systems: '#72cb44',
  practice: '#7f31a4',
  attitude: '#f032e6'
}

function createChart() {
  if (!props.data || !chartCanvas.value) return
  
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const ctx = chartCanvas.value.getContext('2d')
  
  const datasets = []
  
  // School data - check if it's nested or direct
  const schoolData = props.data.school || props.data
  if (schoolData) {
    datasets.push({
      label: 'School Average',
      data: [
        schoolData.vision || 0,
        schoolData.effort || 0,
        schoolData.systems || 0,
        schoolData.practice || 0,
        schoolData.attitude || 0
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#3b82f6'
    })
    
    // Add national data if available
    const nationalData = props.data.national || {
      vision: schoolData.nationalVision,
      effort: schoolData.nationalEffort,
      systems: schoolData.nationalSystems,
      practice: schoolData.nationalPractice,
      attitude: schoolData.nationalAttitude
    }
    
    // Only add if we have national values
    if (nationalData.vision || nationalData.effort || nationalData.systems || nationalData.practice || nationalData.attitude) {
      datasets.push({
        label: 'National Average',
        data: [
          nationalData.vision || 0,
          nationalData.effort || 0,
          nationalData.systems || 0,
          nationalData.practice || 0,
          nationalData.attitude || 0
        ],
        backgroundColor: 'rgba(255, 217, 61, 0.1)',
        borderColor: '#FFD93D',
        borderWidth: 2,
        pointBackgroundColor: '#FFD93D',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#FFD93D',
        borderDash: [5, 5]
      })
    }
  }
  
  chartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Vision', 'Effort', 'Systems', 'Practice', 'Attitude'],
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#a8b2d1',
            padding: 20
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 10,
          ticks: {
            color: '#64748b',
            backdropColor: 'transparent',
            stepSize: 2
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          pointLabels: {
            color: '#a8b2d1',
            font: {
              size: 12,
              weight: '500'
            }
          }
        }
      }
    }
  })
}

onMounted(() => {
  createChart()
})

watch(() => props.data, () => {
  createChart()
}, { deep: true })
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}
</style>