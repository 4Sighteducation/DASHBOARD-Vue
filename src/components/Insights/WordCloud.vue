<template>
  <div class="wordcloud-container">
    <canvas ref="wordCloudCanvas" id="wordCloudCanvas"></canvas>
    <div v-if="!isLoading && (!data || !data.wordCloudData || data.wordCloudData.length === 0)" class="no-data-message">
      <p>{{ data?.message || 'No comment data available for word cloud.' }}</p>
    </div>
    <div v-if="stats && stats.totalComments > 0" class="word-cloud-stats">
      <span>Total Comments: {{ stats.totalComments }}</span>
      <span>Unique Words: {{ stats.uniqueWords }}</span>
      <span v-if="stats.topWord">Most Common: "{{ stats.topWord[0] }}" ({{ stats.topWord[1] }} times)</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  data: Object // Expecting { wordCloudData, totalComments, uniqueWords, topWord }
})

const wordCloudCanvas = ref(null)
const stats = ref(null)
const isLoading = ref(true)
const libraryLoaded = ref(false)

function generateWordCloud() {
  if (!props.data || !props.data.wordCloudData || !wordCloudCanvas.value) {
    console.warn('WordCloud dependencies not ready')
    isLoading.value = false
    return
  }
  
  // Update stats
  stats.value = {
    totalComments: props.data.totalComments || 0,
    uniqueWords: props.data.uniqueWords || 0,
    topWord: props.data.topWord || null
  }
  
  // If no data, show message
  if (props.data.wordCloudData.length === 0) {
    isLoading.value = false
    return
  }
  
  // Always use fallback rendering for now to ensure it works
  renderFallback()
  isLoading.value = false
}

function renderFallback() {
  const canvas = wordCloudCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const container = canvas.parentElement
  
  // Set canvas dimensions
  const containerWidth = container.offsetWidth || 800
  const containerHeight = 400
  canvas.width = containerWidth
  canvas.height = containerHeight
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  if (!props.data?.wordCloudData || props.data.wordCloudData.length === 0) {
    ctx.font = '20px Inter, sans-serif'
    ctx.fillStyle = '#999'
    ctx.textAlign = 'center'
    ctx.fillText('No words to display', canvas.width / 2, canvas.height / 2)
    return
  }
  
  // Create a more visually appealing fallback word cloud
  const words = props.data.wordCloudData.slice(0, 30) // Take top 30 words
  const colors = ['#ff8f00', '#86b4f0', '#72cb44', '#7f31a4', '#f032e6', '#ffd93d']
  
  // Calculate positions in a cloud-like pattern
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const positions = []
  
  // Generate spiral positions
  let angle = 0
  let radius = 0
  
  words.forEach((word, index) => {
    // Calculate position in spiral
    angle += 0.5
    radius = 10 + (index * 8)
    
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    
    // Check for overlaps (simplified)
    let finalX = x
    let finalY = y
    let attempts = 0
    
    while (attempts < 10 && positions.some(pos => 
      Math.abs(pos.x - finalX) < 60 && Math.abs(pos.y - finalY) < 30
    )) {
      angle += 0.3
      radius += 5
      finalX = centerX + Math.cos(angle) * radius
      finalY = centerY + Math.sin(angle) * radius
      attempts++
    }
    
    positions.push({ x: finalX, y: finalY, word: word.text, size: word.size })
  })
  
  // Draw words
  positions.forEach((pos, index) => {
    const fontSize = Math.max(12, Math.min(48, pos.size))
    ctx.font = `${fontSize}px Inter, sans-serif`
    ctx.fillStyle = colors[index % colors.length]
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Add slight rotation for variety
    ctx.save()
    ctx.translate(pos.x, pos.y)
    const rotation = (Math.random() - 0.5) * 0.3
    ctx.rotate(rotation)
    ctx.fillText(pos.word, 0, 0)
    ctx.restore()
  })
}

onMounted(async () => {
  await nextTick()
  isLoading.value = true
  generateWordCloud()
})

watch(() => props.data, async () => {
  await nextTick()
  isLoading.value = true
  generateWordCloud()
}, { deep: true })

// Handle window resize
onMounted(() => {
  let resizeTimeout
  const handleResize = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      generateWordCloud()
    }, 250)
  }
  window.addEventListener('resize', handleResize)
  
  // Cleanup
  return () => {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
.wordcloud-container {
  position: relative;
  width: 100%;
  height: 450px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

#wordCloudCanvas {
  width: 100%;
  height: 400px;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  padding: 2rem;
}

.word-cloud-stats {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 2rem;
  font-size: 0.85rem;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.word-cloud-stats span {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .wordcloud-container {
    height: 350px;
  }
  
  #wordCloudCanvas {
    height: 300px;
  }
  
  .word-cloud-stats {
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.75rem;
    bottom: 0.5rem;
    right: 0.5rem;
  }
}
</style>