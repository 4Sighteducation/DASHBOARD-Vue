<template>
  <div 
    class="simple-question-card"
    :class="[colorClass]"
  >
    <div class="question-rank">{{ rank }}</div>
    <div class="question-content">
      <h4 class="question-text">{{ questionText }}</h4>
      <div class="score-section">
        <span class="score-value">{{ formattedScore }}</span>
        <span class="score-label">Average Score</span>
      </div>
      <div class="question-meta">
        <span class="response-count">n = {{ responseCount }}</span>
        <span class="std-dev">σ = {{ formattedStdDev }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  rank: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    default: 'top' // 'top' or 'bottom'
  }
})

// Computed properties
const questionText = computed(() => {
  return props.question.text || props.question.question_text || `Question ${props.question.id}`
})

const score = computed(() => {
  return props.question.score || props.question.mean || 0
})

const formattedScore = computed(() => {
  return score.value.toFixed(2)
})

const responseCount = computed(() => {
  return props.question.count || props.question.n || 0
})

const formattedStdDev = computed(() => {
  const stdDev = props.question.std_dev || 0
  return stdDev.toFixed(2)
})

// Color class based on score for top questions, inverse for bottom
const colorClass = computed(() => {
  if (props.type === 'top') {
    // Top questions - higher is better
    if (score.value >= 4) return 'excellent'
    if (score.value >= 3.5) return 'good'
    if (score.value >= 3) return 'average'
    return 'poor'
  } else {
    // Bottom questions - lower scores need attention
    if (score.value <= 2) return 'poor'
    if (score.value <= 2.5) return 'average'
    if (score.value <= 3) return 'good'
    return 'excellent'
  }
})
</script>

<style scoped>
.simple-question-card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border-bottom-width: 4px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.simple-question-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.question-rank {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
}

.question-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.question-text {
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: var(--spacing-sm) 0;
}

.score-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: var(--spacing-xs);
}

.question-meta {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  font-size: 0.75rem;
  color: var(--text-muted);
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--border-color);
}

/* Color variations */
.excellent {
  border-bottom-color: #10b981;
  background: linear-gradient(to bottom, var(--card-bg) 90%, rgba(16, 185, 129, 0.1));
}

.excellent .score-value {
  color: #10b981;
}

.excellent .question-rank {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.good {
  border-bottom-color: #3b82f6;
  background: linear-gradient(to bottom, var(--card-bg) 90%, rgba(59, 130, 246, 0.1));
}

.good .score-value {
  color: #3b82f6;
}

.good .question-rank {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.average {
  border-bottom-color: #f59e0b;
  background: linear-gradient(to bottom, var(--card-bg) 90%, rgba(245, 158, 11, 0.1));
}

.average .score-value {
  color: #f59e0b;
}

.average .question-rank {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.poor {
  border-bottom-color: #ef4444;
  background: linear-gradient(to bottom, var(--card-bg) 90%, rgba(239, 68, 68, 0.1));
}

.poor .score-value {
  color: #ef4444;
}

.poor .question-rank {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
</style>