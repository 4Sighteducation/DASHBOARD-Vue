<template>
  <div class="insights-section">
    <!-- Loading State -->
    <div v-if="loading" class="section-loading">
      <div class="spinner"></div>
      <p>Loading student comment insights...</p>
    </div>

    <!-- Content -->
    <div v-else class="insights-content">
      <!-- Header -->
      <div class="insights-header">
        <h2 class="section-title">Student Comment Analysis</h2>
        <div class="insights-badges">
          <span class="badge badge-primary">{{ academicYear }}</span>
          <span class="badge badge-secondary">{{ cycleLabel }}</span>
        </div>
      </div>

      <!-- Word Cloud Section -->
      <div class="insights-card word-cloud-section">
        <h3 class="card-header">
          <span class="header-icon">💭</span>
          Comment Word Cloud
        </h3>
        <div class="word-cloud-container">
          <div v-if="!wordCloudData || !wordCloudData.wordCloudData || wordCloudData.wordCloudData.length === 0" 
               class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>{{ wordCloudData?.message || 'No comment data available for the selected filters.' }}</p>
          </div>
          <div v-else class="word-cloud-wrapper">
            <div class="word-cloud-display">
              <span v-for="(word, index) in displayWords" 
                    :key="index"
                    :class="['word', getWordColorClass(index)]"
                    :style="getWordStyle(word)">
                {{ word.text }}
              </span>
            </div>
            <div class="word-stats">
              <div class="stat">
                <span class="stat-label">Comments</span>
                <span class="stat-value">{{ wordCloudData.totalComments || 0 }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Unique Words</span>
                <span class="stat-value">{{ wordCloudData.uniqueWords || 0 }}</span>
              </div>
              <div v-if="wordCloudData.topWord" class="stat">
                <span class="stat-label">Most Common</span>
                <span class="stat-value">"{{ wordCloudData.topWord[0] }}" ({{ wordCloudData.topWord[1] }}×)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Themes Section -->
      <div v-if="hasThemes" class="insights-card themes-section">
        <h3 class="card-header">
          <span class="header-icon">🎯</span>
          Key Themes Identified
        </h3>
        <div class="themes-container">
          <!-- Positive Themes -->
          <div class="theme-column">
            <div class="theme-header positive">
              <span class="theme-icon">✨</span>
              <h4>Positive Themes</h4>
            </div>
            <div class="theme-list">
              <div v-for="theme in positiveThemes" 
                   :key="theme.id" 
                   class="theme-item">
                <span class="theme-name">{{ theme.name }}</span>
                <span class="theme-count">{{ theme.count }}</span>
              </div>
              <div v-if="!positiveThemes || positiveThemes.length === 0" class="no-themes">
                No positive themes identified
              </div>
            </div>
          </div>

          <!-- Areas for Improvement -->
          <div class="theme-column">
            <div class="theme-header improvement">
              <span class="theme-icon">📚</span>
              <h4>Areas for Development</h4>
            </div>
            <div class="theme-list">
              <div v-for="theme in improvementThemes" 
                   :key="theme.id" 
                   class="theme-item">
                <span class="theme-name">{{ theme.name }}</span>
                <span class="theme-count">{{ theme.count }}</span>
              </div>
              <div v-if="!improvementThemes || improvementThemes.length === 0" class="no-themes">
                No improvement areas identified
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sample Comments Section -->
      <div v-if="sampleComments && sampleComments.length > 0" class="insights-card comments-section">
        <h3 class="card-header">
          <span class="header-icon">💬</span>
          Recent Student Comments
        </h3>
        <div class="comments-container">
          <div v-for="(comment, index) in sampleComments" 
               :key="index" 
               class="comment-card">
            <div class="comment-quote">"</div>
            <p class="comment-text">{{ comment.text }}</p>
            <div class="comment-footer">
              <span class="comment-badge">Year {{ comment.yearGroup }}</span>
              <span class="comment-date">{{ formatDate(comment.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="!hasAnyData" class="insights-card empty-state-card">
        <div class="empty-icon">💬</div>
        <h3>No Comment Data Available</h3>
        <p>Comment insights will appear here once student comments are available for the selected filters.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: Object,
  filters: Object,
  loading: Boolean
})

const wordCloudData = computed(() => {
  return props.data?.wordCloudData || null
})

const commentInsights = computed(() => {
  return props.data?.commentInsights || null
})

const positiveThemes = computed(() => {
  return commentInsights.value?.themes?.positive || []
})

const improvementThemes = computed(() => {
  return commentInsights.value?.themes?.improvement || []
})

const sampleComments = computed(() => {
  return commentInsights.value?.sampleComments || []
})

const hasThemes = computed(() => {
  return (positiveThemes.value?.length > 0 || improvementThemes.value?.length > 0)
})

const hasAnyData = computed(() => {
  return wordCloudData.value || hasThemes.value || sampleComments.value?.length > 0
})

const academicYear = computed(() => {
  return commentInsights.value?.academicYear || wordCloudData.value?.academicYear || '2025-26'
})

const cycleLabel = computed(() => {
  const cycle = commentInsights.value?.cycle || wordCloudData.value?.cycle
  return cycle === 'All Cycles' ? cycle : `Cycle ${cycle}`
})

const displayWords = computed(() => {
  if (!wordCloudData.value?.wordCloudData) return []
  // Take top 40 words for display
  return wordCloudData.value.wordCloudData.slice(0, 40)
})

function getWordColorClass(index) {
  const colors = ['orange', 'blue', 'green', 'purple', 'magenta', 'yellow']
  return `color-${colors[index % colors.length]}`
}

function getWordStyle(word) {
  // Scale font size based on word size
  const minFont = 14
  const maxFont = 48
  const size = Math.min(maxFont, Math.max(minFont, word.size))
  
  return {
    fontSize: `${size}px`,
    opacity: 0.7 + (word.size / 60) * 0.3,
    fontWeight: size > 30 ? '600' : '400'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
/* Main Section */
.insights-section {
  padding: 2rem 0;
  min-height: 100vh;
}

.section-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #666;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #5e72e4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.insights-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2a3c7a;
  margin: 0;
}

.insights-badges {
  display: flex;
  gap: 0.75rem;
}

.badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-primary {
  background: #5e72e4;
  color: white;
}

.badge-secondary {
  background: #11cdef;
  color: white;
}

/* Card Base */
.insights-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.insights-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
}

.header-icon {
  font-size: 1.5rem;
}

/* Word Cloud Section */
.word-cloud-container {
  padding: 2rem;
  background: #1a1a2e;
  min-height: 400px;
  position: relative;
}

.word-cloud-wrapper {
  position: relative;
  height: 100%;
}

.word-cloud-display {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  min-height: 300px;
}

.word {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: lowercase;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

.word:hover {
  transform: scale(1.2);
  opacity: 1 !important;
}

/* Word Colors */
.word.color-orange { color: #ff8f00; }
.word.color-blue { color: #86b4f0; }
.word.color-green { color: #72cb44; }
.word.color-purple { color: #7f31a4; }
.word.color-magenta { color: #f032e6; }
.word.color-yellow { color: #ffd93d; }

.word-stats {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 2rem;
  background: rgba(0, 0, 0, 0.7);
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
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.125rem;
  color: #fff;
  font-weight: 600;
  margin-top: 0.25rem;
}

/* Themes Section */
.themes-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

.theme-column {
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.theme-header {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 600;
}

.theme-header.positive {
  background: linear-gradient(135deg, #72cb44 0%, #5fb832 100%);
}

.theme-header.improvement {
  background: linear-gradient(135deg, #ff8f00 0%, #ff6b00 100%);
}

.theme-header h4 {
  margin: 0;
  font-size: 1.125rem;
}

.theme-icon {
  font-size: 1.25rem;
}

.theme-list {
  padding: 1rem;
}

.theme-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.theme-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.theme-name {
  font-weight: 500;
  color: #2a3c7a;
}

.theme-count {
  background: #5e72e4;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.no-themes {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 2rem;
}

/* Comments Section */
.comments-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.comment-card {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 4px solid #5e72e4;
  padding: 1.5rem;
  border-radius: 8px;
  position: relative;
  transition: all 0.3s ease;
}

.comment-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(94, 114, 228, 0.2);
}

.comment-quote {
  position: absolute;
  top: 0.5rem;
  left: 1rem;
  font-size: 3rem;
  color: #5e72e4;
  opacity: 0.2;
  font-family: Georgia, serif;
}

.comment-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #4a5568;
  margin: 1rem 0;
  font-style: italic;
  position: relative;
  z-index: 1;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.comment-badge {
  background: #5e72e4;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.comment-date {
  color: #718096;
  font-size: 0.875rem;
}

/* Empty State */
.empty-state, .empty-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  color: #999;
}

.empty-state {
  color: #ccc;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state-card h3 {
  color: #4a5568;
  margin: 1rem 0;
}

.empty-state-card p {
  max-width: 400px;
  color: #718096;
}

/* Responsive Design */
@media (max-width: 768px) {
  .insights-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .themes-container {
    grid-template-columns: 1fr;
  }
  
  .comments-container {
    grid-template-columns: 1fr;
  }
  
  .word-stats {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  
  .word-cloud-display {
    padding: 1rem;
  }
}
</style>