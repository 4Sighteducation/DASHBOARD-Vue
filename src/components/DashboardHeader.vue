<template>
  <header class="dashboard-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="dashboard-title">VESPA Dashboard</h1>
        
        <!-- Academic Year Filter - Always shown -->
        <div class="academic-year-selector">
          <label class="filter-label">Academic Year:</label>
          <select 
            v-model="selectedAcademicYear" 
            @change="handleAcademicYearChange"
            class="form-select compact"
          >
            <option v-for="year in academicYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>
        
        <!-- Establishment Info - Only for Super Users -->
        <div v-if="selectedEstablishment && isSuperUser" class="establishment-info">
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
        
        <button v-if="isSuperUser" @click="openEstablishmentSelector" class="btn btn-secondary">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Change School
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { API } from '../services/api'
import { useDashboardStore } from '../stores/dashboard'

const props = defineProps({
  userEmail: String,
  isSuperUser: Boolean,
  selectedEstablishment: String
})

const emit = defineEmits(['establishment-change', 'academic-year-change'])

const store = useDashboardStore()

const establishmentName = ref('Loading...')
const academicYears = ref([])
const selectedAcademicYear = ref(null)

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

// Load academic years on mount
async function loadAcademicYears() {
  try {
    const years = await API.getAcademicYears()
    academicYears.value = years
    
    // Set current academic year as default
    const currentYear = getCurrentAcademicYear()
    if (years.includes(currentYear)) {
      selectedAcademicYear.value = currentYear
    } else if (years.length > 0) {
      selectedAcademicYear.value = years[0]
    }
    
    // Update store with selected year
    store.filters.academicYear = selectedAcademicYear.value
  } catch (error) {
    console.error('Failed to load academic years:', error)
    // Fallback to current year
    const currentYear = getCurrentAcademicYear()
    academicYears.value = [currentYear]
    selectedAcademicYear.value = currentYear
    store.filters.academicYear = currentYear
  }
}

// Get current academic year (Aug-Jul)
function getCurrentAcademicYear() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12
  
  // Academic year starts in August
  if (month >= 8) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

function handleAcademicYearChange() {
  store.updateFilter('academicYear', selectedAcademicYear.value)
}

function openEstablishmentSelector() {
  emit('establishment-change')
}

// Load academic years on mount
onMounted(() => {
  loadAcademicYears()
})
</script>

<style scoped>
.dashboard-header {
  background: var(--secondary-bg);
  border-bottom: 1px solid var(--border-color);
  padding: var(--spacing-md) 0;
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

.academic-year-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.filter-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.form-select.compact {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  min-width: 100px;
  border: 1px solid var(--border-color);
  background-color: var(--secondary-bg);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.form-select.compact:hover {
  border-color: var(--accent-primary);
}

.form-select.compact:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
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