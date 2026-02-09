# ▲ VERCEL 404 FIX - SIMPLE SOLUTION

## The Real Fix

Vercel needs the **Root Directory** set to `frontend` during import.

---

## Steps (Delete old project first)

### 1. Delete Failed Deployment
1. Go to Vercel dashboard
2. Click on your project
3. Settings → Delete Project

### 2. Re-import with Correct Settings

1. **New Project** → Import from GitHub
2. Select **PrathmeshAdsod/Aletheia**
3. **IMPORTANT**: Click **"Edit"** next to Root Directory
4. Type: `frontend`
5. Framework: Next.js (auto-detected)
6. Build Command: `npm run build`
7. Output Directory: `.next`

### 3. Add Environment Variable

```
NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
```

### 4. Deploy

Click Deploy → Should work now ✅

---

## Alternative: Push vercel.json

If you want to keep root directory as `.`:

```bash
git add vercel.json
git commit -m "Fix Vercel config"
git push
```

Then redeploy on Vercel.

---

## Verify

Visit your Vercel URL → Should see Aletheia Command Center
