<template>
  <Modal @close="$emit('close')" class="student-responses-modal">
    <template #header>
      <h3>
        <span class="modal-icon">📊</span>
        Individual Student Responses
      </h3>
    </template>
    
    <div class="modal-content" v-if="responses">
      <!-- Student Info -->
      <div class="student-info">
        <h4>{{ responses.student.name }}</h4>
        <p class="student-email">{{ responses.student.email }}</p>
        <div class="cycle-indicator">Cycle {{ responses.cycle }}</div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card green">
          <div class="summary-count">{{ responses.summary.green }}</div>
          <div class="summary-label">Strong (4-5)</div>
        </div>
        <div class="summary-card amber">
          <div class="summary-count">{{ responses.summary.amber }}</div>
          <div class="summary-label">Moderate (3)</div>
        </div>
        <div class="summary-card red">
          <div class="summary-count">{{ responses.summary.red }}</div>
          <div class="summary-label">Needs Work (1-2)</div>
        </div>
        <div class="summary-card none" v-if="responses.summary.none > 0">
          <div class="summary-count">{{ responses.summary.none }}</div>
          <div class="summary-label">No Response</div>
        </div>
      </div>

      <!-- Responses Table -->
      <div class="responses-container">
        <table class="responses-table">
          <thead>
            <tr>
              <th width="70%">Response Statement</th>
              <th width="15%">Score</th>
              <th width="15%">Rating</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="response in responses.responses" 
                :key="response.questionId"
                :class="`rag-${response.ragRating}`">
              <td class="question-text">{{ response.questionText }}</td>
              <td class="response-score">
                <div class="score-badge" :class="`score-${response.ragRating}`">
                  {{ response.responseValue || '-' }}
                </div>
              </td>
              <td class="rag-indicator">
                <div class="rag-circle" :class="`rag-${response.ragRating}`">
                  <span v-if="response.ragRating === 'green'">✓</span>
                  <span v-else-if="response.ragRating === 'amber'">!</span>
                  <span v-else-if="response.ragRating === 'red'">✗</span>
                  <span v-else>-</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-container">
      <div class="spinner"></div>
      <p>Loading student responses...</p>
    </div>
  </Modal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Modal from '../common/Modal.vue'
import { API } from '../../services/api'
import { useDashboardStore } from '../../stores/dashboard'

const props = defineProps({
  studentId: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const responses = ref(null)
const dashboardStore = useDashboardStore()

onMounted(async () => {
  try {
    const cycle = dashboardStore.filters.cycle || 1
    responses.value = await API.getStudentResponses(props.studentId, cycle)
  } catch (error) {
    console.error('Failed to load student responses:', error)
  }
})


</script>

<style scoped>
.student-responses-modal :deep(.modal-container) {
  max-width: 1000px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-content {
  padding: var(--spacing-lg);
  overflow-y: auto;
  max-height: calc(90vh - 100px);
  display: flex;
  flex-direction: column;
}

.student-info {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--border-color);
}

.student-info h4 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.student-email {
  color: var(--text-secondary);
  margin: var(--spacing-sm) 0;
}

.cycle-indicator {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  margin-top: var(--spacing-sm);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-shrink: 0;
}

.summary-card {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: center;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
}

.summary-card.green {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%);
}

.summary-card.amber {
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%);
}

.summary-card.red {
  border-color: #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%);
}

.summary-card.none {
  border-color: #6b7280;
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, transparent 100%);
}

.summary-count {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: var(--spacing-xs);
}

.summary-card.green .summary-count {
  color: #10b981;
}

.summary-card.amber .summary-count {
  color: #f59e0b;
}

.summary-card.red .summary-count {
  color: #ef4444;
}

.summary-card.none .summary-count {
  color: #6b7280;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.responses-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  min-height: 200px;
  max-height: 400px;
}

.responses-table {
  width: 100%;
  border-collapse: collapse;
}

.responses-table thead {
  position: sticky;
  top: 0;
  background: var(--background-primary);
  z-index: 10;
}

.responses-table th {
  padding: var(--spacing-md);
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
}

.responses-table tbody tr {
  transition: background-color 0.2s ease;
}

.responses-table tbody tr:hover {
  background: rgba(0, 0, 0, 0.02);
}

.responses-table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.question-text {
  color: var(--text-primary);
  line-height: 1.4;
}

.score-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-weight: bold;
  min-width: 32px;
  text-align: center;
}

.score-badge.score-green {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.score-badge.score-amber {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.score-badge.score-red {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.score-badge.score-none {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

.rag-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  margin: 0 auto;
}

.rag-circle.rag-green {
  background: #10b981;
}

.rag-circle.rag-amber {
  background: #f59e0b;
}

.rag-circle.rag-red {
  background: #ef4444;
}

.rag-circle.rag-none {
  background: #6b7280;
}

/* Row highlighting based on RAG status */
.responses-table tbody tr.rag-green {
  background: rgba(16, 185, 129, 0.05);
}

.responses-table tbody tr.rag-amber {
  background: rgba(245, 158, 11, 0.05);
}

.responses-table tbody tr.rag-red {
  background: rgba(239, 68, 68, 0.05);
}

.loading-container {
  text-align: center;
  padding: var(--spacing-xl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-icon {
  font-size: 1.5rem;
  margin-right: var(--spacing-sm);
}

/* Improve table readability */
.responses-table {
  font-size: 0.875rem;
}

.responses-table tbody tr {
  border-bottom: 1px solid var(--border-light);
}

.responses-table tbody tr:last-child {
  border-bottom: none;
}

/* Smooth scrolling */
.responses-container {
  scroll-behavior: smooth;
}

/* Hide scrollbar but keep functionality */
.responses-container::-webkit-scrollbar {
  width: 6px;
}

.responses-container::-webkit-scrollbar-track {
  background: transparent;
}

.responses-container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.responses-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* Make score badges more compact */
.score-badge {
  font-size: 0.875rem;
}

/* Improve rating circles */
.rag-circle {
  font-size: 0.875rem;
}
</style>