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
      <template #header>
        <h3>
          <span class="modal-icon">💡</span>
          Understanding Questionnaire Insights
        </h3>
      </template>
      
      <div class="info-modal-content">
        <div class="modal-intro">
          <p>These insights are calculated from specific groups of questions to measure key psychometric indicators that research shows are crucial for academic success.</p>
        </div>
        
        <div class="modal-section">
          <h4>📊 How It Works</h4>
          <div class="info-card">
            <p><strong>Percentage Agreement:</strong> The percentage of students who responded with 4 (Agree) or 5 (Strongly Agree) to the questions in each insight category.</p>
          </div>
        </div>
        
        <div class="modal-section">
          <h4>🎨 Color Coding Guide</h4>
          <div class="color-guide">
            <div class="color-item excellent">
              <span class="color-badge">75%+</span>
              <div>
                <strong>Excellent</strong>
                <p>Most students show positive indicators</p>
              </div>
            </div>
            <div class="color-item good">
              <span class="color-badge">60-74%</span>
              <div>
                <strong>Good</strong>
                <p>Majority positive but room for improvement</p>
              </div>
            </div>
            <div class="color-item average">
              <span class="color-badge">40-59%</span>
              <div>
                <strong>Average</strong>
                <p>Mixed responses, needs attention</p>
              </div>
            </div>
            <div class="color-item poor">
              <span class="color-badge">&lt;40%</span>
              <div>
                <strong>Poor</strong>
                <p>Significant area for improvement</p>
              </div>
            </div>
          </div>
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
  gap: var(--spacing-md);
  width: 100%;
}

/* Desktop: 4 columns (default) */
@media (min-width: 1024px) {
  .insights-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* Tablet landscape: 3 columns */
@media (max-width: 1023px) and (min-width: 768px) {
  .insights-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Tablet portrait: 2 columns */
@media (max-width: 767px) and (min-width: 480px) {
  .insights-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Mobile: 1 column */
@media (max-width: 479px) {
  .insights-grid {
    grid-template-columns: 1fr;
  }
}

.modal-icon {
  font-size: 1.5rem;
  margin-right: var(--spacing-sm);
}

.info-modal-content {
  color: var(--text-primary);
}

.modal-intro {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.modal-intro p {
  margin: 0;
  line-height: 1.6;
  color: var(--text-primary);
}

.modal-section {
  margin-bottom: var(--spacing-xl);
}

.modal-section h4 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.info-card {
  background: var(--background-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.info-card p {
  margin: 0;
  line-height: 1.6;
}

.color-guide {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.color-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--background-tertiary);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.color-item:hover {
  transform: translateX(4px);
}

.color-item.excellent {
  border-color: #10b981;
  background: linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent);
}

.color-item.good {
  border-color: #3b82f6;
  background: linear-gradient(to right, rgba(59, 130, 246, 0.1), transparent);
}

.color-item.average {
  border-color: #f59e0b;
  background: linear-gradient(to right, rgba(245, 158, 11, 0.1), transparent);
}

.color-item.poor {
  border-color: #ef4444;
  background: linear-gradient(to right, rgba(239, 68, 68, 0.1), transparent);
}

.color-badge {
  font-weight: 700;
  font-size: 1.125rem;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.1);
  min-width: 60px;
  text-align: center;
}

.color-item.excellent .color-badge {
  color: #10b981;
  background: rgba(16, 185, 129, 0.2);
}

.color-item.good .color-badge {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.2);
}

.color-item.average .color-badge {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
}

.color-item.poor .color-badge {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
}

.color-item strong {
  display: block;
  margin-bottom: 0.25rem;
}

.color-item p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
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