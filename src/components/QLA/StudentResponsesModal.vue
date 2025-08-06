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
              <th>Response Statement</th>
              <th>Score</th>
              <th>Rating</th>
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
  console.log('[StudentResponsesModal] Mounted with studentId:', props.studentId, 'studentName:', props.studentName)
  
  if (!props.studentId) {
    console.error('[StudentResponsesModal] No student ID provided')
    return
  }
  
  try {
    const cycle = dashboardStore.filters.cycle || 1
    console.log('[StudentResponsesModal] Fetching responses for cycle:', cycle)
    responses.value = await API.getStudentResponses(props.studentId, cycle)
    console.log('[StudentResponsesModal] Responses loaded:', responses.value)
  } catch (error) {
    console.error('[StudentResponsesModal] Failed to load student responses:', error)
  }
})


</script>

<style scoped>
/* Ensure all elements use border-box sizing */
.student-responses-modal * {
  box-sizing: border-box;
}

.student-responses-modal :deep(.modal-container) {
  max-width: 800px;
  width: 90%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-content {
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(85vh - 80px);
  width: 100%;
  box-sizing: border-box;
}

/* Student Info Header */
.student-info {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.student-info h4 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
  font-weight: 600;
}

.student-email {
  color: #6b7280;
  margin: 5px 0;
  font-size: 0.875rem;
}

.cycle-indicator {
  display: inline-block;
  padding: 4px 12px;
  background: #3b82f6;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-top: 8px;
  font-weight: 500;
}

/* Summary Cards */
.summary-cards {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.summary-card {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 130px;
  padding: 10px 8px;
  border-radius: 8px;
  text-align: center;
  background: white;
  border: 2px solid;
}

.summary-card.green {
  border-color: #10b981;
  background: #f0fdf4;
}

.summary-card.amber {
  border-color: #f59e0b;
  background: #fffbeb;
}

.summary-card.red {
  border-color: #ef4444;
  background: #fef2f2;
}

.summary-card.none {
  border-color: #9ca3af;
  background: #f9fafb;
}

.summary-count {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.summary-card.green .summary-count { color: #10b981; }
.summary-card.amber .summary-count { color: #f59e0b; }
.summary-card.red .summary-count { color: #ef4444; }
.summary-card.none .summary-count { color: #6b7280; }

.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* Responses Container */
.responses-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* Prevent horizontal scroll */
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-height: 0;
}

.responses-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* Fixed layout to control column widths */
}

.responses-table thead {
  position: sticky;
  top: 0;
  background: #f9fafb;
  z-index: 10;
}

.responses-table th {
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
  background: #f9fafb;
}

/* Set specific column widths */
.responses-table th:first-child {
  width: 70%; /* Question text column */
}

.responses-table th:nth-child(2) {
  width: 15%; /* Score column */
  text-align: center;
}

.responses-table th:nth-child(3) {
  width: 15%; /* Rating column */
  text-align: center;
}

.responses-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
}

.responses-table tbody tr:hover {
  background: #f9fafb;
}

.responses-table td {
  padding: 10px 8px;
  color: #1f2937;
  font-size: 0.875rem;
  overflow: hidden;
}

.responses-table td:first-child {
  width: 70%;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.responses-table td:nth-child(2) {
  width: 15%;
  text-align: center;
}

.responses-table td:nth-child(3) {
  width: 15%;
  text-align: center;
}

.question-text {
  color: #374151;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.response-score {
  text-align: center;
}

.score-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.813rem;
  min-width: 28px;
  text-align: center;
}

.score-badge.score-green {
  background: #d1fae5;
  color: #065f46;
}

.score-badge.score-amber {
  background: #fed7aa;
  color: #92400e;
}

.score-badge.score-red {
  background: #fee2e2;
  color: #991b1b;
}

.score-badge.score-none {
  background: #f3f4f6;
  color: #6b7280;
}

.rag-indicator {
  text-align: center;
}

.rag-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 0.688rem;
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
  background: #9ca3af;
}

/* Row highlighting - Very subtle */
.responses-table tbody tr.rag-green {
  background: rgba(16, 185, 129, 0.02);
}

.responses-table tbody tr.rag-amber {
  background: rgba(245, 158, 11, 0.02);
}

.responses-table tbody tr.rag-red {
  background: rgba(239, 68, 68, 0.02);
}

/* Loading State */
.loading-container {
  text-align: center;
  padding: 40px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-icon {
  font-size: 1.25rem;
  margin-right: 8px;
  vertical-align: middle;
}

/* Minimal scrollbar styling */
.responses-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.responses-container::-webkit-scrollbar-track {
  background: transparent;
}

.responses-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.responses-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Mobile Responsive Design */
@media (max-width: 768px) {
  .student-responses-modal :deep(.modal-container) {
    width: 95%;
    max-width: 100%;
    max-height: 95vh;
  }

  .modal-content {
    padding: 15px;
    height: calc(95vh - 60px);
  }

  .student-info h4 {
    font-size: 1.125rem;
  }

  .summary-cards {
    flex-wrap: wrap;
  }

  .summary-card {
    min-width: 100px;
    padding: 8px;
  }

  .summary-count {
    font-size: 1.25rem;
  }

  .summary-label {
    font-size: 0.7rem;
  }

  /* Keep table simple on mobile */
  .responses-table {
    font-size: 0.813rem;
  }

  .responses-table th,
  .responses-table td {
    padding: 8px;
  }

  .score-badge {
    padding: 2px 6px;
    font-size: 0.75rem;
  }

  .rag-circle {
    width: 20px;
    height: 20px;
    font-size: 0.625rem;
  }
}

/* Tablet Responsive */
@media (min-width: 769px) and (max-width: 1024px) {
  .student-responses-modal :deep(.modal-container) {
    max-width: 95%;
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .student-responses-modal :deep(.modal-container) {
    max-width: 1100px;
  }

  .modal-content {
    padding: 24px;
  }
}
</style>