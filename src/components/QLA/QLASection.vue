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
import { ref, computed } from 'vue'
import TopBottomQuestions from './TopBottomQuestions.vue'
import QuestionnaireInsights from './QuestionnaireInsights.vue'

const props = defineProps({
  data: Object,
  filters: Object,
  loading: Boolean
})

// Top and Bottom Questions
const topQuestions = computed(() => {
  return props.data?.qlaData?.highLowQuestions?.topQuestions || []
})

const bottomQuestions = computed(() => {
  return props.data?.qlaData?.highLowQuestions?.bottomQuestions || []
})

// Insights
const insights = computed(() => {
  return props.data?.qlaData?.insights || []
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