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
  }
})

const emit = defineEmits(['filter-change'])

const store = useDashboardStore()

// Local state
const yearGroups = ref([])
const groups = ref([])
const faculties = ref([])
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
         props.filters.studentId !== null
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
    const [yearGroupsData, groupsData, facultiesData] = await Promise.all([
      API.getYearGroups(store.selectedEstablishment),
      API.getGroups(store.selectedEstablishment),
      API.getFaculties(store.selectedEstablishment)
    ])

    yearGroups.value = yearGroupsData
    groups.value = groupsData
    faculties.value = facultiesData
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
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin: var(--spacing-lg) 0;
}

.filter-container {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.search-group {
  min-width: 300px;
}

.filter-label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.form-select {
  padding-right: 2.5rem;
  cursor: pointer;
}

.form-select:hover,
.form-input:hover {
  border-color: var(--accent-primary);
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
    min-width: calc(50% - var(--spacing-sm));
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