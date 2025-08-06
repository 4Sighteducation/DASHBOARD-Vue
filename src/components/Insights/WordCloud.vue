<template>
  <div class="wordcloud-container">
    <canvas ref="wordCloudCanvas" id="wordCloudCanvas"></canvas>
    <div v-if="stats" class="word-cloud-stats">
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

function generateWordCloud() {
  if (!props.data || !props.data.wordCloudData || !wordCloudCanvas.value) {
    console.warn('WordCloud dependencies not ready')
    return
  }
  
  // Update stats
  stats.value = {
    totalComments: props.data.totalComments || 0,
    uniqueWords: props.data.uniqueWords || 0,
    topWord: props.data.topWord || null
  }
  
  // Check if WordCloud2 library is available
  if (!window.WordCloud) {
    console.warn('WordCloud2 library not loaded, loading now...')
    loadWordCloud2Library().then(() => {
      renderWordCloud()
    })
    return
  }
  
  renderWordCloud()
}

function renderWordCloud() {
  if (!window.WordCloud || !wordCloudCanvas.value || !props.data?.wordCloudData) {
    return
  }
  
  const canvas = wordCloudCanvas.value
  const container = canvas.parentElement
  
  // Set canvas dimensions based on container
  const containerWidth = container.offsetWidth || 800
  const containerHeight = 400
  canvas.width = containerWidth
  canvas.height = containerHeight
  
  // Convert data to WordCloud2 format
  const words = props.data.wordCloudData.map(item => [item.text, item.size])
  
  if (words.length === 0) {
    // Clear canvas and show message
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = '20px Inter, sans-serif'
    ctx.fillStyle = '#999'
    ctx.textAlign = 'center'
    ctx.fillText('No words to display', canvas.width / 2, canvas.height / 2)
    return
  }
  
  try {
    // Configure word cloud with original colors
    WordCloud(canvas, {
      list: words,
      gridSize: Math.round(16 * containerWidth / 1024),
      weightFactor: function(size) {
        return Math.pow(size, 1.3) * containerWidth / 1024
      },
      fontFamily: 'Inter, sans-serif',
      color: function(word, weight) {
        // Use the exact colors from the original implementation
        const colors = ['#ff8f00', '#86b4f0', '#72cb44', '#7f31a4', '#f032e6', '#ffd93d']
        return colors[Math.floor(Math.random() * colors.length)]
      },
      rotateRatio: 0.5,
      rotationSteps: 2,
      backgroundColor: 'transparent',
      minSize: 12,
      drawOutOfBound: false,
      shrinkToFit: true,
      hover: function(item) {
        // Optional: Add hover effect
        if (item) {
          canvas.style.cursor = 'pointer'
          canvas.title = item[0] + ': ' + item[1] + ' occurrences'
        } else {
          canvas.style.cursor = 'default'
          canvas.title = ''
        }
      }
    })
  } catch (error) {
    console.error('WordCloud2 rendering error:', error)
    // Fallback to simple display
    renderFallback()
  }
}

function renderFallback() {
  const canvas = wordCloudCanvas.value
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Display top words as text
  if (props.data?.wordCloudData) {
    const topWords = props.data.wordCloudData.slice(0, 10)
    ctx.font = '16px Inter, sans-serif'
    ctx.fillStyle = '#666'
    
    let y = 30
    topWords.forEach((word, index) => {
      const size = 20 - index
      ctx.font = `${size}px Inter, sans-serif`
      ctx.fillStyle = ['#ff8f00', '#86b4f0', '#72cb44'][index % 3]
      ctx.fillText(word.text, 20, y)
      y += size + 10
    })
  }
}

function loadWordCloud2Library() {
  return new Promise((resolve, reject) => {
    if (window.WordCloud) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/gh/timdream/wordcloud2.js@1.2.2/src/wordcloud2.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  // Load WordCloud2 library if not already loaded
  if (!window.WordCloud) {
    await loadWordCloud2Library()
  }
  // Wait for next tick to ensure canvas is ready
  await nextTick()
  generateWordCloud()
})

watch(() => props.data, async () => {
  await nextTick()
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