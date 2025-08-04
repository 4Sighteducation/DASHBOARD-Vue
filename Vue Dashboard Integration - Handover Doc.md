Vue Dashboard Integration - Handover Document
Project Overview
Application: Vue Dashboard embedded in Knack environmentArchitecture:
Frontend: Vue.js app bundled with Vite, hosted on JSDelivr CDN
Backend: Flask API hosted on Heroku
Database: Supabase (PostgreSQL) - populated daily from Knack via sync process
Environment: Dashboard embedded in Knack scene_1225, accessed by Staff Admin and Super User roles
User's Working Preferences
No quick fixes: User explicitly prefers thorough, permanent solutions over temporary workarounds
Root cause analysis: Deep investigation into problems before implementing solutions
Git workflow: Always offer to add, commit and push to GitHub repo
Cache busting: Update filenames (vuedash1g → vuedash1h → vuedash1i) when deploying
Initial Problem
The Vue dashboard failed to load in Knack environment due to CDN/hosting issues.
Key Issues Resolved
1. CDN/MIME Type Issues
Problem: Using https://raw.githubusercontent.com served files with incorrect MIME typesSolution: Changed to https://cdn.jsdelivr.net/gh/ in AppLoaderCopoy.js
javascript
scriptUrl: 'https://cdn.jsdelivr.net/gh/4Sighteducation/DASHBOARD-Vue@main/dist/vuedash1i.js'
cssUrl: 'https://cdn.jsdelivr.net/gh/4Sighteducation/DASHBOARD-Vue@main/dist/vuedash1i.css'
2. CORS Header Issues
Problem: Backend rejected X-Knack-Application-Id and X-Knack-REST-API-KEY headersSolution: Updated app.py CORS configuration:
python
allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'X-Knack-Application-Id', 'X-Knack-REST-API-Key', 'x-knack-application-id', 'x-knack-rest-api-key']
3. Missing API Endpoints
Problem: Frontend called endpoints that didn't exist (404 errors)Solution: Added to app.py:
/api/academic-years - Returns distinct years from national_statistics
/api/key-stages - Returns ['KS3', 'KS4', 'KS5']
/api/year-groups - Returns ['7', '8', '9', '10', '11', '12', '13']
/api/establishment/<id> - Returns establishment details
4. Database Schema Mismatches
Problem: /api/qla endpoint used questions.active but column is questions.is_activeSolution: Fixed query in app.py:
python
questions_result = supabase_client.table('questions').select('*').eq('is_active', True).execute()
5. Data Display Issues
Problem: Empty dashboard and wrong school mapping (Coffs Harbour → Ashlyns School)Diagnosis:
Frontend school selection issue (still unresolved)
Backend statistics transformation already correct
Added debug logging to help diagnose
6. Git Deployment Issue
Problem: Backend changes weren't deploying to HerokuRoot Cause: Project uses git submodules structure:
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

Current UI State
----------------
✅ Histograms displaying with correct distributions
✅ Scorecards showing averages and comparisons
✅ ERI calculated from outcome questions
✅ Y-axis scaling rounds to nearest 100
✅ 2-row layout implemented
✅ Modal system working

Outstanding Issues
------------------
1. **National Data Not Displaying**:
   - National averages show as 0% difference
   - National distribution line not appearing on histograms
   - Radar chart not showing national comparison
   - Root cause: nationalDistributions data structure mismatch

2. **Filter Connectivity**:
   - Cycle selector exists but doesn't update data
   - Year group, key stage, academic year filters not connected to Supabase data
   - Filters showing hardcoded values instead of dynamic data

3. **Large School Data Issues** (CRITICAL):
   - Despite batching implementation, user reports it's "not working"
   - Schools like Rochdale Sixth Form (2285 students) may still have issues
   - Need to verify if pagination is working correctly

4. **Data Accuracy**:
   - Need to verify VESPA score scales (0-10 vs 0-100)
   - Completion rate calculation needs refinement
   - Year group performance not implemented

To-Do List
----------
1. **Fix National Data Display**:
   - Debug nationalDistributions structure in response
   - Ensure Chart.js annotation plugin is loaded for national average line
   - Fix radar chart national data mapping

2. **Connect Filters**:
   - Make cycle selector functional
   - Connect year group/key stage/academic year to actual data
   - Implement filter state management

3. **Fix Batching/Large School Issues**:
   - Add more logging to identify where batching fails
   - Test with specific large schools
   - Consider alternative approaches (server-side aggregation?)

4. **Complete Missing Features**:
   - Year group performance breakdown
   - QLA (Question Level Analysis) integration
   - Comment insights/word cloud
   - Export functionality

5. **Performance Optimization**:
   - Consider caching strategies for large datasets
   - Optimize API response sizes
   - Implement loading states for better UX

Technical Debt
--------------
- Frontend expects different data structures than backend provides in some areas
- No proper error boundaries in Vue components
- Limited test coverage
- Hardcoded values in several places need to be dynamic

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
