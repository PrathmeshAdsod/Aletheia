# Gemini Model Configuration Reference

## Current Model Setup

### Active Models (Rate Limit Optimized)

| Use Case | Current Model | Purpose | Location |
|----------|--------------|---------|----------|
| **Cluster Extraction** | `gemini-2.5-flash-lite` | Fast decision identification | `gemini.ts:60` |
| **Decision Structuring** | `gemini-2.5-flash-lite` | CME JSON extraction | `gemini.ts:120` |
| **Oracle Queries** | `gemini-1.5-flash` | Citation-based answers | `gemini.ts:220` |
| **Team Chat** | `gemini-2.5-flash-lite` | Conversational AI | `gemini.ts:280` |
| **Executive Briefing** | `gemini-2.5-flash-lite` | Daily summaries | `executive-briefing.ts:280` |

### Target Models (When Rate Limits Allow)

| Use Case | Target Model | Benefits |
|----------|-------------|----------|
| **Cluster Extraction** | `gemini-3-flash-preview` | Better accuracy, faster |
| **Decision Structuring** | `gemini-3-flash-preview` | Improved JSON parsing |
| **Oracle Queries** | `gemini-1.5-flash` | Keep stable (proven) |
| **Team Chat** | `gemini-3-flash-preview` | More natural responses |
| **Executive Briefing** | `gemini-3-flash-preview` | Richer insights |

## Model Characteristics

### gemini-2.5-flash-lite
- ✅ **Pros**: Low rate limits, fast, cost-effective
- ⚠️ **Cons**: Slightly less accurate than 3.0 models
- 🎯 **Best for**: Development, testing, rate-limited environments

### gemini-3-flash-preview
- ✅ **Pros**: Better accuracy, improved reasoning, faster
- ⚠️ **Cons**: Higher rate limits, preview status
- 🎯 **Best for**: Production with adequate rate limits

### gemini-1.5-flash
- ✅ **Pros**: Stable, proven, reliable
- ⚠️ **Cons**: Older generation
- 🎯 **Best for**: Critical features like Oracle (citation accuracy)

## How to Switch Models

### Quick Switch (All at Once)
```bash
# In backend/src/services/
find . -name "*.ts" -exec sed -i 's/gemini-2.5-flash-lite/gemini-3-flash-preview/g' {} +
```

### Manual Switch (Recommended)

**1. Update Cluster Extraction**
```typescript
// File: backend/src/services/gemini.ts
// Line: ~60

const response = await this.ai.models.generateContent({
    model: 'gemini-3-flash-preview',  // Changed from gemini-2.5-flash-lite
    contents: prompt
});
```

**2. Update Decision Structuring**
```typescript
// File: backend/src/services/gemini.ts
// Line: ~120

const response = await this.ai.models.generateContent({
    model: 'gemini-3-flash-preview',  // Changed from gemini-2.5-flash-lite
    contents: prompt
});
```

**3. Update Team Chat**
```typescript
// File: backend/src/services/gemini.ts
// Line: ~280

const response = await this.ai.models.generateContent({
    model: 'gemini-3-flash-preview',  // Changed from gemini-2.5-flash-lite
    contents: systemPrompt
});
```

**4. Update Executive Briefing**
```typescript
// File: backend/src/services/executive-briefing.ts
// Line: ~280

const response = await genAI.models.generateContent({
    model: 'gemini-3-flash-preview',  // Changed from gemini-2.5-flash-lite
    contents: prompt
});
```

**5. Keep Oracle Stable**
```typescript
// File: backend/src/services/gemini.ts
// Line: ~220

const response = await this.ai.models.generateContent({
    model: 'gemini-1.5-flash',  // DO NOT CHANGE - proven for citations
    contents: prompt
});
```

## Testing After Model Switch

### 1. Test Gemini Connection
```bash
cd backend
npx ts-node scripts/test-gemini.ts
```

### 2. Test Upload Flow
1. Start backend: `npm run dev`
2. Upload a test document via Auditor
3. Check console logs for extraction success
4. Verify decisions appear in Nexus graph

### 3. Test Executive Briefing
1. Navigate to Dashboard
2. Wait for briefing to generate
3. Verify AI summary appears
4. Check sections are populated

### 4. Test Oracle
1. Go to Oracle page
2. Ask a question about uploaded decisions
3. Verify citations are included
4. Check answer quality

## Rate Limit Management

### Current Strategy (gemini-2.5-flash-lite)
- **Uploads**: Unlimited (within reason)
- **Briefings**: 2 per day per team (12-hour cache)
- **Chat**: Unlimited
- **Oracle**: Unlimited

### With gemini-3-flash-preview
- **Uploads**: Monitor usage
- **Briefings**: Keep 12-hour cache
- **Chat**: May need rate limiting
- **Oracle**: Keep on gemini-1.5-flash

### Rate Limit Indicators
Watch for these errors:
```
Error: 429 Too Many Requests
Error: RESOURCE_EXHAUSTED
```

**Solutions**:
1. Implement exponential backoff
2. Increase cache duration
3. Switch back to gemini-2.5-flash-lite temporarily
4. Upgrade API quota

## Performance Comparison

| Metric | gemini-2.5-flash-lite | gemini-3-flash-preview |
|--------|----------------------|------------------------|
| **Latency** | ~1-2s | ~0.8-1.5s |
| **Accuracy** | Good | Excellent |
| **JSON Parsing** | 85% success | 95% success |
| **Rate Limits** | Low | Medium |
| **Cost** | Low | Medium |

## Rollback Plan

If issues occur after switching to gemini-3-flash-preview:

### Quick Rollback
```bash
cd backend/src/services
# Revert gemini.ts
git checkout HEAD -- gemini.ts

# Revert executive-briefing.ts
git checkout HEAD -- executive-briefing.ts

# Restart backend
npm run dev
```

### Verify Rollback
```bash
# Check current models
grep -n "model:" gemini.ts executive-briefing.ts

# Should show gemini-2.5-flash-lite
```

## Monitoring

### Key Metrics to Watch
1. **Upload Success Rate**: Should be > 95%
2. **Briefing Generation Time**: Should be < 5s
3. **API Error Rate**: Should be < 1%
4. **Decision Extraction Accuracy**: Spot check quality

### Logging
All model calls log:
- ✅ Success: "Extracted X decisions"
- ❌ Failure: "Gemini API call failed"
- ⚠️ Warning: "Empty response from Gemini"

## Best Practices

1. **Test in Development First**: Always test model changes locally
2. **Monitor Logs**: Watch for extraction failures
3. **Keep Oracle Stable**: Don't change Oracle model (citations critical)
4. **Cache Aggressively**: Use 12-hour cache for briefings
5. **Gradual Rollout**: Switch one service at a time
6. **Have Rollback Ready**: Keep previous version in git

## Support

### Common Issues

**Issue**: "Empty response from Gemini"
- **Cause**: Model name typo or API issue
- **Fix**: Verify model name, check API key

**Issue**: "JSON parse failed"
- **Cause**: Model returned invalid JSON
- **Fix**: Check prompt formatting, add retry logic

**Issue**: "Rate limit exceeded"
- **Cause**: Too many requests
- **Fix**: Implement caching, reduce frequency

### Getting Help
1. Check logs: `backend/logs/` (if configured)
2. Run test script: `npx ts-node scripts/test-gemini.ts`
3. Review this guide
4. Check Gemini API status: https://status.cloud.google.com/

## Version History

| Date | Change | Reason |
|------|--------|--------|
| Current | gemini-2.5-flash-lite | Rate limit management |
| Target | gemini-3-flash-preview | Better accuracy when limits allow |
| Stable | gemini-1.5-flash (Oracle) | Proven citation accuracy |
