# 🚀 Railway Deployment - Step by Step

## The Issue
Railway couldn't find your backend because it's in a monorepo structure. The `nixpacks.toml` file created fixes this.

---

## ✅ Solution: Deploy with nixpacks.toml

### Step 1: Push to GitHub
```bash
git add nixpacks.toml railway.json
git commit -m "Add Railway config"
git push
```

### Step 2: Create Railway Project

1. Go to **railway.app**
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **PrathmeshAdsod/Aletheia**
5. Railway will automatically detect `nixpacks.toml` and build correctly

### Step 3: Add Environment Variables

Click **Variables** tab and add these **8 variables**:

```bash
SUPABASE_URL=https://yxitzzhkvbvmtkncyafc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4aXR6emhrdmJ2bXRrbmN5YWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ1OTY0NywiZXhwIjoyMDg2MDM1NjQ3fQ.CiqCf5kLam8twLrg1kTHGduKL6NrJXBjJ62BNU4CSL4

NEO4J_URI=neo4j+s://a88030b9.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=kjdpIawII48K1FX6bf1b2OOgMj-KzhXEi1nfoAB4UWw

GEMINI_API_KEY=AIzaSyApIl5S6wNFXSiUTA4Lxc5dzpuV8udwFbE

NODE_ENV=production
FRONTEND_URL=http://localhost:3000
```

**Note**: We'll update `FRONTEND_URL` after Vercel deployment

### Step 4: Deploy

1. Click **"Deploy"** (or it auto-deploys)
2. Watch the logs - should see:
   ```
   ✓ cd backend && npm install
   ✓ cd backend && npm run build
   ✓ cd backend && npm start
   ```
3. Wait 2-3 minutes

### Step 5: Generate Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://aletheia-production.up.railway.app`)
4. **Save this URL** - you need it for Vercel

### Step 6: Test Backend

```bash
curl https://your-railway-url.up.railway.app/health
```

Should return:
```json
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```

---

## 🎯 What the Config Files Do

### `nixpacks.toml`
Tells Railway:
- Use Node.js 20
- Run commands in `backend/` directory
- Install → Build → Start

### `railway.json`
Backup config with restart policy

---

## ▲ Next: Deploy Frontend to Vercel

### Step 1: Go to Vercel

1. **vercel.com** → **New Project**
2. Import **PrathmeshAdsod/Aletheia**
3. **Root Directory**: `frontend`
4. Framework: Next.js (auto-detected)

### Step 2: Add Environment Variable

```bash
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
```

Use the Railway URL from above (no trailing slash)

### Step 3: Deploy

Click **Deploy** → Wait 2-3 minutes

### Step 4: Get Vercel URL

Copy your Vercel URL (e.g., `https://aletheia.vercel.app`)

### Step 5: Update Railway CORS

Go back to **Railway** → **Variables** → Update:

```bash
FRONTEND_URL=https://aletheia.vercel.app
```

Railway will auto-redeploy (30 seconds)

---

## ✅ Verification

1. Visit your Vercel URL
2. Open browser console (F12)
3. Should see no CORS errors
4. Test upload → view graph → query Oracle

---

## 🔧 Troubleshooting

**Build still fails?**
- Check `nixpacks.toml` is in root directory
- Verify all 8 env vars are set in Railway
- Check Railway logs for specific error

**CORS error in browser?**
- Ensure `FRONTEND_URL` in Railway matches Vercel URL exactly
- No trailing slash
- Wait 30 seconds for Railway to redeploy

**Can't reach backend?**
- Check Railway logs: Dashboard → Deployments → View Logs
- Verify domain is generated: Settings → Networking
- Test health endpoint with curl

---

## 📝 Summary

1. ✅ Push `nixpacks.toml` to GitHub
2. ✅ Railway: Deploy from GitHub + add 8 env vars
3. ✅ Railway: Generate domain → copy URL
4. ✅ Vercel: Deploy frontend + add `NEXT_PUBLIC_API_URL`
5. ✅ Railway: Update `FRONTEND_URL` with Vercel URL
6. ✅ Test full stack

**Total time**: 15 minutes
