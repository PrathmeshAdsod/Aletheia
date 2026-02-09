# ▲ Vercel Deployment - Step by Step

## The Issue
Vercel 404 error means it couldn't find your frontend in the monorepo. The `vercel.json` file fixes this.

---

## ✅ Solution: Deploy with vercel.json

### Step 1: Push Config to GitHub
```bash
git add vercel.json
git commit -m "Add Vercel config"
git push
```

### Step 2: Import Project to Vercel

1. Go to **vercel.com**
2. Click **"Add New..."** → **"Project"**
3. Click **"Import"** next to **PrathmeshAdsod/Aletheia**
4. Vercel will detect the `vercel.json` config

### Step 3: Configure Project Settings

**IMPORTANT**: In the import screen, configure:

1. **Root Directory**: Leave as `.` (root) - vercel.json handles the path
2. **Framework Preset**: Next.js (should auto-detect)
3. **Build Command**: `cd frontend && npm run build` (or leave default)
4. **Output Directory**: `frontend/.next`

### Step 4: Add Environment Variable

Before clicking Deploy, add:

**Environment Variables** section:
```
NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
```

Replace with your actual Railway URL (no trailing slash)

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Vercel will:
   ```
   ✓ cd frontend && npm install
   ✓ cd frontend && npm run build
   ✓ Deploy to CDN
   ```

### Step 6: Get Your URL

After deployment succeeds:
1. Copy your Vercel URL (e.g., `https://aletheia-xyz.vercel.app`)
2. Visit it to verify frontend loads

### Step 7: Update Railway CORS

Go back to **Railway** → **Variables** → Update:
```
FRONTEND_URL=https://aletheia-xyz.vercel.app
```

Railway will auto-redeploy in 30 seconds.

---

## 🔧 Alternative: Manual Root Directory

If `vercel.json` doesn't work, try this:

### During Import:
1. **Root Directory**: Click **"Edit"** → Type `frontend`
2. **Framework**: Next.js (auto-detected)
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

Then add environment variable and deploy.

---

## ✅ Verification

1. Visit your Vercel URL
2. Should see Aletheia Command Center
3. Open browser console (F12)
4. Check for errors
5. Test API calls (upload, view graph)

---

## 🔧 Troubleshooting

**Still getting 404?**
1. Check Vercel build logs: Dashboard → Deployments → View Function Logs
2. Verify `frontend/` directory exists in your repo
3. Try setting Root Directory to `frontend` manually

**Build fails?**
1. Check `frontend/package.json` exists
2. Verify all dependencies are listed
3. Check Vercel logs for specific error

**Can't reach backend?**
1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check Railway backend is running
3. Test Railway health endpoint: `curl https://your-backend.railway.app/health`

**CORS error?**
1. Update `FRONTEND_URL` in Railway to match Vercel URL exactly
2. Wait 30 seconds for Railway to redeploy
3. Hard refresh browser (Ctrl+Shift+R)

---

## 📝 Summary

1. ✅ Push `vercel.json` to GitHub
2. ✅ Vercel: Import project (root directory = `.`)
3. ✅ Vercel: Add `NEXT_PUBLIC_API_URL` env var
4. ✅ Vercel: Deploy
5. ✅ Railway: Update `FRONTEND_URL` with Vercel URL
6. ✅ Test full stack

**Total time**: 10 minutes
