<template>
  <div class="insights-section">
    <!-- Loading State -->
    <div v-if="loading" class="section-loading">
      <div class="spinner"></div>
      <p>Loading student comment insights...</p>
    </div>

    <!-- Content -->
    <div v-else class="insights-content">
      <!-- Header with cycle and academic year info -->
      <div v-if="wordCloudData || commentInsights" class="insights-header">
        <h2 class="section-title">Student Comment Analysis</h2>
        <div class="insights-info">
          <span class="info-badge">{{ commentInsights?.academicYear || wordCloudData?.academicYear || 'Current Year' }}</span>
          <span class="info-badge">{{ commentInsights?.cycle || wordCloudData?.cycle || 'All Cycles' }}</span>
        </div>
      </div>

      <!-- Word Cloud -->
      <div class="card word-cloud-card">
        <h3 class="card-title">Comment Word Cloud</h3>
        <div v-if="!wordCloudData || !wordCloudData.wordCloudData || wordCloudData.wordCloudData.length === 0" class="no-data">
          <p>{{ wordCloudData?.message || 'No comment data available for the selected filters.' }}</p>
        </div>
        <WordCloud v-else :data="wordCloudData" />
      </div>
      
      <!-- Themes Analysis -->
      <div v-if="themes && (themes.positive?.length > 0 || themes.improvement?.length > 0)" class="themes-section">
        <h3 class="section-subtitle">Key Themes Identified</h3>
        <div class="themes-grid">
          <!-- Positive Themes -->
          <div class="theme-card positive-card">
            <div class="theme-header">
              <h4 class="theme-title">✨ Positive Themes</h4>
            </div>
            <ul class="themes-list">
              <li v-for="theme in themes.positive" :key="theme.id" class="theme-item positive">
                <span class="theme-name">{{ theme.name }}</span>
                <span class="theme-count">{{ theme.count }}</span>
              </li>
              <li v-if="!themes.positive || themes.positive.length === 0" class="no-themes">
                No positive themes identified
              </li>
            </ul>
          </div>
          
          <!-- Areas for Improvement -->
          <div class="theme-card improvement-card">
            <div class="theme-header">
              <h4 class="theme-title">📚 Areas for Development</h4>
            </div>
            <ul class="themes-list">
              <li v-for="theme in themes.improvement" :key="theme.id" class="theme-item improvement">
                <span class="theme-name">{{ theme.name }}</span>
                <span class="theme-count">{{ theme.count }}</span>
              </li>
              <li v-if="!themes.improvement || themes.improvement.length === 0" class="no-themes">
                No improvement areas identified
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Sample Comments -->
      <div v-if="sampleComments && sampleComments.length > 0" class="card comments-card">
        <h3 class="card-title">Recent Student Comments</h3>
        <div class="comments-list">
          <div v-for="(comment, index) in sampleComments" :key="index" class="comment-item">
            <p class="comment-text">"{{ comment.text }}"</p>
            <div class="comment-meta">
              <span class="meta-badge">Year {{ comment.yearGroup }}</span>
              <span class="meta-date">{{ formatDate(comment.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="!wordCloudData && !commentInsights" class="no-data-container">
        <div class="no-data-icon">💬</div>
        <h3>No Comment Data Available</h3>
        <p>Comment insights will appear here once student comments are available for the selected filters.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import WordCloud from './WordCloud.vue'

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

const themes = computed(() => {
  return commentInsights.value?.themes || null
})

const sampleComments = computed(() => {
  return commentInsights.value?.sampleComments || []
})

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
.insights-section {
  padding: var(--spacing-lg) 0;
}

.section-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.insights-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.insights-info {
  display: flex;
  gap: var(--spacing-sm);
}

.info-badge {
  padding: 0.25rem 0.75rem;
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
}

.word-cloud-card {
  padding: var(--spacing-xl);
  background: white;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

/* Themes Section */
.themes-section {
  margin-top: var(--spacing-lg);
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.theme-card {
  background: white;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.positive-card .theme-header {
  background: linear-gradient(135deg, #72cb44 0%, #5fb832 100%);
}

.improvement-card .theme-header {
  background: linear-gradient(135deg, #ff8f00 0%, #ff6b00 100%);
}

.theme-header {
  padding: var(--spacing-md);
  color: white;
}

.theme-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.themes-list {
  list-style: none;
  padding: var(--spacing-md);
  margin: 0;
}

.theme-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-xs);
  border-radius: var(--radius-sm);
  background: var(--secondary-bg);
  transition: background 0.2s ease;
}

.theme-item:hover {
  background: #f0f2f5;
}

.theme-item.positive {
  border-left: 3px solid #72cb44;
}

.theme-item.improvement {
  border-left: 3px solid #ff8f00;
}

.theme-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.theme-count {
  font-size: 0.875rem;
  color: white;
  background: #7f31a4;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  min-width: 28px;
  text-align: center;
}

.no-themes {
  color: var(--text-secondary);
  font-style: italic;
  padding: var(--spacing-md);
  text-align: center;
}

/* Comments Section */
.comments-card {
  padding: var(--spacing-xl);
  background: white;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.comment-item {
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: var(--radius-md);
  border-left: 4px solid #86b4f0;
  transition: transform 0.2s ease;
}

.comment-item:hover {
  transform: translateX(4px);
}

.comment-text {
  font-size: 1rem;
  font-style: italic;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  line-height: 1.6;
}

.comment-meta {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.meta-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #7f31a4;
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
}

.meta-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* No Data State */
.no-data {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-secondary);
}

.no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--card-bg);
  border-radius: var(--radius-md);
}

.no-data-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.no-data-container h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.no-data-container p {
  color: var(--text-secondary);
  max-width: 400px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .themes-grid {
    grid-template-columns: 1fr;
  }
  
  .insights-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .comment-item {
    padding: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .theme-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .theme-count {
    align-self: flex-end;
  }
}
</style>