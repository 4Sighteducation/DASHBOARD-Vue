<template>
  <div class="qla-section">
    <!-- Loading Modal for cycle changes -->
    <LoadingModal 
      :is-loading="cycleLoading"
      title="Loading Data"
      message="Loading Question Level Analysis for the selected cycle..."
    />
    
    <!-- Loading State -->
    <div v-if="loading && !cycleLoading" class="section-loading">
      <div class="spinner"></div>
      <p>Loading question analysis...</p>
    </div>

    <!-- Content -->
    <div v-else class="qla-content">
      <!-- Student Response Button (shows when student is selected) -->
      <div v-if="dashboardStore.filters.studentId" class="student-response-section">
        <button 
          class="view-responses-btn"
          @click="showStudentResponses = true">
          <span class="btn-icon">👤</span>
          View All Responses for {{ dashboardStore.filters.studentName || 'Selected Student' }}
        </button>
      </div>

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
    
    <!-- Student Responses Modal -->
    <StudentResponsesModal
      v-if="showStudentResponses && dashboardStore.filters.studentId"
      :student-id="dashboardStore.filters.studentId"
      :student-name="dashboardStore.filters.studentName"
      @close="showStudentResponses = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDashboardStore } from '../../stores/dashboard'
import TopBottomQuestions from './TopBottomQuestions.vue'
import QuestionnaireInsights from './QuestionnaireInsights.vue'
import LoadingModal from '../common/LoadingModal.vue'
import StudentResponsesModal from './StudentResponsesModal.vue'

const store = useDashboardStore()
const dashboardStore = useDashboardStore()
const showStudentResponses = ref(false)

const props = defineProps({
  data: Object,
  filters: Object,
  loading: Boolean
})

// Loading state for cycle changes
const cycleLoading = ref(false)
const previousCycle = ref(store.filters.cycle)



// Watch for cycle changes
watch(() => store.filters.cycle, (newCycle, oldCycle) => {
  if (newCycle !== oldCycle && previousCycle.value !== newCycle) {
    cycleLoading.value = true
    previousCycle.value = newCycle
    // The loading will be turned off when new data arrives
  }
})



// Turn off cycle loading when data changes
watch(() => props.data?.qlaData, (newData) => {
  if (newData && cycleLoading.value) {
    // Add small delay to ensure smooth transition
    setTimeout(() => {
      cycleLoading.value = false
    }, 300)
  }
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

.student-response-section {
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.view-responses-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.view-responses-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
}

.btn-icon {
  font-size: 1.25rem;
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