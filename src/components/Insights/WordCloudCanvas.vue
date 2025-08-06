<template>
  <div class="word-cloud-wrapper">
    <canvas ref="wordCanvas" class="word-cloud-canvas"></canvas>
    <div v-if="stats && stats.totalComments > 0" class="word-cloud-stats">
      <div class="stat">
        <span class="stat-label">COMMENTS</span>
        <span class="stat-value">{{ stats.totalComments }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">UNIQUE WORDS</span>
        <span class="stat-value">{{ stats.uniqueWords }}</span>
      </div>
      <div v-if="stats.topWord" class="stat">
        <span class="stat-label">MOST COMMON</span>
        <span class="stat-value">"{{ stats.topWord[0] }}" ({{ stats.topWord[1] }}×)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  data: Object
})

const wordCanvas = ref(null)
const stats = ref(null)

class WordCloudRenderer {
  constructor(canvas, words) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.words = words
    this.colors = ['#ff8f00', '#86b4f0', '#72cb44', '#7f31a4', '#f032e6', '#ffd93d']
    this.placedWords = []
  }

  render() {
    // Set canvas size
    const container = this.canvas.parentElement
    this.canvas.width = container.offsetWidth || 800
    this.canvas.height = 400
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Center point
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    
    // Sort words by size (largest first)
    const sortedWords = [...this.words].sort((a, b) => b.size - a.size)
    
    // Place words
    sortedWords.forEach((word, index) => {
      // Calculate font size using similar formula to original
      const fontSize = Math.min(60, Math.max(14, Math.pow(word.size, 1.5) * this.canvas.width / 1024))
      
      // Set font
      this.ctx.font = `${fontSize}px Inter, sans-serif`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      
      // Get text dimensions
      const metrics = this.ctx.measureText(word.text)
      const wordWidth = metrics.width
      const wordHeight = fontSize
      
      // Find position using spiral placement
      let placed = false
      let spiralAngle = 0
      let spiralRadius = 0
      let attempts = 0
      const maxAttempts = 500
      
      while (!placed && attempts < maxAttempts) {
        // Calculate position in spiral
        const x = centerX + Math.cos(spiralAngle) * spiralRadius
        const y = centerY + Math.sin(spiralAngle) * spiralRadius
        
        // Check if position is valid
        if (this.canPlaceWord(x, y, wordWidth, wordHeight)) {
          // Randomly rotate some words (50% chance)
          const shouldRotate = Math.random() < 0.5
          const rotation = shouldRotate ? (Math.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2) : 0
          
          // Draw the word
          this.ctx.save()
          this.ctx.translate(x, y)
          this.ctx.rotate(rotation)
          
          // Set color
          this.ctx.fillStyle = this.colors[index % this.colors.length]
          
          // Draw text
          this.ctx.fillText(word.text, 0, 0)
          
          this.ctx.restore()
          
          // Store placed word position
          this.placedWords.push({
            x: x,
            y: y,
            width: rotation !== 0 ? wordHeight : wordWidth,
            height: rotation !== 0 ? wordWidth : wordHeight,
            rotation: rotation
          })
          
          placed = true
        }
        
        // Move along spiral
        spiralAngle += 0.1
        spiralRadius += 1
        attempts++
      }
    })
  }
  
  canPlaceWord(x, y, width, height) {
    // Check canvas bounds
    if (x - width/2 < 0 || x + width/2 > this.canvas.width ||
        y - height/2 < 0 || y + height/2 > this.canvas.height - 60) { // Leave space for stats
      return false
    }
    
    // Check overlap with other words
    for (const placed of this.placedWords) {
      const dx = Math.abs(x - placed.x)
      const dy = Math.abs(y - placed.y)
      const minDistX = (width + placed.width) / 2 + 5
      const minDistY = (height + placed.height) / 2 + 5
      
      if (dx < minDistX && dy < minDistY) {
        return false
      }
    }
    
    return true
  }
}

function generateWordCloud() {
  if (!props.data || !props.data.wordCloudData || !wordCanvas.value) {
    return
  }
  
  // Update stats
  stats.value = {
    totalComments: props.data.totalComments || 0,
    uniqueWords: props.data.uniqueWords || 0,
    topWord: props.data.topWord || null
  }
  
  // Take top words for display
  const words = props.data.wordCloudData.slice(0, 50)
  
  if (words.length === 0) {
    const ctx = wordCanvas.value.getContext('2d')
    ctx.clearRect(0, 0, wordCanvas.value.width, wordCanvas.value.height)
    ctx.font = '20px Inter, sans-serif'
    ctx.fillStyle = '#666'
    ctx.textAlign = 'center'
    ctx.fillText('No words to display', wordCanvas.value.width / 2, wordCanvas.value.height / 2)
    return
  }
  
  // Create and render word cloud
  const renderer = new WordCloudRenderer(wordCanvas.value, words)
  renderer.render()
}

onMounted(async () => {
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
  
  return () => {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
.word-cloud-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.word-cloud-canvas {
  width: 100%;
  height: 400px;
  display: block;
}

.word-cloud-stats {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 2rem;
  background: rgba(0, 0, 0, 0.8);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.65rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
}

.stat-value {
  font-size: 1rem;
  color: #fff;
  font-weight: 600;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .word-cloud-stats {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
  
  .stat {
    flex-direction: row;
    gap: 0.5rem;
    justify-content: space-between;
    width: 100%;
  }
  
  .stat-label {
    font-size: 0.6rem;
  }
  
  .stat-value {
    font-size: 0.85rem;
  }
}
</style>