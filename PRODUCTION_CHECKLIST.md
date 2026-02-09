# ✅ Production Deployment Checklist

## Pre-Deployment

### Backend
- [x] Environment variables validated at startup
- [x] PORT reads from process.env (Railway auto-assigns)
- [x] NODE_ENV defaults to 'production'
- [x] CORS configured for production frontend
- [x] Console.logs removed from production code
- [x] Error handling with fallbacks
- [x] Health check endpoint available
- [x] Neo4j connection tested on startup
- [x] Stateless design (no local file storage)
- [x] TypeScript build configured

### Frontend
- [x] NEXT_PUBLIC_API_URL configured
- [x] No localhost hardcoding
- [x] Production build tested
- [x] API client handles missing env gracefully
- [x] Error boundaries in place

### Security
- [x] .env files in .gitignore
- [x] No secrets in code
- [x] Environment templates provided
- [x] CORS restricted to frontend domain

## Deployment Steps

### 1. Railway Backend
```bash
# Railway will run these automatically:
npm install
npm run build
npm start
```

**Environment Variables Required:**
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- NEO4J_URI
- NEO4J_USERNAME
- NEO4J_PASSWORD
- GEMINI_API_KEY
- NODE_ENV=production
- FRONTEND_URL (update after Vercel deployment)

**DO NOT SET:** PORT (Railway auto-assigns)

### 2. Vercel Frontend
```bash
# Vercel will run these automatically:
npm install
npm run build
npm start
```

**Environment Variables Required:**
- NEXT_PUBLIC_API_URL (Railway backend URL)

### 3. Update CORS
After Vercel deployment:
1. Copy Vercel URL
2. Update FRONTEND_URL in Railway
3. Railway auto-redeploys

## Post-Deployment Verification

### Backend Health
```bash
curl https://your-backend.railway.app/health
```
Expected: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

### Frontend Access
1. Visit Vercel URL
2. Open browser console
3. Check for errors
4. Test API calls

### Full Stack Test
1. Upload document
2. View in Causal Nexus
3. Query Oracle
4. Check Strategic Intelligence

## Monitoring

### Railway
- Logs: Dashboard → Deployments → View Logs
- Metrics: CPU, Memory, Network
- Alerts: Configure in Settings

### Vercel
- Logs: Dashboard → Deployments → Function Logs
- Analytics: Real-time visitors
- Performance: Core Web Vitals

## Rollback Plan

### Railway
1. Go to Deployments
2. Select previous deployment
3. Click "Redeploy"

### Vercel
1. Go to Deployments
2. Select previous deployment
3. Click "Promote to Production"

## Known Limitations

1. **Railway Free Tier**: 500 hours/month, sleeps after inactivity
2. **Vercel Free Tier**: 100GB bandwidth/month
3. **Gemini API**: Rate limits apply
4. **Neo4j Free Tier**: Storage limits

## Production URLs

After deployment, update:
- README.md (3 occurrences of YOUR_DEPLOYED_URL_HERE)
- Any demo materials

**Frontend**: https://aletheia.vercel.app
**Backend**: https://aletheia-backend.railway.app

---

**Status**: ✅ Ready for Production
**Estimated Deployment Time**: 15-20 minutes
