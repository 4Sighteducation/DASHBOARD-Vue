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
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'

// WordCloud2 should be loaded by CDN via AppLoader
// We'll check for window.WordCloud when we need it

const props = defineProps({
  data: Object // Expecting { wordCloudData, totalComments, uniqueWords, topWord }
})

const wordCloudCanvas = ref(null)
const stats = ref(null)
const isLoading = ref(true)
let resizeTimeout = null

const generateWordCloud = async () => {
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
  
  const canvas = wordCloudCanvas.value
  const container = canvas.parentElement
  
  // Set canvas dimensions to match prototype
  const containerWidth = container.offsetWidth || 800
  const containerHeight = 400
  canvas.width = containerWidth
  canvas.height = containerHeight
  
  // Transform data to WordCloud2 format [text, size]
  const words = props.data.wordCloudData.map(item => [item.text, item.size])
  
  console.log('[WordCloud Component] Rendering word cloud with', words.length, 'words')
  console.log('[WordCloud Component] First 5 words:', words.slice(0, 5))
  console.log('[WordCloud Component] Canvas dimensions:', canvas.width, 'x', canvas.height)
  
  try {
    // Clear previous content
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Check if WordCloud is available on window
    const WordCloudFunc = window.WordCloud
    
    if (!WordCloudFunc) {
      console.error('[WordCloud Component] WordCloud2 not available in generateWordCloud, using fallback')
      
      // Debug what's actually available on window
      console.log('[WordCloud Debug] Checking window properties:')
      console.log('  window.WordCloud:', window.WordCloud)
      console.log('  window.wordcloud:', window.wordcloud)
      console.log('  window.WordCloud2:', window.WordCloud2)
      console.log('  window.wordCloud:', window.wordCloud)
      
      // Check if the script tag exists
      const scripts = Array.from(document.getElementsByTagName('script'))
      const wcScript = scripts.find(s => s.src && s.src.includes('wordcloud'))
      console.log('[WordCloud Debug] WordCloud script tag:', wcScript ? wcScript.src : 'NOT FOUND')
      
      renderSimpleFallback()
      isLoading.value = false
      return
    }
    
    console.log('[WordCloud Component] Calling WordCloud2 with config...')
    
    // Use WordCloud2 with configuration matching the prototype exactly
    WordCloudFunc(canvas, {
      list: words,
      // Grid size affects spacing between words
      gridSize: Math.round(16 * containerWidth / 1024),
      // Weight factor determines how size values are transformed
      weightFactor: function(size) {
        return Math.pow(size, 1.5) * containerWidth / 1024
      },
      // Font family matching prototype
      fontFamily: 'Inter, sans-serif',
      // Color function using VESPA theme colors exactly like prototype
      color: function(word, weight) {
        const colors = [
          '#ff8f00', // Vision orange
          '#86b4f0', // Effort blue
          '#72cb44', // Systems green
          '#7f31a4', // Practice purple
          '#f032e6', // Attitude pink
          '#ffd93d'  // Overall yellow
        ]
        return colors[Math.floor(Math.random() * colors.length)]
      },
      // Rotation settings - 50% of words will be rotated
      rotateRatio: 0.5,
      rotationSteps: 2, // Only horizontal and vertical
      // Background transparent like prototype
      backgroundColor: 'transparent',
      // Minimum font size
      minSize: 12,
      // Don't draw words outside canvas bounds
      drawOutOfBound: false,
      // Shrink words to fit if needed
      shrinkToFit: true,
      // Optional: Add hover effects
      hover: function(item) {
        if (item) {
          canvas.style.cursor = 'pointer'
        } else {
          canvas.style.cursor = 'default'
        }
      },
      // Optional: Click handler
      click: function(item) {
        if (item) {
          console.log('Word clicked:', item[0], 'Count:', item[1])
        }
      }
    })
    
    console.log('[WordCloud Component] window.WordCloud called successfully!')
    
    // Add a callback to verify it's actually rendering
    setTimeout(() => {
      const ctx = canvas.getContext('2d')
      const imageData = ctx.getImageData(0, 0, 10, 10)
      const hasContent = imageData.data.some(pixel => pixel !== 0)
      console.log('[WordCloud Component] Canvas has content after WordCloud2:', hasContent)
      
      if (!hasContent) {
        console.warn('[WordCloud Component] WordCloud2 might not have rendered anything!')
      }
    }, 1000)
    
  } catch (error) {
    console.error('[WordCloud Component] WordCloud2 rendering error:', error)
    console.error('[WordCloud Component] Error stack:', error.stack)
    // If WordCloud2 fails, use simple fallback
    renderSimpleFallback()
  }
  
  isLoading.value = false
}

const renderSimpleFallback = () => {
  const canvas = wordCloudCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Simple message for fallback
  ctx.font = '20px Inter, sans-serif'
  ctx.fillStyle = '#999'
  ctx.textAlign = 'center'
  ctx.fillText('Word cloud rendering failed - please refresh', canvas.width / 2, canvas.height / 2)
}

const handleResize = () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    generateWordCloud()
  }, 250)
}

onMounted(async () => {
  console.log('[WordCloud Component] Mounted, checking for data...')
  console.log('[WordCloud Component] Props data:', props.data)
  
  await nextTick()
  
  // Wait for WordCloud2 to be available (with multiple retries)
  let retries = 0
  const maxRetries = 10
  const checkInterval = 200 // Check every 200ms
  
  const checkAndGenerate = () => {
    console.log(`[WordCloud Component] Checking for WordCloud2, attempt ${retries + 1}`)
    console.log('[WordCloud Component] window.WordCloud type:', typeof window.WordCloud)
    
    // Check if WordCloud is available (it should be on window after CDN loads)
    const hasWordCloud = (typeof window.WordCloud !== 'undefined')
    
    if (hasWordCloud) {
      console.log('[WordCloud Component] WordCloud2 found! Generating word cloud...')
      isLoading.value = true
      generateWordCloud()
    } else if (retries < maxRetries) {
      retries++
      console.log(`[WordCloud Component] WordCloud2 not ready, retry ${retries}/${maxRetries}...`)
      setTimeout(checkAndGenerate, checkInterval)
    } else {
      console.error('[WordCloud Component] WordCloud2 not available after all retries, using fallback')
      isLoading.value = true
      generateWordCloud() // Will use fallback
    }
  }
  
  // Start checking after a small delay to ensure everything is loaded
  setTimeout(() => {
    checkAndGenerate()
  }, 500)
  
  // Add resize listener
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
})

watch(() => props.data, async (newData) => {
  if (newData) {
    await nextTick()
    isLoading.value = true
    setTimeout(() => {
      generateWordCloud()
    }, 100)
  }
}, { deep: true })
</script>

<style scoped>
/* Container matching prototype styling */
.wordcloud-container {
  position: relative;
  width: 100%;
  min-height: 400px;
  background: var(--secondary-bg, #1a1a2e);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-lg, 1.5rem);
  padding: var(--spacing-lg, 2rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Canvas styling matching prototype */
#wordCloudCanvas {
  width: 100%;
  height: 350px;
  cursor: pointer;
}

/* No data message styling */
.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-muted, #64748b);
  font-size: 1.1rem;
  padding: 2rem;
}

/* Stats styling matching prototype exactly */
.word-cloud-stats {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 2rem;
  font-size: 0.85rem;
  color: var(--text-muted, #64748b);
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm, 0.5rem);
  backdrop-filter: blur(10px);
}

.word-cloud-stats span {
  white-space: nowrap;
}

/* Responsive design */
@media (max-width: 768px) {
  .wordcloud-container {
    min-height: 350px;
    padding: var(--spacing-md, 1.5rem);
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

/* Loading state */
.wordcloud-container.loading {
  opacity: 0.7;
}

/* Animation for word cloud appearance */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

#wordCloudCanvas {
  animation: fadeIn 0.5s ease-in;
}
</style>