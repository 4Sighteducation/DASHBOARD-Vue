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
  
  // Get device pixel ratio for sharp rendering on high DPI displays
  const dpr = window.devicePixelRatio || 1
  
  // Set canvas dimensions - use larger size for better quality
  const containerWidth = container.offsetWidth || 800
  const containerHeight = 450 // Slightly taller for better word distribution
  
  // Set canvas size for high DPI displays
  canvas.width = containerWidth * dpr
  canvas.height = containerHeight * dpr
  
  // Scale canvas back down using CSS for proper display size
  canvas.style.width = containerWidth + 'px'
  canvas.style.height = containerHeight + 'px'
  
  // Transform data to WordCloud2 format [text, size]
  // Limit to top 60 words to prevent overcrowding
  const words = props.data.wordCloudData.slice(0, 60).map(item => [item.text, item.size])
  
  // Log to check if sizes are correct
  console.log('[WordCloud Component] Top 10 words with sizes:', words.slice(0, 10))
  
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
    console.log('[WordCloud Component] DPR:', dpr, 'Canvas actual size:', canvas.width, 'x', canvas.height)
    
    // Use WordCloud2 with configuration adjusted for DPR
    WordCloudFunc(canvas, {
      list: words,
      // Grid size affects spacing between words - smaller = tighter packing
      gridSize: Math.round(12), // Standard grid size
      // Weight factor determines how size values are transformed
      weightFactor: function(size) {
        // The size value is the actual count/frequency
        // Scale it to appropriate font size
        const baseSize = Math.sqrt(size) * 8 // Square root for better distribution
        const scaleFactor = containerWidth / 1000 // Scale based on container width
        
        // Return the calculated font size
        return baseSize * scaleFactor
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
      // Minimum font size (adjusted for DPR)
      minSize: Math.round(10 * dpr),
      // Don't draw words outside canvas bounds
      drawOutOfBound: false,
      // Don't shrink - we control size with weightFactor
      shrinkToFit: false,
      // Set origin to center of canvas
      origin: [canvas.width / 2, canvas.height / 2],
      // Clear canvas before drawing
      clearCanvas: true,
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
  console.log('[WordCloud Component] Canvas ref:', wordCloudCanvas.value)
  
  // Check if we have data to render
  if (!props.data || !props.data.wordCloudData || props.data.wordCloudData.length === 0) {
    console.warn('[WordCloud Component] No data available to render')
    return
  }
  
  await nextTick()
  
  // Immediately check if WordCloud2 is available
  console.log('[WordCloud Component] Immediate check - window.WordCloud:', typeof window.WordCloud)
  
  if (typeof window.WordCloud !== 'undefined') {
    console.log('[WordCloud Component] WordCloud2 already available! Generating immediately...')
    isLoading.value = true
    generateWordCloud()
    return
  }
  
  // If not immediately available, wait with retries
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
  console.log('[WordCloud Component] Watch triggered - data changed:', newData)
  if (newData && newData.wordCloudData && newData.wordCloudData.length > 0) {
    console.log('[WordCloud Component] Valid data received in watch, generating word cloud...')
    await nextTick()
    isLoading.value = true
    
    // Check if WordCloud2 is available
    if (typeof window.WordCloud !== 'undefined') {
      console.log('[WordCloud Component] WordCloud2 available in watch, generating...')
      generateWordCloud()
    } else {
      console.log('[WordCloud Component] WordCloud2 not yet available in watch, waiting...')
      setTimeout(() => {
        generateWordCloud()
      }, 1000)
    }
  } else {
    console.log('[WordCloud Component] No valid data in watch')
  }
}, { deep: true, immediate: true })
</script>

<style scoped>
/* Container matching prototype styling */
.wordcloud-container {
  position: relative;
  width: 100%;
  min-height: 500px; /* Increased to accommodate taller canvas */
  background: var(--secondary-bg, #1a1a2e);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-lg, 1.5rem);
  padding: var(--spacing-lg, 2rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* Prevent any overflow */
}

/* Canvas styling matching prototype */
#wordCloudCanvas {
  width: 100%;
  max-width: 100%;
  height: auto; /* Let height be set by JS */
  display: block;
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