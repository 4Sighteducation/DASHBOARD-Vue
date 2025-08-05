<template>
  <div class="qla-section">
    <!-- Loading Modal for cycle changes -->
    <LoadingModal 
      :is-loading="cycleLoading"
      title="Loading Data"
      message="Loading Question Level Analysis for the selected cycle..."
    />
    
    <!-- Student Selected Banner -->
    <div v-if="isStudentSelected" class="student-selected-banner">
      <div class="banner-content">
        <div class="student-info">
          <span class="student-icon">👤</span>
          <div>
            <h4>Individual Student Analysis</h4>
            <p>{{ studentName || 'Selected Student' }}</p>
          </div>
        </div>
        <button class="view-responses-btn" @click="showResponsesModal = true">
          📋 View Questionnaire Responses
        </button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading && !cycleLoading" class="section-loading">
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
    
    <!-- Student Responses Modal -->
    <StudentResponsesModal 
      v-if="showResponsesModal"
      :student-id="store.filters.studentId"
      :student-name="studentName"
      @close="showResponsesModal = false"
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

const props = defineProps({
  data: Object,
  filters: Object,
  loading: Boolean
})

// Loading state for cycle changes
const cycleLoading = ref(false)
const previousCycle = ref(store.filters.cycle)

// Modal state
const showResponsesModal = ref(false)

// Check if student is selected
const isStudentSelected = computed(() => {
  const hasStudentId = !!store.filters.studentId
  console.log('[QLASection] isStudentSelected:', hasStudentId, 'studentId:', store.filters.studentId)
  return hasStudentId
})

const studentName = computed(() => {
  return store.filters.studentName || 'Selected Student'
})

// Debug watch for student selection
watch(() => store.filters.studentId, (newId) => {
  console.log('[QLASection] Student ID changed to:', newId)
})



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
}

/* Student Selected Banner */
.student-selected-banner {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}

.student-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: white;
}

.student-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.student-info h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  opacity: 0.9;
}

.student-info p {
  margin: 0.25rem 0 0;
  font-size: 1rem;
  color: white;
}

.view-responses-btn {
  background: white;
  color: var(--primary-color);
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.view-responses-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.view-responses-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .banner-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .view-responses-btn {
    width: 100%;
    justify-content: center;
  }
}</style>