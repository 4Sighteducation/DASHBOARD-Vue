<template>
  <div class="qla-section">
    <!-- Loading State -->
    <div v-if="loading" class="section-loading">
      <div class="spinner"></div>
      <p>Loading question analysis...</p>
    </div>

    <!-- Content -->
    <div v-else class="qla-content">
      <!-- Top/Bottom Questions Display -->
      <TopBottomQuestions
        :top-questions="topQuestions"
        :bottom-questions="bottomQuestions"
        :loading="loading"
      />

      <!-- Questionnaire Insights -->
      <QuestionnaireInsights 
        v-if="insights.length > 0"
        :insights="insights"
        class="qla-insights-section"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import TopBottomQuestions from './TopBottomQuestions.vue'
import QuestionnaireInsights from './QuestionnaireInsights.vue'

const props = defineProps({
  data: Object,
  filters: Object,
  loading: Boolean
})

// Debug logging
onMounted(() => {
  console.log('[QLASection] Component mounted with data:', props.data)
  console.log('[QLASection] QLA Data:', props.data?.qlaData)
})

// Watch for data changes
watch(() => props.data, (newData) => {
  console.log('[QLASection] Data changed:', newData)
  console.log('[QLASection] QLA Data after change:', newData?.qlaData)
}, { deep: true })

// Top and Bottom Questions
const topQuestions = computed(() => {
  const questions = props.data?.qlaData?.highLowQuestions?.topQuestions || []
  console.log('[QLASection] Top questions:', questions)
  return questions
})

const bottomQuestions = computed(() => {
  const questions = props.data?.qlaData?.highLowQuestions?.bottomQuestions || []
  console.log('[QLASection] Bottom questions:', questions)
  return questions
})

// Insights
const insights = computed(() => {
  const insightData = props.data?.qlaData?.insights || []
  console.log('[QLASection] Insights:', insightData)
  return insightData
})
</script>

<style scoped>
.qla-section {
  padding: var(--spacing-lg) 0;
}

.section-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.qla-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.qla-insights-section {
  margin-top: var(--spacing-xl);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: var(--spacing-xl);
  background: var(--card-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }
}</style>