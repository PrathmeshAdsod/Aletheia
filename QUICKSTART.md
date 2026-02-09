# 🚀 Quick Start - Production Deployment

## For Judges/Reviewers

**Live Demo**: [https://aletheia.vercel.app](YOUR_DEPLOYED_URL_HERE)

The app is fully deployed and ready to test. No setup required.

---

## For Developers

### Deploy Your Own Instance (15 minutes)

#### 1. Backend → Railway

```bash
# 1. Fork/Clone repo
git clone https://github.com/PrathmeshAdsod/Aletheia.git

# 2. Go to railway.app
# 3. New Project → Deploy from GitHub
# 4. Select Aletheia repo
# 5. Settings:
#    - Root Directory: backend
#    - Build Command: npm install && npm run build
#    - Start Command: npm start

# 6. Add Environment Variables (see DEPLOYMENT.md)
# 7. Deploy
# 8. Generate Domain → Copy URL
```

#### 2. Frontend → Vercel

```bash
# 1. Go to vercel.com
# 2. New Project → Import from GitHub
# 3. Select Aletheia repo
# 4. Settings:
#    - Root Directory: frontend
#    - Framework: Next.js (auto-detected)

# 5. Add Environment Variable:
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# 6. Deploy
# 7. Copy Vercel URL
```

#### 3. Update CORS

```bash
# In Railway, update:
FRONTEND_URL=https://your-frontend.vercel.app

# Railway auto-redeploys
```

#### 4. Test

Visit your Vercel URL and test the flow.

---

## Environment Variables

### Backend (Railway)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=xxx
GEMINI_API_KEY=AIzaSy...
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## Troubleshooting

**CORS Error**: Update `FRONTEND_URL` in Railway to match Vercel URL exactly

**API Not Found**: Check `NEXT_PUBLIC_API_URL` in Vercel settings

**Build Failed**: Check logs in Railway/Vercel dashboard

---

**Full Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
