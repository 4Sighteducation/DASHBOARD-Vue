<template>
  <div class="test-wordcloud">
    <h3>Test WordCloud Component</h3>
    <p>WordCloud2 available: {{ wordCloudAvailable }}</p>
    <p>Data available: {{ dataAvailable }}</p>
    <button @click="testGenerate">Test Generate</button>
    <canvas ref="testCanvas" width="600" height="400" style="border: 1px solid #ccc;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  data: Object
})

const testCanvas = ref(null)
const wordCloudAvailable = computed(() => typeof window.WordCloud !== 'undefined')
const dataAvailable = computed(() => props.data?.wordCloudData?.length > 0)

const testGenerate = () => {
  console.log('Test Generate clicked')
  console.log('Canvas:', testCanvas.value)
  console.log('window.WordCloud:', window.WordCloud)
  console.log('Data:', props.data)
  
  if (!testCanvas.value) {
    console.error('No canvas!')
    return
  }
  
  if (!window.WordCloud) {
    console.error('No WordCloud2!')
    return
  }
  
  // Simple test data
  const testWords = [
    ['test', 100],
    ['word', 80],
    ['cloud', 60],
    ['working', 40],
    ['now', 20]
  ]
  
  console.log('Calling WordCloud with test data...')
  
  try {
    window.WordCloud(testCanvas.value, {
      list: testWords,
      gridSize: 8,
      weightFactor: 10,
      color: '#ff8f00',
      fontFamily: 'Inter, sans-serif',
      backgroundColor: 'transparent'
    })
    console.log('WordCloud called successfully!')
  } catch (e) {
    console.error('WordCloud error:', e)
  }
}

onMounted(() => {
  console.log('[TestWordCloud] Mounted')
  console.log('[TestWordCloud] window.WordCloud:', typeof window.WordCloud)
  console.log('[TestWordCloud] Canvas:', testCanvas.value)
  
  // Auto-test after 1 second
  setTimeout(() => {
    console.log('[TestWordCloud] Auto-testing...')
    testGenerate()
  }, 1000)
})
</script>

<style scoped>
.test-wordcloud {
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin: 20px 0;
}
</style>