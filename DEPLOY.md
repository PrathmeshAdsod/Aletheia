# 🚀 Production Deployment

## Vercel (Frontend)

1. **Import Project**: vercel.com → New Project → Import from GitHub
2. **Root Directory**: `frontend`
3. **Environment Variable**: 
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
   ```
4. **Deploy**

## Railway (Backend)

1. **Import Project**: railway.app → New Project → Deploy from GitHub
2. **Environment Variables** (8 required):
   ```
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_KEY=your_key
   NEO4J_URI=your_uri
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your_password
   GEMINI_API_KEY=your_key
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```
3. **Deploy** → Generate Domain

## Update CORS

After both deployed, update Railway `FRONTEND_URL` with actual Vercel URL.

---

**Time**: 15 minutes
