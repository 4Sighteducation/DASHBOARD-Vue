<template>
  <header class="dashboard-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="dashboard-title">VESPA Dashboard</h1>
        <div v-if="selectedEstablishment" class="establishment-info">
          <span class="establishment-label">Viewing:</span>
          <span class="establishment-name">{{ establishmentName }}</span>
        </div>
      </div>
      
      <div class="header-right">
        <div class="user-info">
          <span class="user-email">{{ userEmail }}</span>
          <span v-if="isSuperUser" class="user-role">Super User</span>
          <span v-else class="user-role">Staff Admin</span>
        </div>
        
        <!-- NEW: Refresh Data Button -->
        <button 
          v-if="selectedEstablishment" 
          @click="refreshData" 
          :disabled="refreshing"
          class="btn btn-refresh"
          :title="refreshing ? 'Refreshing data...' : 'Refresh data from Knack'"
        >
          <svg v-if="!refreshing" class="icon refresh-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span v-if="refreshing" class="spinner-small"></span>
          {{ refreshing ? 'Refreshing...' : 'Refresh Data' }}
        </button>
        
        <button v-if="isSuperUser" @click="showComparativeReport = true" class="btn btn-primary">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Comparative Report
        </button>
        
        <button v-if="isSuperUser" @click="openEstablishmentSelector" class="btn btn-secondary">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Change School
        </button>
      </div>
    </div>
    
    <!-- Comparative Report Modal -->
    <ComparativeReportModal 
      v-if="showComparativeReport"
      :show="showComparativeReport"
      @close="showComparativeReport = false"
      @report-generated="handleReportGenerated"
    />
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { API } from '../services/api'
import ComparativeReportModal from './Reports/ComparativeReportModal.vue'

const props = defineProps({
  userEmail: String,
  isSuperUser: Boolean,
  selectedEstablishment: String
})

const emit = defineEmits(['establishment-change', 'report-generated', 'data-refreshed'])

const establishmentName = ref('Loading...')
const showComparativeReport = ref(false)
const refreshing = ref(false)

// Fetch establishment name when selection changes
watch(() => props.selectedEstablishment, async (newVal) => {
  if (newVal) {
    try {
      const data = await API.getEstablishmentName(newVal)
      establishmentName.value = data.name
    } catch (error) {
      establishmentName.value = 'Unknown School'
    }
  }
}, { immediate: true })

function openEstablishmentSelector() {
  emit('establishment-change')
}

function handleReportGenerated(event) {
  console.log('Report generated:', event)
  emit('report-generated', event)
  // Could show a success notification here
}

async function refreshData() {
  if (!props.selectedEstablishment || refreshing.value) return
  
  refreshing.value = true
  console.log('[DashboardHeader] Refreshing data for establishment:', props.selectedEstablishment)
  
  try {
    const response = await API.refreshEstablishmentData(props.selectedEstablishment)
    
    if (response.success) {
      const duration = Math.round(response.summary?.duration_seconds || 0)
      const students = response.summary?.students_synced || 0
      
      console.log('[DashboardHeader] Refresh successful:', response.summary)
      
      // Emit event to parent to reload dashboard data
      emit('data-refreshed')
      
      // Show success message
      alert(`✅ Data refreshed successfully!\n\nUpdated ${students} students in ${duration} seconds.`)
    }
  } catch (error) {
    console.error('[DashboardHeader] Refresh failed:', error)
    alert(`❌ Failed to refresh data: ${error.message}`)
  } finally {
    refreshing.value = false
  }
}
</script>

<style scoped>
.dashboard-header {
  background: var(--secondary-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 0.5rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.establishment-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.establishment-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.establishment-name {
  color: var(--text-primary);
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.user-email {
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
}

.user-role {
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.icon {
  margin-right: var(--spacing-xs);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-refresh {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  position: relative;
  overflow: hidden;
}

.btn-refresh:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.btn-refresh:hover .refresh-icon {
  animation: spin-slow 1s linear;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 var(--spacing-md);
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .dashboard-title {
    font-size: 1.25rem;
  }
  
  .establishment-info {
    font-size: 0.875rem;
  }
  
  .user-info {
    display: none;
  }
}</style>