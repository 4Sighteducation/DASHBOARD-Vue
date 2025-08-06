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
.student-responses-modal :deep(.modal-container) {
  max-width: 1200px;
  width: 95%;
  max-height: 92vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-content {
  padding: var(--spacing-md) var(--spacing-lg);
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(92vh - 80px);
  display: flex;
  flex-direction: column;
}

/* Student Info Header */
.student-info {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--border-color);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.student-info h4 {
  margin: 0;
  font-size: 1.375rem;
  color: var(--text-primary);
  font-weight: 600;
}

.student-email {
  color: var(--text-secondary);
  margin: var(--spacing-xs) 0;
  font-size: 0.9rem;
}

.cycle-indicator {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #4a90e2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.8rem;
  margin-top: var(--spacing-sm);
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Summary Cards - Enhanced Design */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  flex-shrink: 0;
}

.summary-card {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: center;
  background: white;
  border: 2px solid;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.summary-card.green {
  border-color: rgba(16, 185, 129, 0.3);
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, white 100%);
}

.summary-card.green::before {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.summary-card.amber {
  border-color: rgba(245, 158, 11, 0.3);
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, white 100%);
}

.summary-card.amber::before {
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
}

.summary-card.red {
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, white 100%);
}

.summary-card.red::before {
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}

.summary-card.none {
  border-color: rgba(107, 114, 128, 0.3);
  background: linear-gradient(180deg, rgba(107, 114, 128, 0.05) 0%, white 100%);
}

.summary-card.none::before {
  background: linear-gradient(90deg, #6b7280 0%, #9ca3af 100%);
}

.summary-count {
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 2px;
  line-height: 1;
}

.summary-card.green .summary-count { color: #10b981; }
.summary-card.amber .summary-count { color: #f59e0b; }
.summary-card.red .summary-count { color: #ef4444; }
.summary-card.none .summary-count { color: #6b7280; }

.summary-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Responses Container - Better Design */
.responses-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  min-height: 300px;
  max-height: 450px;
}

.responses-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

.responses-table thead {
  position: sticky;
  top: 0;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.responses-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border-color);
}

.responses-table th:first-child {
  width: 65%;
  padding-left: var(--spacing-lg);
}

.responses-table th:nth-child(2) {
  width: 15%;
  text-align: center;
}

.responses-table th:last-child {
  width: 20%;
  text-align: center;
}

.responses-table tbody tr {
  transition: all 0.2s ease;
  position: relative;
}

.responses-table tbody tr:hover {
  background: rgba(59, 130, 246, 0.03);
}

.responses-table tbody tr::after {
  content: '';
  position: absolute;
  left: var(--spacing-md);
  right: var(--spacing-md);
  bottom: 0;
  height: 1px;
  background: var(--border-light);
}

.responses-table td {
  padding: 14px 16px;
  vertical-align: middle;
}

.responses-table td:first-child {
  padding-left: var(--spacing-lg);
}

.question-text {
  color: var(--text-primary);
  line-height: 1.5;
  font-size: 0.875rem;
  word-wrap: break-word;
  max-width: 100%;
}

.response-score {
  text-align: center;
}

.score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 20px;
  font-weight: 600;
  min-width: 36px;
  font-size: 0.875rem;
  transition: transform 0.2s ease;
}

.score-badge:hover {
  transform: scale(1.05);
}

.score-badge.score-green {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.25) 100%);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.score-badge.score-amber {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.25) 100%);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.score-badge.score-red {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.25) 100%);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.score-badge.score-none {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.15) 0%, rgba(107, 114, 128, 0.25) 100%);
  color: #4b5563;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.rag-indicator {
  text-align: center;
}

.rag-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  transition: transform 0.2s ease;
}

.rag-circle:hover {
  transform: scale(1.1);
}

.rag-circle.rag-green {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.rag-circle.rag-amber {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.rag-circle.rag-red {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
}

.rag-circle.rag-none {
  background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
}

/* Row highlighting - Subtle */
.responses-table tbody tr.rag-green {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.03) 0%, transparent 100%);
}

.responses-table tbody tr.rag-amber {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.03) 0%, transparent 100%);
}

.responses-table tbody tr.rag-red {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.03) 0%, transparent 100%);
}

/* Loading State */
.loading-container {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(59, 130, 246, 0.1);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-icon {
  font-size: 1.25rem;
  margin-right: var(--spacing-sm);
  vertical-align: middle;
}

/* Custom Scrollbar */
.responses-container::-webkit-scrollbar {
  width: 8px;
}

.responses-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.responses-container::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 4px;
}

.responses-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

/* Mobile Responsive Design */
@media (max-width: 768px) {
  .student-responses-modal :deep(.modal-container) {
    width: 100%;
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-content {
    padding: var(--spacing-sm);
    max-height: calc(100vh - 60px);
  }

  .student-info {
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .student-info h4 {
    font-size: 1.125rem;
  }

  .summary-cards {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
  }

  .summary-card {
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .summary-count {
    font-size: 1.25rem;
  }

  .summary-label {
    font-size: 0.7rem;
  }

  .responses-container {
    max-height: none;
    flex: 1;
    border-radius: var(--radius-sm);
  }

  /* Stack table on mobile */
  .responses-table thead {
    display: none;
  }

  .responses-table tbody tr {
    display: block;
    margin-bottom: var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm);
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .responses-table tbody tr::after {
    display: none;
  }

  .responses-table td {
    display: block;
    padding: var(--spacing-xs) var(--spacing-sm);
    text-align: left !important;
  }

  .responses-table td:first-child {
    padding-left: var(--spacing-sm);
    padding-top: var(--spacing-sm);
    padding-bottom: var(--spacing-xs);
    font-weight: 500;
  }

  .responses-table td:nth-child(2),
  .responses-table td:last-child {
    display: inline-block;
    width: 50%;
    text-align: center !important;
    padding: var(--spacing-sm);
  }

  .score-badge {
    display: block;
    margin: 0 auto;
  }

  .rag-circle {
    margin: 0 auto;
  }
}

/* Tablet Responsive */
@media (min-width: 769px) and (max-width: 1024px) {
  .student-responses-modal :deep(.modal-container) {
    max-width: 95%;
  }

  .summary-cards {
    grid-template-columns: repeat(4, 1fr);
  }

  .responses-table th:first-child {
    width: 60%;
  }

  .responses-table th:nth-child(2) {
    width: 20%;
  }

  .responses-table th:last-child {
    width: 20%;
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .student-responses-modal :deep(.modal-container) {
    max-width: 1400px;
  }

  .modal-content {
    padding: var(--spacing-xl);
  }

  .responses-container {
    max-height: 600px;
  }
}

/* Print Styles */
@media print {
  .student-responses-modal :deep(.modal-container) {
    box-shadow: none;
    max-width: 100%;
  }

  .responses-container {
    max-height: none;
    overflow: visible;
    box-shadow: none;
  }

  .responses-table tbody tr:hover {
    background: transparent;
  }
}
</style>