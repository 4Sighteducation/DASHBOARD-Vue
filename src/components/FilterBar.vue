<template>
  <div class="filter-bar">
    <div class="filter-container">
      <div class="filter-group">
        <label class="filter-label">Academic Year</label>
        <select 
          class="form-select"
          v-model="selectedAcademicYear"
          @change="updateFilter('academicYear', $event.target.value)"
        >
          <option v-for="year in academicYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label class="filter-label">Year Group</label>
        <select 
          class="form-select"
          :value="filters.yearGroup"
          @change="updateFilter('yearGroup', $event.target.value)"
        >
          <option value="all">All Year Groups</option>
          <option v-for="year in yearGroups" :key="year" :value="year">
            Year {{ year }}
          </option>
        </select>
      </div>

      <!-- Cycle Filter - Only show for Student Comment Insights -->
      <div v-if="showCycleFilter" class="filter-group">
        <label class="filter-label">Cycle</label>
        <select 
          class="form-select"
          :value="filters.cycle || 1"
          @change="updateFilter('cycle', parseInt($event.target.value))"
        >
          <option :value="1">Cycle 1</option>
          <option :value="2">Cycle 2</option>
          <option :value="3">Cycle 3</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Group</label>
        <select 
          class="form-select"
          :value="filters.group"
          @change="updateFilter('group', $event.target.value)"
          :disabled="!groups.length"
        >
          <option value="all">All Groups</option>
          <option v-for="group in groups" :key="group" :value="group">
            {{ group }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Faculty</label>
        <select 
          class="form-select"
          :value="filters.faculty"
          @change="updateFilter('faculty', $event.target.value)"
          :disabled="!faculties.length"
        >
          <option value="all">All Faculties</option>
          <option v-for="faculty in faculties" :key="faculty" :value="faculty">
            {{ faculty }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Gender</label>
        <select
          class="form-select"
          :value="filters.gender"
          @change="updateFilter('gender', $event.target.value)"
        >
          <option value="all">All Genders</option>
          <option v-for="gender in genders" :key="gender" :value="gender">
            {{ gender }}
          </option>
        </select>
      </div>

      <div class="filter-group search-group">
        <label class="filter-label">Search Student</label>
        <div class="search-wrapper">
          <input 
            type="text"
            class="form-input"
            v-model="searchQuery"
            @input="handleSearchInput"
            @focus="showSearchResults = true"
            @blur="handleSearchBlur"
            placeholder="Type student name or email..."
          />
          <div v-if="showSearchResults && (searchResults.length || searchQuery)" class="search-results">
            <div v-if="searchLoading" class="search-loading">Searching...</div>
            <div v-else-if="searchResults.length === 0 && searchQuery" class="search-empty">
              No students found
            </div>
            <div v-else>
              <div 
                v-for="student in searchResults" 
                :key="student.id"
                class="search-result-item"
                @mousedown="selectStudent(student)"
              >
                <div class="student-name">{{ student.name }}</div>
                <div class="student-info">
                  <span v-if="student.yearGroup">Year {{ student.yearGroup }}</span>
                  <span v-if="student.group"> • {{ student.group }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        v-if="hasActiveFilters" 
        @click="clearFilters"
        class="btn btn-secondary btn-sm"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDashboardStore } from '../stores/dashboard'
import { API } from '../services/api'
import { debounce } from '../utils/debounce'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  context: {
    type: String,
    default: 'overview'
  }
})

const emit = defineEmits(['filter-change'])

const store = useDashboardStore()

// Local state
const yearGroups = ref([])
const groups = ref([])
const faculties = ref([])
const genders = ref([])
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const showSearchResults = ref(false)
const academicYears = ref([])
const selectedAcademicYear = ref(store.filters.academicYear || '')

// Computed
const hasActiveFilters = computed(() => {
  return props.filters.yearGroup !== 'all' || 
         props.filters.group !== 'all' ||
         props.filters.faculty !== 'all' ||
         props.filters.gender !== 'all' ||
         props.filters.studentId !== null
})

// Show cycle filter only for Student Comment Insights
const showCycleFilter = computed(() => {
  return props.context === 'insights'
})

// Load filter options when establishment changes
watch(() => store.selectedEstablishment, async (newVal) => {
  if (newVal) {
    await loadFilterOptions()
  }
})

// Debounced search function
const performSearch = debounce(async (query) => {
  if (!query || query.length < 2) {
    searchResults.value = []
    return
  }

  searchLoading.value = true
  try {
    const results = await API.searchStudents(store.selectedEstablishment, query)
    searchResults.value = results
  } catch (error) {
    console.error('Failed to search students:', error)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}, 300)

// Methods
async function loadFilterOptions() {
  try {
    const [yearGroupsData, groupsData, facultiesData, gendersData] = await Promise.all([
      API.getYearGroups(store.selectedEstablishment),
      API.getGroups(store.selectedEstablishment),
      API.getFaculties(store.selectedEstablishment),
      API.getGenders(store.selectedEstablishment)
    ])

    yearGroups.value = yearGroupsData
    groups.value = groupsData
    faculties.value = facultiesData
    genders.value = gendersData
  } catch (error) {
    console.error('Failed to load filter options:', error)
  }
}

function updateFilter(filterType, value) {
  emit('filter-change', filterType, value)
}

function handleSearchInput(event) {
  const query = event.target.value
  performSearch(query)
}

function handleSearchBlur() {
  // Delay hiding results to allow click on result
  setTimeout(() => {
    showSearchResults.value = false
  }, 200)
}

function selectStudent(student) {
  searchQuery.value = student.name
  searchResults.value = []
  showSearchResults.value = false
  emit('filter-change', 'studentId', student.id)
  // Also emit the student name for display
  emit('filter-change', 'studentName', student.name)
}

function clearFilters() {
  searchQuery.value = ''
  searchResults.value = []
  store.resetFilters()
}

// Load academic years
async function loadAcademicYears() {
  try {
    const years = await API.getAcademicYears()
    academicYears.value = years
    
    // Sync with store's academic year
    if (store.filters.academicYear && years.includes(store.filters.academicYear)) {
      selectedAcademicYear.value = store.filters.academicYear
    }
  } catch (error) {
    console.error('Failed to load academic years:', error)
    // Use current year as fallback
    const currentYear = store.getCurrentAcademicYear()
    academicYears.value = [currentYear]
    selectedAcademicYear.value = currentYear
  }
}

// Watch for academic year changes from store
watch(() => store.filters.academicYear, (newYear) => {
  if (newYear && newYear !== selectedAcademicYear.value) {
    selectedAcademicYear.value = newYear
  }
})

// Load initial data
onMounted(() => {
  loadAcademicYears()
  if (store.selectedEstablishment) {
    loadFilterOptions()
  }
})
</script>

<style scoped>
.filter-bar {
  background: linear-gradient(135deg, rgba(44, 62, 80, 0.05) 0%, rgba(52, 73, 94, 0.05) 100%);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  margin: 0.5rem 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.filter-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff8f00 0%, #86b4f0 33%, #72cb44 66%, #7f31a4 100%);
}

.filter-container {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1 1 160px;
  min-width: 160px;
}

.search-group {
  flex: 2 1 320px;
  min-width: 260px;
}

.filter-label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background-color: white;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: #2c3e50; /* Dark text for white background */
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-select {
  padding-right: 2.5rem;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%234a5568' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.875rem center;
  background-size: 12px;
  appearance: none;
}

.form-select:hover,
.form-input:hover {
  border-color: #4A90E2;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(74, 144, 226, 0.15);
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1), 0 3px 8px rgba(74, 144, 226, 0.15);
}

.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Ensure option text is also dark */
.form-select option {
  color: #2c3e50;
  background-color: white;
}

/* Placeholder text color */
.form-input::placeholder {
  color: #94a3b8;
  opacity: 1;
}

.search-wrapper {
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}

.search-loading,
.search-empty {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.search-result-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid var(--border-color);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: var(--secondary-bg);
}

.student-name {
  font-weight: 500;
  color: var(--text-primary);
}

.student-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

@media (max-width: 1024px) {
  .filter-group {
    min-width: calc(33.333% - var(--spacing-sm));
  }
  
  .search-group {
    min-width: 100%;
  }
}

@media (max-width: 640px) {
  .filter-container {
    flex-direction: column;
  }
  
  .filter-group,
  .search-group {
    width: 100%;
    min-width: unset;
  }
  
  .btn-sm {
    width: 100%;
  }
}</style>