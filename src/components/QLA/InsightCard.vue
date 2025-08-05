<template>
  <div 
    class="insight-card"
    :class="[colorClass, { clickable: true }]"
    @click="$emit('click', insight)"
  >
    <div class="insight-icon">{{ insight.icon }}</div>
    <div class="insight-content">
      <h4 class="insight-title">{{ insight.title }}</h4>
      <div class="insight-percentage">
        <span class="percentage-value">{{ insight.percentageAgreement }}%</span>
        <span class="percentage-label">Agreement</span>
      </div>
      <p class="insight-question" v-if="insight.question">{{ insight.question }}</p>
      <div class="insight-meta">
        <span class="response-count">n = {{ insight.totalResponses }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  insight: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

// Determine color class based on percentage
const colorClass = computed(() => {
  const percentage = props.insight.percentageAgreement
  if (percentage >= 75) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'average'
  return 'poor'
})
</script>

<style scoped>
.insight-card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.insight-card.clickable {
  cursor: pointer;
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Color variations */
.insight-card.excellent {
  border-color: var(--success-color);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, transparent 100%);
}

.insight-card.good {
  border-color: var(--info-color);
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, transparent 100%);
}

.insight-card.average {
  border-color: var(--warning-color);
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, transparent 100%);
}

.insight-card.poor {
  border-color: var(--danger-color);
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, transparent 100%);
}

.insight-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-sm);
  text-align: center;
}

.insight-content {
  text-align: center;
}

.insight-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.insight-percentage {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.percentage-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.excellent {
  border-bottom: 4px solid var(--success-color);
}

.excellent .percentage-value {
  color: var(--success-color);
}

.good {
  border-bottom: 4px solid var(--info-color);
}

.good .percentage-value {
  color: var(--info-color);
}

.average {
  border-bottom: 4px solid var(--warning-color);
}

.average .percentage-value {
  color: var(--warning-color);
}

.poor {
  border-bottom: 4px solid var(--danger-color);
}

.poor .percentage-value {
  color: var(--danger-color);
}

.percentage-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.insight-question {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: var(--spacing-xs) 0;
  text-align: center;
  line-height: 1.4;
}

.insight-meta {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.response-count::after,
.question-count::after {
  content: '';
}

/* Hover effect enhancement */
.insight-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.insight-card:hover::before {
  opacity: 1;
}

.insight-card.excellent::before {
  background: var(--success-color);
}

.insight-card.good::before {
  background: var(--info-color);
}

.insight-card.average::before {
  background: var(--warning-color);
}

.insight-card.poor::before {
  background: var(--danger-color);
}
</style>