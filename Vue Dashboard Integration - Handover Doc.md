Vue Dashboard Integration - Handover Document
============================================

Current Status (January 2025)
----------------------------
The Vue Dashboard is now functional with most core features working:
- ✅ VESPA histograms with national comparisons
- ✅ Dynamic filtering system (Year Group, Group, Faculty, Student Search)
- ✅ Individual student view with detailed scores
- ✅ ERI speedometer with national indicator
- ✅ Loading states for all operations
- ✅ Responsive design

Main Outstanding Issues:
- ⚠️ Performance optimization needed for large schools (2000+ students)
- ❌ Question Level Analysis (QLA) not displaying data
- ❌ Comment Insights/Word Cloud not implemented
- ❌ Export functionality not implemented

Project Overview
----------------
Application: Vue Dashboard embedded in Knack environment

Architecture:
- Frontend: Vue.js app bundled with Vite, hosted on JSDelivr CDN
- Backend: Flask API hosted on Heroku
- Database: Supabase (PostgreSQL) - populated daily from Knack via sync process
- Environment: Dashboard embedded in Knack scene_1225, accessed by Staff Admin and Super User roles

User's Working Preferences
--------------------------
- No quick fixes: User explicitly prefers thorough, permanent solutions over temporary workarounds
- Root cause analysis: Deep investigation into problems before implementing solutions
- Git workflow: Always offer to add, commit and push to GitHub repo
- Cache busting: Update filenames (e.g., vuedash2a → vuedash2b) when deploying

Initial Problem
---------------
The Vue dashboard failed to load in Knack environment due to CDN/hosting issues.

Key Issues Resolved
-------------------
1. CDN/MIME Type Issues
Problem: Using https://raw.githubusercontent.com served files with incorrect MIME types
Solution: Changed to https://cdn.jsdelivr.net/gh/ in AppLoaderCopoy.js
javascript
scriptUrl: 'https://cdn.jsdelivr.net/gh/4Sighteducation/DASHBOARD-Vue@main/dist/vuedash1i.js'
cssUrl: 'https://cdn.jsdelivr.net/gh/4Sighteducation/DASHBOARD-Vue@main/dist/vuedash1i.css'
2. CORS Header Issues
Problem: Backend rejected X-Knack-Application-Id and X-Knack-REST-API-KEY headers
Solution: Updated app.py CORS configuration:
python
allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'X-Knack-Application-Id', 'X-Knack-REST-API-Key', 'x-knack-application-id', 'x-knack-rest-api-key']
3. Missing API Endpoints
Problem: Frontend called endpoints that didn't exist (404 errors)
Solution: Added to app.py:
/api/academic-years - Returns distinct years from national_statistics
/api/key-stages - Returns ['KS3', 'KS4', 'KS5']
/api/year-groups - Returns ['7', '8', '9', '10', '11', '12', '13']
/api/establishment/<id> - Returns establishment details
4. Database Schema Mismatches
Problem: /api/qla endpoint used questions.active but column is questions.is_active
Solution: Fixed query in app.py:
python
questions_result = supabase_client.table('questions').select('*').eq('is_active', True).execute()
5. Data Display Issues
Problem: Empty dashboard and wrong school mapping (Coffs Harbour → Ashlyns School)
Diagnosis:
Frontend school selection issue (still unresolved)
Backend statistics transformation already correct
Added debug logging to help diagnose
6. Git Deployment Issue
Problem: Backend changes weren't deploying to Heroku
Root Cause: Project uses git submodules structure:
Main repo: /DASHBOARD/ (contains app.py)
Submodule: /DASHBOARD/DASHBOARD-Vue/
Submodule: /DASHBOARD/dashboard-frontend/
Key Learning: Must commit app.py from root directory, not from within submodules
Current Architecture Understanding
Data Flow
Daily sync: Knack → Supabase (via sync_knack_to_supabase.py)
User login: Knack authentication
Dashboard load: Knack → Vue app → Flask API → Supabase
No direct Knack API calls from dashboard (all data from Supabase)
Key Tables in Supabase
establishments - Schools/institutions
students - Student records
vespa_scores - VESPA assessment scores
school_statistics - Aggregated statistics
questions - QLA questions (has is_active field)
question_statistics - Question-level statistics
staff_admins / super_users - User roles
Outstanding Issues
School Mapping Bug: Selecting "Coffs Harbour" loads data for "Ashlyns School"
Added debug logging in SuperUserModal.vue and dashboard.js
Needs frontend investigation
User Authorization: Backend doesn't verify user permissions
Plan: Pass user email as header, verify against staff_admins/super_users tables
Dynamic Data: Trade-off accepted - data is 1 day old due to daily sync

Recent Updates (January 2025)
7. UUID Conversion Issues
Problem: Frontend sends Knack IDs (strings) but database expects UUIDs
Solution: Created convert_knack_id_to_uuid() helper function
Applied to: /api/statistics, /api/qla, /api/statistics/<school_id>, /api/qla-data, /api/current-averages

8. Frontend Data Format Mismatch
Problem: Frontend expects different data structure than backend provides
Frontend expects: {totalStudents, averageERI, vespaScores: {vision, effort, ...}, comparison: {school: [], national: []}}
Backend was returning: Raw statistics grouped by element
Solution: Transformed /api/statistics response to match frontend expectations

9. No Actual Data Showing
Problem: Backend returning placeholder/calculated data instead of real student data
Root cause: Only querying school_statistics table, not actual vespa_scores or question_responses
Attempted fix: Modified /api/statistics to query vespa_scores table directly
Result: Failed with "No module named 'psycopg2'" error

Current Status
Working:
✅ CORS headers properly configured
✅ All required endpoints exist
✅ UUID conversion handles Knack ID → Supabase UUID
✅ Super Users can see and select establishments
✅ No more 500 errors for filter endpoints

Not Working:
❌ No actual VESPA scores displayed (showing 6.0 for all, which is incorrect)
❌ No Question Level Analysis data
❌ No Comment Insights data
❌ ERI calculation incorrect (should use outcome questions, not VESPA average)
❌ Bar chart showing raw JSON instead of visualization
❌ School switching error: "selectedEstablishment: undefined"
❌ Latest attempt to query vespa_scores failed due to missing psycopg2 module

Critical Issue
The app.py attempted to use psycopg2 for raw SQL queries but the module isn't installed on Heroku.
This needs to be fixed by either:
1. Adding psycopg2 to requirements.txt, OR
2. Using Supabase client methods instead of raw SQL

Data Structure Issues
The main problem is the backend isn't querying the actual data tables:
- vespa_scores: Contains individual student VESPA scores (5-point scale)
- question_responses: Contains individual question responses
- school_statistics: Contains pre-aggregated statistics (appears to be 10-point scale)

The frontend expects data from actual student records, not just aggregated statistics.
Files Modified
Frontend
dashboard-frontend/src/AppLoaderCopoy.js - CDN URLs, cache buster
DASHBOARD-Vue/vite.config.js - Build output filenames
DASHBOARD-Vue/src/services/api.js - Re-enabled Knack headers
DASHBOARD-Vue/src/stores/dashboard.js - Added debug logging
DASHBOARD-Vue/src/components/SuperUserModal.vue - Added debug logging
Backend
app.py - CORS headers, new endpoints, schema fixes, import fixes
Next Immediate Steps
Deploy Backend:
bash
   cd /c/Users/tonyd/OneDrive - 4Sight Education Ltd/Apps/DASHBOARD/DASHBOARD
   git add app.py
   git commit -m "Fix CORS headers, add missing endpoints, fix QLA schema"
   git push origin main
Monitor Heroku deployment and test all endpoints
Investigate school mapping issue in frontend code
Important Notes
Always work from root directory for backend commits
Update cache buster filenames when deploying frontend
Test with both Staff Admin and Super User accounts
Backend logs are crucial for debugging

Recent Updates (January 2025 - Session 2)
==========================================

10. Major UI Redesign Implementation
------------------------------------
Problem: UI was showing generic charts, no histograms, incorrect data display
Solution: Complete UI overhaul to match original design specifications

### UI Components Created:
1. **VespaHistogram.vue** - Individual VESPA element histogram component
   - Features: Scorecards with color-coded averages, percentage differences, trend arrows
   - Chart.js implementation with visible axes, national data line overlay
   - Dynamic Y-axis scaling based on data

2. **SummaryHeader.vue** - Consolidated header with key metrics
   - Cycle selector (currently not fully connected)
   - Smaller VESPA radar chart (0-10 scale)
   - ERI speedometer with explainer modal
   - Completion rate display

3. **ERISpeedometer.vue** - Visual speedometer chart for ERI
4. **Modal.vue** - Generic modal component for explanations

### UI Layout Changes:
- Removed generic bar charts and insights grid
- Implemented 2-row histogram layout (V,E,S top row; P,A,O bottom row)
- Added national data yellow color scheme throughout
- Improved responsive design

11. Backend Data Query Fixes
----------------------------
Problem: "No module named 'psycopg2'" error when trying to fetch actual data
Solution: Rewrote get_school_statistics_query() to use Supabase client methods instead of raw SQL

### Key Changes:
- Query vespa_scores table directly for actual student data
- Calculate distributions from real scores (0-10 scale)
- Fixed ERI calculation using outcome questions (outcome_q_confident, outcome_q_equipped, outcome_q_support)
- Properly fetch national statistics for comparison

12. Critical Performance Fix - 414 Request-URI Too Large
-------------------------------------------------------
Problem: Large schools (2000+ students) caused "414 Request-URI Too Large" errors
Solution: Implemented batching for Supabase queries

### Batching Implementation:
```python
BATCH_SIZE = 50  # Process 50 students at a time
for i in range(0, len(student_ids), BATCH_SIZE):
    batch_ids = student_ids[i:i + BATCH_SIZE]
    batch_result = supabase_client.table('vespa_scores')\
        .select('*')\
        .in_('student_id', batch_ids)\
        .eq('cycle', cycle)\
        .execute()
```

Applied to:
- vespa_scores queries
- question_responses queries (for ERI)
- academic_year queries

13. Deployment Issues Fixed
---------------------------
1. **MockResult to SimpleNamespace**: Fixed Gunicorn crash by replacing custom MockResult class with Python's built-in types.SimpleNamespace
2. **Indentation Error**: Fixed Python indentation issue around line 5222
3. **Student Count Fix**: Now counts unique students instead of vespa_score records
4. **Student Fetching Pagination**: Implemented pagination to fetch ALL students, not limited to 1000

Current UI State (As of January 2025)
-------------------------------------
✅ Histograms displaying with correct distributions
✅ Scorecards showing averages and comparisons
✅ ERI calculated from outcome questions
✅ Y-axis scaling dynamically adjusts (highest + 20 rule)
✅ 2-row layout implemented
✅ Modal system working
✅ National data displaying correctly (yellow lines/overlays)
✅ ERI speedometer shows national indicator line
✅ Individual student view with bar charts and comparison table
✅ Loading modal for all filter operations
✅ Student search with autocomplete
✅ Dynamic filters populated from Supabase

Outstanding Issues
------------------
1. **Performance Issues** (CRITICAL):
   - Slow loading for large schools (2000+ students)
   - Despite batching implementation, performance still needs optimization
   - Consider server-side aggregation or caching strategies

2. **Missing Features**:
   - Question Level Analysis (QLA) section not displaying data
   - Comment Insights/Word Cloud section not displaying data
   - Export functionality not implemented
   - Year group performance breakdown not implemented

3. **Data Display**:
   - Need to verify all calculations are accurate
   - Completion rate calculation could be refined

To-Do List
----------
COMPLETED:
✅ National data display (yellow lines, averages)
✅ Filter system overhaul (Year Group, Group, Faculty, Student Search)
✅ Dynamic histogram scaling
✅ Loading states for all operations
✅ Individual student view
✅ Student search functionality
✅ Response count accuracy

PENDING:
1. **Performance Optimization** (CRITICAL):
   - Optimize queries for large schools (2000+ students)
   - Consider server-side aggregation
   - Implement caching strategies
   - Reduce API response sizes

2. **Complete Missing Features**:
   - QLA (Question Level Analysis) - needs backend endpoint fixes
   - Comment Insights/Word Cloud - needs data integration
   - Export functionality (CSV/PDF)
   - Year group performance breakdown

3. **Data Validation**:
   - Verify all calculations match expected formulas
   - Ensure ERI calculation is accurate
   - Validate completion rate logic

4. **User Experience**:
   - Add error boundaries for better error handling
   - Improve loading states with progress indicators
   - Add tooltips/help text for complex metrics

Technical Debt
--------------
- Frontend expects different data structures than backend provides in some areas
- No proper error boundaries in Vue components
- Limited test coverage
- Hardcoded values in several places need to be dynamic

Quick Deployment Guide
----------------------
Backend (Heroku):
```bash
cd /c/Users/tonyd/OneDrive - 4Sight Education Ltd/Apps/DASHBOARD/DASHBOARD
git add app.py
git commit -m "Your commit message"
git push origin main
```

Frontend (GitHub/CDN):
1. Update cache buster in vite.config.js (current: vuedash2a)
2. Update CDN URLs in AppLoaderCopoy.js to match
3. Build: `npm run build` in DASHBOARD-Vue directory
4. Commit and push all changes including dist/ folder

Current Cache Buster: vuedash2a

Files Modified in This Session
------------------------------
Frontend:
- DASHBOARD-Vue/src/components/Overview/VespaHistogram.vue (new)
- DASHBOARD-Vue/src/components/Overview/SummaryHeader.vue (new)
- DASHBOARD-Vue/src/components/Overview/ERISpeedometer.vue (new)
- DASHBOARD-Vue/src/components/common/Modal.vue (new)
- DASHBOARD-Vue/src/components/Overview/OverviewSection.vue (major changes)
- DASHBOARD-Vue/src/components/Overview/VespaRadarChart.vue (scale fixes)
- DASHBOARD-Vue/vite.config.js (vuedash1o → vuedash1p)
- dashboard-frontend/src/AppLoaderCopoy.js (CDN update)

Backend:
- app.py (major query rewrites, batching, student fetching fixes)

Recent Updates (January 2025 - Session 3 - Critical Fixes)
============================================================

14. National Data Display Issues Fixed
--------------------------------------
Problem: National data showing as all zeros, no yellow distribution line on histograms
Root Causes:
1. National statistics query was filtering by `academic_year=eq.None` which returned no results
2. Variables `nat_stats_by_element` and `comparison_national` not initialized in all code paths
3. Missing extraction of mean values from national distributions query

Solution:
```python
# Only filter by academic_year if provided
if academic_year:
    query = query.eq('academic_year', academic_year)

# Initialize variables at start
nat_stats_by_element = {}
comparison_national = []

# Extract means from distribution query if main query failed
if not comparison_national and national_dist_result.data:
    for stat in national_dist_result.data:
        if stat['element'] and stat.get('mean') is not None:
            element_key = stat['element'].lower()
            if element_key in ['vision', 'effort', 'systems', 'practice', 'attitude']:
                nat_stats_by_element[element_key] = float(stat['mean'])
```

15. Student Count Display Fix
-----------------------------
Problem: Still showing 999 students instead of actual count
Solution: Changed to show students with VESPA scores rather than all students
```python
response_data = {
    'totalStudents': students_with_vespa_scores,  # Show students with VESPA scores
```

16. Enhanced Debugging
----------------------
Added comprehensive logging throughout the API:
- National statistics query results
- Response data structure
- Sample distributions
- Comparison arrays

Critical Learnings
------------------
1. **Schema Validation**: Always check the Supabase schema to understand nullable vs required fields
2. **Variable Initialization**: Ensure all variables are initialized before conditional branches
3. **Data Display Logic**: Frontend expects students WITH data, not total enrollment
4. **Academic Year Handling**: Many tables have optional academic_year - handle gracefully

Files Modified in This Session
------------------------------
Backend:
- app.py (national data query fixes, student count fix, enhanced logging, variable initialization)
- DASHBOARD-Vue/vite.config.js (vuedash1p → vuedash1q)
- dashboard-frontend/src/AppLoaderCopoy.js (CDN update)
- DASHBOARD-Vue/src/components/Overview/VespaHistogram.vue (added annotation plugin, debugging)
- DASHBOARD-Vue/src/components/Overview/OverviewSection.vue (added debugging)

Recent Updates (January 2025 - Session 4 - Critical Scale Fix)
==============================================================

17. VESPA Score Scale Mismatch Fixed
------------------------------------
Problem: National data not displaying because of scale mismatch
Root Cause: Frontend expected 11 values (0-10 scale) but VESPA uses 1-10 scale (10 values)
- National distribution validation was rejecting valid data with 10 values
- Distribution arrays were incorrectly sized for 11 values

Solution:
1. Backend: Changed distributions to 10-value arrays (1-10 scale)
2. Frontend: Updated validation to expect 10 values
3. Fixed histogram labels to show 1-10 instead of 0-10
4. Adjusted score calculations to account for 1-based indexing

Key Code Changes:
```javascript
// Frontend - VespaHistogram.vue
validator: (value) => value.length === 10 // 1-10 scores
const labels = Array.from({ length: 10 }, (_, i) => (i + 1).toString())

// Backend - app.py
vespa_distributions[elem] = [0] * 10  # 10 slots for scores 1-10
if 1 <= rounded_score <= 10:
    vespa_distributions[elem][rounded_score - 1] += 1
```

18. National Data Query Improvements
------------------------------------
Added comprehensive logging and fallback logic:
- Query national_statistics with optional academic_year filter
- Extract means from distribution query if main query fails
- Log all national data retrieval for debugging

Files Modified in This Session
------------------------------
Backend:
- app.py (scale fixes, enhanced national data querying, comprehensive logging)
Frontend:
- DASHBOARD-Vue/src/components/Overview/VespaHistogram.vue (10-value validation, 1-10 labels)
- DASHBOARD-Vue/src/components/Overview/OverviewSection.vue (10-value arrays)
- DASHBOARD-Vue/vite.config.js (vuedash1q → vuedash1r)
- dashboard-frontend/src/AppLoaderCopoy.js (CDN update)

Recent Updates (January 2025 - Session 5 - National Data Fixes & UI Improvements)
================================================================================

19. National Data Calculation Order Fixed
-----------------------------------------
Problem: National statistics table only contains overall mean, not individual VESPA elements
Solution: Reversed calculation order:
1. Primary: Calculate from current_school_averages table using weighted averages
2. Fallback: Use national_statistics when element-specific data becomes available

```python
# Calculate weighted average for each element
element_sums[elem] += mean_val * count_val
element_counts[elem] += count_val
national_avg = element_sums[elem] / element_counts[elem]
```

20. Backend Distribution Error Fixed
------------------------------------
Problem: "column vespa_scores.establishment_id does not exist"
Solution: Query students first, then get their vespa_scores:
```python
students_sample = supabase_client.table('students')\
    .select('id')\
    .eq('establishment_id', est['id'])
vespa_sample = supabase_client.table('vespa_scores')\
    .in_('student_id', student_ids)
```

21. UI Improvements
-------------------
**VespaHistogram.vue**:
- National distribution shown as percentages on secondary y-axis
- Vertical line shows national average position
- Fixed overall histogram to get nationalOverall from correct location

**ERISpeedometer.vue**:
- Added color zones (Red/Orange/Blue/Green) with transparency
- National average shown as yellow line on gauge
- Two datasets: background zones + value indicator

**VespaRadarChart.vue**:
- Fixed scaling to expect 0-100 values (converted from 0-10)
- Improved styling with better colors and labels
- Added tooltips showing 1-10 scale values

22. Cycle Filter Connected
--------------------------
- Added cycle to filters state in dashboard store
- Cycle changes trigger data reload via updateFilter
- API passes cycle parameter to backend

Files Modified in This Session
------------------------------
Backend:
- app.py (national data calculation order, distribution fix, empty nationalDistributions)
Frontend:
- DASHBOARD-Vue/src/components/Overview/OverviewSection.vue (overall national average fix)
- DASHBOARD-Vue/src/components/Overview/VespaHistogram.vue (percentage display, vertical average line)
- DASHBOARD-Vue/src/components/Overview/ERISpeedometer.vue (color zones, national line)
- DASHBOARD-Vue/src/components/Overview/VespaRadarChart.vue (scaling fix, styling)
- DASHBOARD-Vue/src/stores/dashboard.js (added cycle filter)
- DASHBOARD-Vue/vite.config.js (vuedash1s → vuedash1t)
- dashboard-frontend/src/AppLoaderCopoy.js (CDN update)

Recent Updates (January 2025 - Session 6 - ERI National Line Fix & Performance Issue)
=====================================================================================

23. ERI National Line Fix
-------------------------
Problem: ERI speedometer not showing national indicator line despite data being available
Root Cause: No watch on `national` prop - chart created before national data arrives
Solution: Added watch for national prop to recreate chart when national data changes
```javascript
// Watch for national prop changes to redraw the chart with the national line
watch(() => props.national, () => {
  if (chartInstance && props.national) {
    chartInstance.destroy()
    createGauge()
  }
})
```

24. Performance Issues Identified
---------------------------------
Problem: Dashboard loading slowly, especially for large schools (2000+ students)
Possible Causes:
- Backend processing large amounts of data in get_school_statistics_query()
- Multiple Supabase queries even with batching
- National distribution calculations for all elements
Next Steps: Need to optimize query performance, consider server-side aggregation

25. Filter Logic Overhaul Planned
---------------------------------
Current filters are hardcoded and not connected to real data.
New filter requirements:
- Year Group (dropdown) - from students.year_group
- Group - from students.group  
- Faculty - from students.faculty
- Search for individual student - by name/email
All filters should populate dynamically from Supabase data

26. Filter System Overhaul
--------------------------
Implemented new filter system replacing hardcoded filters with dynamic data from Supabase:

Backend Changes:
- Added /api/groups endpoint - returns distinct groups for an establishment
- Added /api/faculties endpoint - returns distinct faculties for an establishment  
- Added /api/students/search endpoint - searches students by name/email with autocomplete

Frontend Changes:
- Completely rewrote FilterBar.vue component:
  - Year Group dropdown (existing endpoint, now establishment-specific)
  - Group dropdown (new, populated from students.group)
  - Faculty dropdown (new, populated from students.faculty)
  - Student search with autocomplete (new, searches by name/email)
- Updated dashboard store:
  - Removed old filters (academicYear, keyStage, vespaArea, questionSubTheme)
  - Added new filters (yearGroup, group, faculty, studentId)
  - Removed loadFilterOptions method (filters now loaded in FilterBar)
- Added debounce utility for search optimization
- Updated API service with new endpoints

Filter Data Flow:
- Filters populate when establishment is selected
- All dropdowns show establishment-specific data
- Student search provides autocomplete with debounced API calls
- Clear Filters button resets all selections but preserves cycle

Files Modified in This Session
------------------------------
Backend:
- app.py (added /api/groups, /api/faculties, /api/students/search endpoints)

Frontend:
- DASHBOARD-Vue/src/components/Overview/ERISpeedometer.vue (added national prop watch)
- DASHBOARD-Vue/src/components/FilterBar.vue (complete rewrite with new filters)
- DASHBOARD-Vue/src/stores/dashboard.js (updated filter state, removed old methods)
- DASHBOARD-Vue/src/services/api.js (added new filter endpoints)
- DASHBOARD-Vue/src/utils/debounce.js (new utility for search)
- DASHBOARD-Vue/vite.config.js (vuedash1v → vuedash1w)
- dashboard-frontend/src/AppLoaderCopoy.js (CDN update)

Status: Filter system overhaul is COMPLETE and ready for deployment

Next Steps for Filters:
1. Deploy backend changes (new endpoints)
2. Build and deploy frontend (npm run build)
3. Test all filters with real data
4. Apply same filter logic to QLA and Comment Insights endpoints

Recent Updates (January 2025 - Session 7 - Dynamic Histogram Scaling & Loading Modal)
==================================================================================

27. Dynamic Histogram Y-Axis Scaling
------------------------------------
Problem: Histogram axes remain fixed when filtering reduces data significantly
Solution: Implemented dynamic Y-axis scaling based on actual data ranges

Changes to OverviewSection.vue:
- Updated maxYValue computation with tiered scaling:
  - ≤10 students: max + 2
  - ≤50 students: round to nearest 5 + 5
  - ≤100 students: round to nearest 10 + 10
  - >100 students: round to nearest 50 + 20

Changes to VespaHistogram.vue:
- Added calculateStepSize helper function for dynamic tick intervals
- Step sizes adjust based on max value (1, 2, 5, 10, 20, etc.)

28. Loading Modal for All Filter Operations
-------------------------------------------
Problem: Filter calculations take time, especially for large datasets
Solution: Added loading modal that appears during all filter changes

New Components:
- LoadingModal.vue - Reusable loading indicator with spinner

Changes to App.vue:
- Added filterLoading state
- Made handleFilterChange async
- Shows LoadingModal during filter operations

Changes to dashboard store:
- Made updateFilter method async
- Returns promise from loadDashboardData

The loading modal appears for:
- Year Group filter changes
- Group filter changes
- Faculty filter changes
- Student search selection
- Cycle changes
- Clear filters action

Files Modified in This Session
------------------------------
Frontend:
- DASHBOARD-Vue/src/components/Overview/OverviewSection.vue (dynamic Y-axis scaling)
- DASHBOARD-Vue/src/components/Overview/VespaHistogram.vue (dynamic step sizes)
- DASHBOARD-Vue/src/components/common/LoadingModal.vue (new loading indicator)
- DASHBOARD-Vue/src/App.vue (loading state management)
- DASHBOARD-Vue/src/stores/dashboard.js (async updateFilter)
- DASHBOARD-Vue/vite.config.js (vuedash1w → vuedash1x)
- dashboard-frontend/src/AppLoaderCopoy.js (CDN update)

Recent Updates (January 2025 - Session 8 - Critical Fixes)
========================================================

29. Student Search Fix
----------------------
Problem: Student search failing with `'SyncSelectRequestBuilder' object has no attribute 'or_'`
Solution: Rewrote search to use separate queries for name and email, then merge results

Backend Changes:
- Replaced single `.or_()` query with two separate queries
- Search by name using `.ilike('name', f'%{search_term}%')`
- Search by email using `.ilike('email', f'%{search_term}%')`
- Combine results and remove duplicates

30. Student Responses Count Fix
--------------------------------
Problem: Responses count not updating with filters, always showing total students
Solution: Added separate totalResponses field to API response

Backend Changes:
- Added `totalResponses` to statistics endpoint response
- `totalStudents` = total enrolled students
- `totalResponses` = students who completed VESPA in current cycle

Frontend Changes:
- Updated SummaryHeader to use `totalResponses` when available

31. Histogram Scaling Simplification
------------------------------------
Problem: Complex scaling rules, user wants simple "highest + 20" rule
Solution: Simplified maxYValue calculation

Changes to OverviewSection.vue:
- Removed tiered scaling logic
- Now simply: `return maxCount + 20`

Files Modified in This Session
------------------------------
Backend:
- app.py (student search fix, added totalResponses to statistics)

Frontend:
- DASHBOARD-Vue/src/components/Overview/OverviewSection.vue (simplified Y-axis scaling)
- DASHBOARD-Vue/src/components/Overview/SummaryHeader.vue (use totalResponses)
- DASHBOARD-Vue/vite.config.js (vuedash1y → vuedash1z)
- dashboard-frontend/src/AppLoaderCopoy.js (CDN update)

Recent Updates (January 2025 - Session 9 - Individual Student View)
==================================================================

32. Individual Student VESPA Score Display
-------------------------------------------
Problem: When selecting an individual student, histograms show blank (no distribution for single student)
Solution: Created separate visualization for individual students

New Component:
- StudentVespaScores.vue - Shows individual student's VESPA scores as bar chart with table

Backend Changes:
- Modified statistics endpoint to detect single student selection
- Returns actual scores instead of distributions for individual students
- No histogram data when studentId filter is active and only one student found

Frontend Changes:
- OverviewSection detects when studentId is selected
- Shows StudentVespaScores component instead of histograms
- Displays student name, bar chart of scores, and comparison table
- Added studentName to filters for display purposes

Filter Bar Updates:
- Now emits both studentId and studentName when student selected
- Student name stored in dashboard store filters

Files Modified in This Session
------------------------------
Backend:
- app.py (individual student handling in statistics endpoint)

Frontend:
- DASHBOARD-Vue/src/components/Overview/StudentVespaScores.vue (new component)
- DASHBOARD-Vue/src/components/Overview/OverviewSection.vue (conditional rendering)
- DASHBOARD-Vue/src/components/FilterBar.vue (emit student name)
- DASHBOARD-Vue/src/stores/dashboard.js (add studentName to filters)
- DASHBOARD-Vue/vite.config.js (vuedash1z → vuedash2a)
- dashboard-frontend/src/AppLoaderCopoy.js (CDN update)
