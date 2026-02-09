# 🚀 Quick Start - Testing the Fixes

## Prerequisites
- Node.js 20+ installed
- Backend and frontend dependencies installed
- Environment variables configured in `backend/.env`

## Step-by-Step Testing

### 1️⃣ Test Gemini API (30 seconds)

```bash
cd backend
npx ts-node scripts/test-gemini.ts
```

**Expected Output**:
```
🧪 Testing Gemini API Connection...

✅ API Key found
   Key prefix: AIzaSyBsAB...

📡 Testing gemini-3-flash-preview model...
✅ Model responded successfully!
   Response: "Hello from Aletheia! Greetings today."

✅ Gemini API is working correctly!
```

**If it fails**: Check your `GEMINI_API_KEY` in `backend/.env`

---

### 2️⃣ Start Backend (1 minute)

```bash
cd backend
npm run dev
```

**Expected Output**:
```
🔗 Testing Neo4j connection...
✅ Neo4j connected

🚀 Aletheia Backend Running
   Port: 8000
   Environment: development
   Frontend URL: http://localhost:3000
```

**Keep this terminal open!**

---

### 3️⃣ Start Frontend (1 minute)

Open a **new terminal**:

```bash
cd frontend
npm run dev
```

**Expected Output**:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

**Keep this terminal open too!**

---

### 4️⃣ Test Dashboard (2 minutes)

1. Open browser: http://localhost:3000
2. Login with your credentials
3. Navigate to Dashboard

**What to check**:
- ✅ Page loads without errors
- ✅ KPI cards show metrics
- ✅ Executive Briefing card appears
- ✅ Loading state shows: "Generating AI briefing... This may take a moment."
- ✅ After 2-5 seconds, AI summary appears
- ✅ Sections populate with data

**If briefing shows "No briefing available"**: You need to upload documents first (next step)

---

### 5️⃣ Test Upload (3 minutes)

1. Navigate to **Auditor** page
2. Create a test file:

**test-decisions.txt**:
```
Meeting Notes - Product Strategy
Date: January 15, 2025

Decision 1: We decided to launch the new feature in Q2 instead of Q1.
Reasoning: Need more time for testing and user feedback.
Actor: Sarah (Product Lead)

Decision 2: Approved budget increase for marketing campaign.
Reasoning: Market research shows strong demand.
Actor: Mike (CEO)

Decision 3: Will not pursue the mobile app this year.
Reasoning: Focus on web platform first, mobile can wait.
Actor: Sarah (Product Lead)
```

3. Upload this file
4. Watch the progress indicator
5. Wait for "Upload complete"

**Check backend logs**:
```
📄 File: test-decisions.txt (hash: abc123...)
🔍 Gemini 2.5 Flash → extracting clusters
📦 3 clusters found
🧠 Gemini 2.5 Flash → structuring decisions
✅ 3 decisions extracted
💾 Stored 3 decisions in Supabase
🔗 Stored 3 decisions in Neo4j graph
🔴 Detected 0 conflicts
```

---

### 6️⃣ Verify Data Storage (1 minute)

**Check Nexus Graph**:
1. Navigate to **Causal Nexus**
2. Should see 3 new nodes
3. Nodes should be color-coded (green/red/neutral)

**Check Decisions List**:
1. Navigate to **Decisions** (if available)
2. Should see 3 decisions listed
3. Each should have actor, reasoning, timestamp

---

### 7️⃣ Test Executive Briefing Again (1 minute)

1. Go back to **Dashboard**
2. Refresh the page
3. Executive Briefing should load **instantly** (cached)
4. Should show:
   - ✅ AI-generated summary
   - ✅ Multiple sections (What Changed, Strategic Health, etc.)
   - ✅ Focus areas (if any)
   - ✅ Generated timestamp

**Click refresh button** on briefing card:
- Should show loading state
- Should reload with updated data

---

### 8️⃣ Test Error Handling (2 minutes)

**Test 1: Empty File**
1. Create empty file: `empty.txt`
2. Upload it
3. Should see warning: "No decisions found"

**Test 2: Invalid Content**
1. Create file with random text: `random.txt`
```
asdfghjkl qwertyuiop
1234567890
```
2. Upload it
3. Should complete but extract 0 decisions

**Test 3: Network Error Simulation**
1. Stop backend (Ctrl+C)
2. Try to refresh Dashboard
3. Should see error message with retry button
4. Restart backend
5. Click retry - should work

---

## ✅ Success Criteria

### All Green ✅
- [x] Gemini test passes
- [x] Backend starts without errors
- [x] Frontend loads
- [x] Dashboard displays
- [x] Executive Briefing generates
- [x] Upload extracts decisions
- [x] Data appears in Nexus
- [x] Caching works (instant reload)
- [x] Error messages are clear
- [x] Logs are informative

### If Any Red ❌
1. Check the specific section that failed
2. Review logs (backend + browser console)
3. Verify environment variables
4. Run Gemini test again
5. Check `BUGFIX_SUMMARY.md` for troubleshooting

---

## 🔍 What to Look For

### Backend Logs (Good Signs)
```
✅ Neo4j connected
🔍 Gemini 2.5 Flash → extracting clusters
📦 X clusters found
✅ X decisions extracted
💾 Stored X decisions in Supabase
🔗 Stored X decisions in Neo4j
```

### Backend Logs (Warning Signs)
```
❌ Gemini API call failed
⚠️ Empty response from Gemini
❌ Failed to store decisions
⚠️ No decisions found in file
```

### Frontend Console (Good Signs)
```
🔍 [Frontend] Fetching briefing...
🔍 [Frontend] Briefing response: { success: true, ... }
✅ [Service] Serving cached Executive Briefing
```

### Frontend Console (Warning Signs)
```
❌ [Frontend] Briefing fetch failed: 500
⚠️ [Frontend] No executive summary in briefing data
Failed to fetch briefing
```

---

## 🎯 Quick Verification Commands

### Check Backend Health
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### Check Gemini API
```bash
cd backend
npx ts-node scripts/test-gemini.ts
```

### Check Database Connection
```bash
# Backend logs should show:
# ✅ Neo4j connected
# If not, check NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD in .env
```

---

## 📊 Performance Benchmarks

| Action | Expected Time | Acceptable Range |
|--------|--------------|------------------|
| **Gemini Test** | 1-2s | < 5s |
| **Backend Start** | 2-3s | < 10s |
| **Frontend Start** | 2-3s | < 10s |
| **Dashboard Load** | < 1s | < 3s |
| **Briefing (Fresh)** | 2-5s | < 10s |
| **Briefing (Cached)** | < 100ms | < 500ms |
| **Upload Process** | 5-15s | < 30s |

---

## 🆘 Common Issues & Quick Fixes

### Issue: "Cannot find module '@google/genai'"
```bash
cd backend
npm install
```

### Issue: "Port 8000 already in use"
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9
# Or change PORT in backend/.env
```

### Issue: "GEMINI_API_KEY not found"
```bash
# Check .env file exists
ls backend/.env

# Check key is set
grep GEMINI_API_KEY backend/.env
```

### Issue: "Neo4j connection failed"
```bash
# Check credentials in backend/.env
# Verify Neo4j AuraDB is running
# Test connection at: https://console.neo4j.io/
```

---

## 🎉 You're Done!

If all tests pass, you're ready to use Aletheia with:
- ✅ Working AI integration
- ✅ Reliable data storage
- ✅ Proper error handling
- ✅ Efficient caching
- ✅ Model compatibility

**Next Steps**:
1. Upload real documents
2. Monitor performance
3. Review generated briefings
4. Switch to gemini-3-flash-preview when ready (see MODEL_CONFIG.md)

---

## 📞 Need Help?

1. **Check logs**: Backend terminal + Browser console
2. **Run diagnostics**: `npx ts-node scripts/test-gemini.ts`
3. **Review docs**: 
   - `BUGFIX_SUMMARY.md` - Detailed fixes
   - `MODEL_CONFIG.md` - Model configuration
   - `FIX_COMPLETE.md` - Complete summary
4. **Verify environment**: All variables in `backend/.env` are set

**Happy testing! 🚀**
