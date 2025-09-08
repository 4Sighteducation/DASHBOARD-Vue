<template>
  <Modal @close="$emit('close')">
    <div class="insight-detail-modal">
      <div class="modal-header">
        <div class="header-icon">{{ insight.icon }}</div>
        <h2>{{ insight.title }}</h2>
      </div>

      <div class="modal-body">
        <!-- Overall Score -->
        <div class="score-section" :class="colorClass">
          <div class="score-value">{{ insight.percentageAgreement }}%</div>
          <div class="score-label">Agreement Score</div>
          <div class="score-interpretation">{{ interpretation }}</div>
        </div>

        <!-- Description -->
        <div class="description-section">
          <h3>What This Measures</h3>
          <p>{{ getDescription() }}</p>
        </div>

        <!-- Questions Included -->
        <div class="questions-section">
          <h3>Questions Included</h3>
          <ul class="questions-list">
            <li v-for="(questionId, index) in insight.questionIds" :key="questionId">
              {{ getQuestionText(questionId) }}
            </li>
          </ul>
        </div>

        <!-- Why It Matters -->
        <div class="importance-section">
          <h3>Why This Matters</h3>
          <p>{{ getImportance() }}</p>
        </div>

        <!-- Recommendations -->
        <div class="recommendations-section">
          <h3>Recommended Actions</h3>
          <div class="recommendations-grid">
            <div 
              v-for="(rec, index) in getRecommendations()" 
              :key="index"
              class="recommendation-card"
            >
              <div class="rec-icon">{{ rec.icon }}</div>
              <div class="rec-content">
                <h4>{{ rec.title }}</h4>
                <p>{{ rec.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import Modal from '../common/Modal.vue'

const props = defineProps({
  insight: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

// Insight details configuration
const insightDetails = {
  growth_mindset: {
    description: 'Measures students\' belief that intelligence and abilities can be developed through effort and learning.',
    importance: 'Students with a growth mindset are more likely to persist through challenges, embrace feedback, and achieve better academic outcomes.',
    questions: {
      'q5': 'No matter who you are, you can change your intelligence a lot',
      'q26': 'Your intelligence is something about you that you can change very much'
    }
  },
  academic_momentum: {
    description: 'Captures students\' intrinsic drive, engagement with learning, and commitment to excellence.',
    importance: 'Students with high academic momentum are self-motivated and more likely to sustain performance through challenges.',
    questions: {
      'q14': 'I strive to achieve the goals I set for myself',
      'q16': 'I enjoy learning new things',
      'q17': 'I\'m not happy unless my work is the best it can be',
      'q9': 'I am a hard working student'
    }
  },
  study_effectiveness: {
    description: 'Measures adoption of evidence-based study techniques that improve learning and retention.',
    importance: 'Effective study techniques significantly improve exam performance and long-term retention of material.',
    questions: {
      'q7': 'I test myself on important topics until I remember them',
      'q12': 'I spread out my revision, rather than cramming at the last minute',
      'q15': 'I summarise important information in diagrams, tables or lists'
    }
  },
  exam_confidence: {
    description: 'Students\' belief in their ability to achieve their potential in final exams.',
    importance: 'Confidence correlates with performance - students who believe they can succeed are more likely to do so.',
    questions: {
      'outcome_q_confident': 'I am confident I will achieve my potential in my final exams'
    }
  },
  organization_skills: {
    description: 'Measures students\' ability to plan, organize, and manage their academic responsibilities.',
    importance: 'Well-organized students are less stressed, more productive, and better able to balance multiple demands.',
    questions: {
      'q2': 'I plan and organise my time to get my work done',
      'q22': 'My books/files are organised',
      'q11': 'I always meet deadlines'
    }
  },
  resilience_factor: {
    description: 'Students\' ability to bounce back from setbacks and maintain a positive outlook.',
    importance: 'Resilient students persist through challenges and learn from failures rather than being defeated by them.',
    questions: {
      'q13': 'I don\'t let a poor test/assessment result get me down for too long',
      'q8': 'I have a positive view of myself',
      'q27': 'I like hearing feedback about how I can improve'
    }
  },
  stress_management: {
    description: 'Students\' ability to handle academic pressure and control exam nerves.',
    importance: 'Effective stress management improves performance, wellbeing, and prevents burnout.',
    questions: {
      'q20': 'I feel I can cope with the pressure at school/college/University',
      'q28': 'I can control my nerves in tests/practical assessments'
    }
  },
  active_learning: {
    description: 'Engagement with active learning techniques that deepen understanding and retention.',
    importance: 'Active learning techniques are proven to be more effective than passive studying.',
    questions: {
      'q7': 'I test myself on important topics until I remember them',
      'q23': 'When preparing for a test/exam I teach someone else the material',
      'q19': 'When revising I mix different kinds of topics/subjects in one study session'
    }
  },
  support_readiness: {
    description: 'Students\' perception of having adequate support to achieve their goals.',
    importance: 'Students who feel supported are more likely to seek help when needed and achieve better outcomes.',
    questions: {
      'outcome_q_support': 'I have the support I need to achieve this year'
    }
  },
  time_management: {
    description: 'Students\' ability to effectively plan and use their time for academic work.',
    importance: 'Good time management reduces stress, improves work quality, and enables better work-life balance.',
    questions: {
      'q2': 'I complete all my homework on time',
      'q4': 'I start my work promptly rather than procrastinating',
      'q11': 'I plan and organise my time to get my work done'
    }
  },
  academic_confidence: {
    description: 'Students\' belief in their academic abilities and positive self-perception.',
    importance: 'Academic confidence is a strong predictor of achievement and willingness to take on challenges.',
    questions: {
      'q10': 'I am confident in my academic ability',
      'q8': 'I have a positive view of myself'
    }
  },
  revision_readiness: {
    description: 'Students\' perception of being equipped to handle revision and study challenges.',
    importance: 'Feeling prepared for revision reduces anxiety and improves study effectiveness.',
    questions: {
      'outcome_q_equipped': 'I feel equipped to face the study and revision challenges this year'
    }
  }
}

// Color class based on percentage
const colorClass = computed(() => {
  const percentage = props.insight.percentageAgreement
  if (percentage >= 75) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'average'
  return 'poor'
})

// Interpretation based on score
const interpretation = computed(() => {
  const percentage = props.insight.percentageAgreement
  if (percentage >= 75) return 'Excellent - Most students show positive indicators'
  if (percentage >= 60) return 'Good - Majority positive but room for improvement'
  if (percentage >= 40) return 'Average - Mixed responses, needs attention'
  return 'Poor - Significant area for improvement'
})

function getDescription() {
  return insightDetails[props.insight.id]?.description || ''
}

function getImportance() {
  return insightDetails[props.insight.id]?.importance || ''
}

function getQuestionText(questionId) {
  const questions = insightDetails[props.insight.id]?.questions || {}
  return questions[questionId] || questionId
}

function getRecommendations() {
  const percentage = props.insight.percentageAgreement
  const insightId = props.insight.id
  
  // Base recommendations for all insights
  const baseRecs = {
    excellent: [
      {
        icon: '🎯',
        title: 'Maintain Excellence',
        description: 'Continue current practices and share successful strategies with peers'
      },
      {
        icon: '📊',
        title: 'Monitor Progress',
        description: 'Regular check-ins to ensure standards remain high'
      }
    ],
    good: [
      {
        icon: '🔍',
        title: 'Identify Gaps',
        description: 'Survey students scoring below 4 to understand specific challenges'
      },
      {
        icon: '🎓',
        title: 'Targeted Support',
        description: 'Provide focused interventions for the 25-40% not yet positive'
      }
    ],
    average: [
      {
        icon: '📚',
        title: 'Comprehensive Program',
        description: 'Implement structured program to address this area school-wide'
      },
      {
        icon: '👥',
        title: 'Peer Learning',
        description: 'Create peer mentoring to leverage students already strong in this area'
      }
    ],
    poor: [
      {
        icon: '🚨',
        title: 'Urgent Intervention',
        description: 'Make this a priority focus area with dedicated resources'
      },
      {
        icon: '🔄',
        title: 'Culture Change',
        description: 'Work on shifting mindsets and providing intensive support'
      }
    ]
  }
  
  if (percentage >= 75) return baseRecs.excellent
  if (percentage >= 60) return baseRecs.good
  if (percentage >= 40) return baseRecs.average
  return baseRecs.poor
}
</script>

<style scoped>
.insight-detail-modal {
  max-width: 800px;
  margin: 0 auto;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.header-icon {
  font-size: 3rem;
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
}

.modal-body > div {
  margin-bottom: var(--spacing-xl);
}

.modal-body > div:last-child {
  margin-bottom: 0;
}

/* Score Section */
.score-section {
  text-align: center;
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.score-value {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
}

.score-section.excellent .score-value {
  color: var(--success-color);
}

.score-section.good .score-value {
  color: var(--info-color);
}

.score-section.average .score-value {
  color: var(--warning-color);
}

.score-section.poor .score-value {
  color: var(--danger-color);
}

.score-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: var(--spacing-xs);
}

.score-interpretation {
  margin-top: var(--spacing-sm);
  font-weight: 500;
}

/* Section Headers */
.modal-body h3 {
  font-size: 1.125rem;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

/* Questions List */
.questions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.questions-list li {
  padding: var(--spacing-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-xs);
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Recommendations Grid */
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.recommendation-card {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.rec-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.rec-content h4 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.rec-content p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}
</style>