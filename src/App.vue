<template>
  <div id="vue-dashboard" class="dashboard-container">
    <!-- Loading State -->
    <div v-if="loading" class="dashboard-loading">
      <div class="spinner"></div>
      <p>Loading dashboard...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="dashboard-error">
      <div class="error-icon">⚠️</div>
      <h3>Error Loading Dashboard</h3>
      <p>{{ error }}</p>
      <button @click="retry" class="btn-retry">Retry</button>
    </div>

    <!-- Main Dashboard -->
    <div v-else class="dashboard-content">
      <!-- Header -->
      <DashboardHeader 
        :user-email="userEmail"
        :is-super-user="isSuperUser"
        :selected-establishment="selectedEstablishment"
        @establishment-change="handleEstablishmentChange"
        @data-refreshed="handleDataRefreshed"
      />

      <!-- Tab Navigation -->
      <div class="dashboard-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Filters Bar -->
      <FilterBar 
        v-if="activeTab === 'overview' || activeTab === 'qla' || activeTab === 'insights'"
        :filters="filters"
        :context="activeTab"
        @filter-change="handleFilterChange"
      />

      <!-- Tab Content -->
      <div class="tab-content">
        <transition name="fade" mode="out-in">
          <component 
            :is="currentTabComponent" 
            :key="activeTab"
            :data="dashboardData"
            :filters="filters"
            :loading="sectionLoading"
            @update-filter="handleFilterChange"
          />
        </transition>
      </div>
    </div>

    <!-- Super User Controls (Modal) -->
    <SuperUserModal 
      v-if="showSuperUserModal"
      :establishments="establishments"
      @select="handleEstablishmentSelect"
      @close="showSuperUserModal = false"
    />

    <!-- Loading Modal for filters/data operations -->
    <LoadingModal 
      :is-loading="filterLoading"
      title="Applying Filters"
      message="Processing your selection, this may take a moment..."
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { useDashboardStore } from './stores/dashboard'
import DashboardHeader from './components/DashboardHeader.vue'
import FilterBar from './components/FilterBar.vue'
import SuperUserModal from './components/SuperUserModal.vue'
import LoadingModal from './components/common/LoadingModal.vue'
import OverviewSection from './components/Overview/OverviewSection.vue'
import QLASection from './components/QLA/QLASection.vue'
import InsightsSection from './components/Insights/InsightsSection.vue'

// Store
const store = useDashboardStore()

// State
const loading = ref(true)
const error = ref(null)
const sectionLoading = ref(false)
const activeTab = ref('overview')
const showSuperUserModal = ref(false)
const filterLoading = ref(false)

// Computed
const userEmail = computed(() => store.userEmail)
const isSuperUser = computed(() => store.isSuperUser)
const selectedEstablishment = computed(() => store.selectedEstablishment)
const establishments = computed(() => store.establishments)
const dashboardData = computed(() => store.dashboardData)
const filters = computed(() => store.filters)

// Tab configuration
const tabs = [
  { id: 'overview', label: 'Overview', component: OverviewSection },
  { id: 'qla', label: 'Question Level Analysis', component: QLASection },
  { id: 'insights', label: 'Student Comment Insights', component: InsightsSection }
]

const currentTabComponent = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab ? tab.component : null
})

// Methods
async function initialize() {
  try {
    loading.value = true
    error.value = null
    
    await store.initialize()
    
    // If super user, show establishment selector
    if (store.isSuperUser) {
      showSuperUserModal.value = true
    } else {
      // Load data for staff admin's establishment
      await loadDashboardData()
    }
  } catch (err) {
    console.error('Dashboard initialization error:', err)
    error.value = err.message || 'Failed to initialize dashboard'
  } finally {
    loading.value = false
  }
}

async function loadDashboardData() {
  // Don't load if no establishment is selected
  if (!store.selectedEstablishment) {
    console.warn('No establishment selected, skipping data load')
    return
  }
  
  try {
    sectionLoading.value = true
    await store.loadDashboardData()
  } catch (err) {
    console.error('Error loading dashboard data:', err)
    error.value = err.message || 'Failed to load dashboard data'
  } finally {
    sectionLoading.value = false
  }
}

function handleEstablishmentChange() {
  // When super user clicks "Change School", open the selector modal
  showSuperUserModal.value = true
}

function handleEstablishmentSelect(establishment) {
  showSuperUserModal.value = false
  store.selectEstablishment(establishment.id)
  loadDashboardData()
}

async function handleDataRefreshed() {
  // When refresh button is clicked, reload dashboard data
  console.log('[App] Data refreshed, reloading dashboard...')
  await loadDashboardData()
}

async function handleFilterChange(filterType, value) {
  filterLoading.value = true
  try {
    await store.updateFilter(filterType, value)
  } finally {
    filterLoading.value = false
  }
}

function retry() {
  initialize()
}

// Lifecycle
onMounted(() => {
  initialize()
})
</script>

<style>
/* Import existing styles */
@import './assets/styles/dashboard.css';

/* Vue-specific styles */
.dashboard-container {
  min-height: 100vh;
  background: #0f0f23;
}

.dashboard-loading,
.dashboard-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4A90E2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dashboard-error {
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 1rem;
}

.btn-retry {
  background: #4A90E2;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.btn-retry:hover {
  background: #357ABD;
}

/* Tab Navigation - Enhanced for better visibility */
.dashboard-tabs {
  display: flex;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  padding: 0.25rem;
  margin: 0 0 0.5rem 0;
  gap: 0.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.tab-button {
  flex: 1;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  transition: background 0.3s ease;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tab-button.active {
  background: white;
  color: #2c3e50;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tab-button.active::before {
  background: linear-gradient(90deg, #ff8f00 0%, #86b4f0 50%, #72cb44 100%);
  height: 4px;
}

/* Tab Content */
.tab-content {
  padding: 2rem 0;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>