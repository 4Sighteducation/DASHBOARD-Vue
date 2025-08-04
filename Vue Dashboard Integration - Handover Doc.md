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
