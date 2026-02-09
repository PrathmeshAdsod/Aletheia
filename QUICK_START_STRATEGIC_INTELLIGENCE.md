# Quick Start Guide - Strategic Intelligence Features

## 🚀 Getting Started

### 1. Run Database Migration

```sql
-- In Supabase SQL Editor
-- Run: database/migrations/strategic_stories.sql
```

### 2. Restart Backend

```bash
cd backend
npm run dev
```

The new routes will be automatically loaded.

### 3. Access Features

**Strategic Story Page**
- Navigate to: `http://localhost:3000/dashboard/story`
- Or add link to navigation menu

**Accountability Widget**
- Already visible on Dashboard
- Located in Column 2 (middle)

---

## 📖 Strategic Story

### Accessing
1. Go to `/dashboard/story`
2. Story generates automatically on first visit
3. Click "Refresh" to regenerate

### What You'll See
- **Executive Summary**: 2-3 sentence overview
- **Key Metrics**: Decisions, resolution rate, themes
- **Full Narrative**: 4-5 paragraph story
- **Chapters**: Time-based phases with sentiment
- **Current Trajectory**: Where you're headed
- **Hidden Tensions**: Unresolved issues
- **Emerging Patterns**: New trends
- **Strategic Themes**: Recurring focus areas

### Best Practices
- Generate after uploading 10+ documents
- Refresh weekly for updated narrative
- Share with leadership for strategic reviews
- Use for board presentations

---

## 🧠 Accountability Widget

### Location
Dashboard → Column 2 (middle) → Below Executive Briefing

### What It Shows
- **Accountability Score**: 0-100 (higher is better)
- **Critical Gaps**: Top 3 most urgent issues
- **Gap Types**:
  - Neglected Decisions
  - Abandoned Themes
  - Repeated Reversals
  - Aging Conflicts
  - Actor Concentration
  - Orphaned Decisions

### Interpreting Scores
- **80-100**: Strong accountability ✅
- **60-79**: Moderate, some gaps ⚠️
- **0-59**: Significant concerns ❌

### Taking Action
1. Click on a gap to see details
2. Follow suggested actions
3. Create follow-up tasks
4. Refresh to see improvements

---

## 🔌 API Usage

### Strategic Story
```bash
# Get story (cached)
GET /api/teams/{teamId}/story

# Force refresh
GET /api/teams/{teamId}/story?refresh=true

# Response
{
  "success": true,
  "story": {
    "executiveSummary": "...",
    "fullNarrative": "...",
    "chapters": [...],
    "themes": [...],
    "currentTrajectory": "...",
    ...
  },
  "cached": false
}
```

### Accountability Analysis
```bash
# Full analysis
GET /api/teams/{teamId}/accountability

# Critical gaps only
GET /api/teams/{teamId}/memory-gaps

# Response
{
  "success": true,
  "insights": [...],
  "overallAccountabilityScore": 85,
  "criticalGaps": 2,
  "summary": "..."
}
```

---

## 🎨 Adding to Navigation

Edit `frontend/src/app/dashboard/layout.tsx`:

```tsx
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Strategic Story', href: '/dashboard/story', icon: BookOpen }, // ADD THIS
  { name: 'Auditor', href: '/dashboard/auditor', icon: Upload },
  // ... rest
];
```

---

## 🐛 Troubleshooting

### Story Not Generating
- **Check**: Do you have decisions in database?
- **Fix**: Upload documents via Auditor first
- **Minimum**: 5+ decisions recommended

### Accountability Score Always 100
- **Check**: Are there any conflicts or strategic decisions?
- **Fix**: Upload more diverse documents
- **Note**: Score of 100 means no gaps detected (good!)

### Widget Not Showing
- **Check**: Is `selectedTeam` defined?
- **Fix**: Ensure you're logged in and have team access
- **Verify**: Check browser console for errors

### API 500 Errors
- **Check**: Backend logs for specific error
- **Common**: Missing decisions table data
- **Fix**: Ensure database migrations ran successfully

---

## 💡 Tips & Tricks

### Strategic Story
1. **Best Time to Generate**: After major decision milestones
2. **Frequency**: Weekly or bi-weekly
3. **Sharing**: Export narrative for presentations
4. **Context**: Use for onboarding new team members

### Accountability
1. **Monitor Trends**: Track score over time
2. **Proactive**: Address gaps before they escalate
3. **Team Review**: Discuss gaps in team meetings
4. **Follow-up**: Create action items for each gap

---

## 📊 Example Workflow

### Weekly Strategic Review
1. **Monday**: Upload week's documents
2. **Tuesday**: Check Accountability Widget
3. **Wednesday**: Address critical gaps
4. **Thursday**: Refresh Strategic Story
5. **Friday**: Share insights with team

### Monthly Board Meeting
1. Generate fresh Strategic Story
2. Export key metrics
3. Present narrative and trajectory
4. Discuss accountability gaps
5. Set action items

---

## 🔗 Related Features

These features integrate with:
- **Executive Briefing**: Daily AI summaries
- **Strategic Pulse**: Health metrics
- **Strategic DNA**: Organizational identity
- **Risk Radar**: Early warning system
- **Team Benchmarks**: Performance comparison

Together, they form a complete **Organizational Intelligence Platform**.

---

## 📞 Support

If you encounter issues:
1. Check backend logs
2. Verify database migrations
3. Ensure decisions exist in database
4. Review browser console
5. Check API responses

**Everything is working correctly if:**
- ✅ Backend starts without errors
- ✅ Dashboard loads with Accountability Widget
- ✅ `/dashboard/story` page accessible
- ✅ API endpoints return 200 status

---

## 🎯 Next Steps

1. **Test**: Upload 10+ documents
2. **Generate**: Visit `/dashboard/story`
3. **Monitor**: Check Accountability Widget daily
4. **Share**: Present to leadership
5. **Iterate**: Refine based on feedback

**You now have a production-grade Organizational Intelligence Platform!** 🚀
