<template>
  <div class="questionnaire-insights">
    <div class="insights-header">
      <h3>
        <div class="title-content">
          <span class="icon">📊</span> Questionnaire Insights
        </div>
        <button class="qla-info-btn" @click="showInfoModal = true">i</button>
      </h3>
    </div>
    
    <div class="insights-grid">
      <InsightCard 
        v-for="insight in insights" 
        :key="insight.id"
        :insight="insight"
        @click="handleInsightClick(insight)"
      />
    </div>

    <!-- Info Modal -->
    <Modal v-if="showInfoModal" @close="showInfoModal = false">
      <div class="info-modal-content">
        <h3>Understanding Questionnaire Insights</h3>
        <p>These insights are calculated from specific groups of questions to measure key psychometric indicators:</p>
        
        <div class="insights-explanation">
          <p><strong>Percentage Agreement:</strong> The percentage of students who responded with 4 (Agree) or 5 (Strongly Agree) to the questions in each insight category.</p>
          <p><strong>Color Coding:</strong></p>
          <ul>
            <li><span class="color-excellent">Green (75%+)</span>: Excellent - Most students show positive indicators</li>
            <li><span class="color-good">Blue (60-74%)</span>: Good - Majority positive but room for improvement</li>
            <li><span class="color-average">Yellow (40-59%)</span>: Average - Mixed responses, needs attention</li>
            <li><span class="color-poor">Red (&lt;40%)</span>: Poor - Significant area for improvement</li>
          </ul>
        </div>
      </div>
    </Modal>

    <!-- Insight Detail Modal -->
    <InsightDetailModal 
      v-if="selectedInsight"
      :insight="selectedInsight"
      @close="selectedInsight = null"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InsightCard from './InsightCard.vue'
import InsightDetailModal from './InsightDetailModal.vue'
import Modal from '../common/Modal.vue'

const props = defineProps({
  insights: {
    type: Array,
    required: true
  }
})

const showInfoModal = ref(false)
const selectedInsight = ref(null)

function handleInsightClick(insight) {
  selectedInsight.value = insight
}
</script>

<style scoped>
.questionnaire-insights {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
}

.insights-header {
  margin-bottom: var(--spacing-lg);
}

.insights-header h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
}

.title-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.title-content .icon {
  font-size: 1.5rem;
}

.qla-info-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  font-size: 0.875rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qla-info-btn:hover {
  background: var(--primary-dark);
  transform: scale(1.1);
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.info-modal-content {
  padding: var(--spacing-lg);
}

.info-modal-content h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.insights-explanation {
  margin-top: var(--spacing-md);
}

.insights-explanation ul {
  margin-top: var(--spacing-sm);
  padding-left: var(--spacing-lg);
}

.insights-explanation li {
  margin-bottom: var(--spacing-xs);
}

.color-excellent {
  color: var(--success-color);
  font-weight: 600;
}

.color-good {
  color: var(--info-color);
  font-weight: 600;
}

.color-average {
  color: var(--warning-color);
  font-weight: 600;
}

.color-poor {
  color: var(--danger-color);
  font-weight: 600;
}

@media (max-width: 768px) {
  .insights-grid {
    grid-template-columns: 1fr;
  }
}
</style>