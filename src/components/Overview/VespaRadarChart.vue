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
  
  // School data
  if (props.data.school) {
    datasets.push({
      label: 'School Average',
      data: [
        props.data.school.vision || 0,
        props.data.school.effort || 0,
        props.data.school.systems || 0,
        props.data.school.practice || 0,
        props.data.school.attitude || 0
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#3b82f6'
    })
  }
  
  // National data
  if (props.data.national) {
    datasets.push({
      label: 'National Average',
      data: [
        props.data.national.vision || 0,
        props.data.national.effort || 0,
        props.data.national.systems || 0,
        props.data.national.practice || 0,
        props.data.national.attitude || 0
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