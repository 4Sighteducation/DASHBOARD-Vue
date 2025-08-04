<template>
  <div class="summary-header">
    <!-- Cycle Selector -->
    <div class="cycle-selector">
      <label>Select Cycle:</label>
      <select v-model="selectedCycle" @change="$emit('cycle-change', selectedCycle)">
        <option :value="1">Cycle 1</option>
        <option :value="2">Cycle 2</option>
        <option :value="3">Cycle 3</option>
      </select>
    </div>

    <!-- Small VESPA Radar Chart -->
    <div class="small-chart-container">
      <h4>VESPA Scores</h4>
      <VespaRadarChart :data="vespaScores" :size="150" />
    </div>

    <!-- ERI Speedometer -->
    <div class="eri-container">
      <h4>
        Exam Readiness Index
        <button @click="showERIModal = true" class="info-button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13H7v-2h2v2zm0-3H7V4h2v6z"/>
          </svg>
        </button>
      </h4>
      <ERISpeedometer 
        :value="eriValue" 
        :national="nationalERI"
        :size="150" 
      />
    </div>

    <!-- Completion Rate -->
    <div class="completion-container">
      <h4>Completion Rate</h4>
      <div class="completion-stats">
        <div class="stat-row">
          <span class="label">Total Students:</span>
          <span class="value">{{ totalStudents }}</span>
        </div>
        <div class="stat-row">
          <span class="label">Responses:</span>
          <span class="value">{{ responses }}</span>
        </div>
        <div class="stat-row">
          <span class="label">Rate:</span>
          <span class="value completion-rate" :class="completionClass">
            {{ completionRate }}%
          </span>
        </div>
      </div>
    </div>

    <!-- ERI Explainer Modal -->
    <Modal v-if="showERIModal" @close="showERIModal = false">
      <template #header>
        <h3>Exam Readiness Index (ERI)</h3>
      </template>
      <template #default>
        <div class="eri-explanation">
          <p>
            The Exam Readiness Index (ERI) is calculated from three outcome questions that measure how prepared students feel for their exams:
          </p>
          <ul>
            <li><strong>Confidence:</strong> How confident do students feel about their exams?</li>
            <li><strong>Equipment:</strong> Do students feel they have the tools and resources they need?</li>
            <li><strong>Support:</strong> Do students feel supported in their exam preparation?</li>
          </ul>
          <p>
            Each question is scored on a 1-5 scale, and the ERI represents the average across all three questions. 
            A higher ERI indicates students feel more prepared for their exams.
          </p>
          <div class="eri-scale">
            <div class="scale-item poor">1.0-2.0: Poor</div>
            <div class="scale-item fair">2.0-3.0: Fair</div>
            <div class="scale-item good">3.0-4.0: Good</div>
            <div class="scale-item excellent">4.0-5.0: Excellent</div>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VespaRadarChart from './VespaRadarChart.vue'
import ERISpeedometer from './ERISpeedometer.vue'
import Modal from '../common/Modal.vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  currentCycle: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['cycle-change'])

const selectedCycle = ref(props.currentCycle)
const showERIModal = ref(false)

// Computed properties
const vespaScores = computed(() => {
  if (!props.data?.statistics?.vespaScores) return null
  // Scale to 0-100 for radar chart
  const scores = props.data.statistics.vespaScores
  return {
    vision: scores.vision * 10,
    effort: scores.effort * 10,
    systems: scores.systems * 10,
    practice: scores.practice * 10,
    attitude: scores.attitude * 10
  }
})

const eriValue = computed(() => {
  return props.data?.statistics?.averageERI || 0
})

const nationalERI = computed(() => {
  return props.data?.statistics?.nationalERI || 0
})

const totalStudents = computed(() => {
  return props.data?.statistics?.totalStudents || 0
})

const responses = computed(() => {
  // For now, use total students - in future, check for actual responses
  return props.data?.statistics?.totalStudents || 0
})

const completionRate = computed(() => {
  return props.data?.statistics?.completionRate || 100
})

const completionClass = computed(() => {
  const rate = completionRate.value
  if (rate >= 90) return 'excellent'
  if (rate >= 75) return 'good'
  if (rate >= 60) return 'fair'
  return 'poor'
})
</script>

<style scoped>
.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
}

.cycle-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cycle-selector label {
  font-weight: 600;
  color: var(--text-primary);
}

.cycle-selector select {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
}

.small-chart-container,
.eri-container,
.completion-container {
  text-align: center;
}

.small-chart-container h4,
.eri-container h4,
.completion-container h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.info-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.info-button:hover {
  opacity: 1;
}

.completion-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.stat-row .label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-row .value {
  font-size: 1.125rem;
  font-weight: bold;
  color: var(--text-primary);
}

.completion-rate.excellent {
  color: #10B981;
}

.completion-rate.good {
  color: #60A5FA;
}

.completion-rate.fair {
  color: #F59E0B;
}

.completion-rate.poor {
  color: #EF4444;
}

/* Modal styles */
.eri-explanation {
  color: var(--text-primary);
  line-height: 1.6;
}

.eri-explanation ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.eri-explanation li {
  margin: 0.5rem 0;
}

.eri-scale {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.scale-item {
  padding: 0.5rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
}

.scale-item.poor {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
}

.scale-item.fair {
  background: rgba(245, 158, 11, 0.2);
  color: #F59E0B;
}

.scale-item.good {
  background: rgba(96, 165, 250, 0.2);
  color: #60A5FA;
}

.scale-item.excellent {
  background: rgba(16, 185, 129, 0.2);
  color: #10B981;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .cycle-selector {
    justify-content: center;
  }
}
</style>