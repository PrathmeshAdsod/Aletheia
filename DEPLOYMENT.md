# 🚀 Production Deployment Guide

## Overview

- **Frontend**: Vercel (Next.js 14)
- **Backend**: Railway (Node.js/Express)
- **Databases**: Supabase (PostgreSQL) + Neo4j AuraDB (managed services)

---

## 📋 Prerequisites

1. GitHub account with Aletheia repository
2. Vercel account (free tier)
3. Railway account (free tier)
4. Supabase project (already created)
5. Neo4j AuraDB instance (already created)
6. Google Gemini API key (already created)

---

## 🚂 Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **PrathmeshAdsod/Aletheia**
5. Railway will detect the monorepo structure

### Step 2: Configure Root Directory

1. In Railway project settings, click **"Settings"**
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`

### Step 3: Add Environment Variables

In Railway project → **Variables** tab, add:

```bash
# Supabase
SUPABASE_URL=https://yxitzzhkvbvmtkncyafc.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# Neo4j AuraDB
NEO4J_URI=neo4j+s://a88030b9.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password_here

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Server Config
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app

# Railway auto-assigns PORT - DO NOT SET IT
```

**⚠️ IMPORTANT**: 
- Railway automatically sets `PORT` environment variable
- Do NOT manually set PORT
- Backend code reads `process.env.PORT` automatically

### Step 4: Deploy

1. Click **"Deploy"**
2. Railway will:
   - Install dependencies
   - Build TypeScript (`npm run build`)
   - Start server (`npm start`)
3. Wait for deployment to complete (~2-3 minutes)

### Step 5: Get Backend URL

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://aletheia-backend-production.up.railway.app`)
4. Save this URL - you'll need it for frontend configuration

### Step 6: Verify Deployment

Test the health endpoint:
```bash
curl https://your-backend-url.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## ▲ Frontend Deployment (Vercel)

### Step 1: Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import **PrathmeshAdsod/Aletheia** from GitHub
4. Vercel will detect Next.js automatically

### Step 2: Configure Root Directory

1. In project settings, set **Root Directory**: `frontend`
2. Framework Preset: **Next.js** (auto-detected)
3. Build Command: `npm run build` (auto-detected)
4. Output Directory: `.next` (auto-detected)

### Step 3: Add Environment Variables

In Vercel project → **Settings** → **Environment Variables**, add:

```bash
# Backend API URL (from Railway Step 5)
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

**⚠️ IMPORTANT**: 
- Must start with `NEXT_PUBLIC_` to be accessible in browser
- Use the Railway backend URL from Step 5 above
- No trailing slash

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Build Next.js app
   - Deploy to CDN
3. Wait for deployment (~2-3 minutes)

### Step 5: Get Frontend URL

1. Vercel will provide a URL (e.g., `https://aletheia.vercel.app`)
2. Copy this URL

### Step 6: Update Backend CORS

1. Go back to **Railway** project
2. Update `FRONTEND_URL` environment variable:
   ```bash
   FRONTEND_URL=https://aletheia.vercel.app
   ```
3. Railway will automatically redeploy backend

### Step 7: Verify Full Stack

1. Visit your Vercel URL
2. Test the flow:
   - Command Center loads
   - Upload a document
   - View decisions in Causal Nexus
   - Query Oracle

---

## 🔐 Environment Variables Summary

### Backend (Railway)

| Variable | Example | Required |
|----------|---------|----------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | ✅ |
| `SUPABASE_SERVICE_KEY` | `eyJhbGc...` | ✅ |
| `NEO4J_URI` | `neo4j+s://xxx.databases.neo4j.io` | ✅ |
| `NEO4J_USERNAME` | `neo4j` | ✅ |
| `NEO4J_PASSWORD` | `your_password` | ✅ |
| `GEMINI_API_KEY` | `AIzaSy...` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `FRONTEND_URL` | `https://aletheia.vercel.app` | ✅ |
| `PORT` | Auto-assigned by Railway | ❌ DO NOT SET |

### Frontend (Vercel)

| Variable | Example | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | `https://backend.railway.app` | ✅ |

---

## ✅ Production Checklist

### Backend (Railway)
- [x] Root directory set to `backend`
- [x] All 7 required env vars configured
- [x] PORT not manually set (Railway auto-assigns)
- [x] Health endpoint returns 200
- [x] Neo4j connection successful
- [x] CORS allows Vercel domain

### Frontend (Vercel)
- [x] Root directory set to `frontend`
- [x] `NEXT_PUBLIC_API_URL` points to Railway backend
- [x] Build completes successfully
- [x] Can fetch data from backend
- [x] No CORS errors in browser console

---

## 🔧 Troubleshooting

### Backend Issues

**Problem**: "Missing required environment variables"
- **Solution**: Check all 7 required vars are set in Railway

**Problem**: "Neo4j connection failed"
- **Solution**: Verify `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`

**Problem**: "CORS error"
- **Solution**: Ensure `FRONTEND_URL` matches your Vercel domain exactly

**Problem**: "Port already in use"
- **Solution**: Remove manual `PORT` env var - Railway sets it automatically

### Frontend Issues

**Problem**: "Failed to fetch from backend"
- **Solution**: Check `NEXT_PUBLIC_API_URL` is correct Railway URL

**Problem**: "API_URL is undefined"
- **Solution**: Ensure env var starts with `NEXT_PUBLIC_`

**Problem**: "CORS error in browser"
- **Solution**: Update `FRONTEND_URL` in Railway backend

---

## 🔄 Redeployment

### Backend (Railway)
- Push to GitHub → Railway auto-deploys
- Or click **"Deploy"** in Railway dashboard

### Frontend (Vercel)
- Push to GitHub → Vercel auto-deploys
- Or click **"Redeploy"** in Vercel dashboard

---

## 📊 Monitoring

### Railway Backend
- View logs: Railway dashboard → **Deployments** → **View Logs**
- Check metrics: CPU, Memory, Network usage
- Health check: `https://your-backend.railway.app/health`

### Vercel Frontend
- View logs: Vercel dashboard → **Deployments** → **View Function Logs**
- Check analytics: Real-time visitors, page views
- Performance: Core Web Vitals

---

## 🎯 Final Production URLs

After deployment, update README.md:

```markdown
[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-6366f1?style=for-the-badge)](https://aletheia.vercel.app)
```

Replace `YOUR_DEPLOYED_URL_HERE` with your Vercel URL in:
- README.md (3 occurrences)
- Any marketing materials

---

## 🚨 Security Notes

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Rotate secrets regularly** - Especially Gemini API key
3. **Use Railway secrets** - For sensitive production values
4. **Enable Vercel password protection** - For demo/staging environments
5. **Monitor API usage** - Gemini, Supabase, Neo4j quotas

---

## 💰 Cost Estimates (Free Tiers)

- **Railway**: $5/month credit (enough for backend)
- **Vercel**: Unlimited deployments (free for personal projects)
- **Supabase**: 500MB database, 2GB bandwidth (free tier)
- **Neo4j AuraDB**: Free tier available
- **Gemini API**: Free tier with rate limits

**Total**: $0-5/month for hackathon demo

---

## 📞 Support

If deployment fails:
1. Check Railway/Vercel logs
2. Verify all environment variables
3. Test health endpoints
4. Check GitHub Actions (if configured)

---

**Deployment Status**: ✅ Production-Ready

**Estimated Time**: 15-20 minutes total
