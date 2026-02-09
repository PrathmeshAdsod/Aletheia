# 🧠 Aletheia - Organizational Intelligence Platform

> **Transform institutional chaos into strategic clarity with AI-powered causal memory**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-6366f1?style=for-the-badge)](YOUR_DEPLOYED_URL_HERE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/PrathmeshAdsod/Aletheia)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)

---

## 🎯 The Problem We Solve

**Every organization faces the same crisis**: Critical decisions get lost in Slack threads, meeting notes, and email chains. Teams repeat mistakes, contradict past choices, and lose institutional memory when people leave.

**The cost?** Wasted time, strategic drift, and preventable conflicts.

**Aletheia changes everything.**

---

## ✨ What Makes Aletheia Revolutionary

Aletheia is the world's first **Causal Memory Engine (CME)** - an AI-powered system that:

1. **📚 Ingests** documents, Slack messages, meeting transcripts, and GitHub discussions
2. **🧠 Extracts** decisions using Google Gemini AI with causal reasoning
3. **🔗 Connects** decisions in a living knowledge graph (Neo4j)
4. **⚠️ Detects** conflicts, contradictions, and strategic drift automatically
5. **🎯 Provides** citation-backed answers (zero hallucination Oracle)
6. **📊 Generates** strategic intelligence and accountability insights

### 🏆 Why Judges Will Love This

- ✅ **Production-Ready**: Full-stack TypeScript, Docker deployment, enterprise security
- ✅ **AI Innovation**: Multi-model Gemini integration with advanced prompt engineering
- ✅ **Graph Intelligence**: Neo4j causal graph with relationship detection
- ✅ **Real-World Impact**: Solves actual organizational pain points
- ✅ **Scalable Architecture**: Job queues, caching, RLS security, schema versioning
- ✅ **Premium UX**: Glassmorphism design, real-time updates, interactive visualizations

---

## 🎬 Live Demo

**🚀 [Try Aletheia Now](YOUR_DEPLOYED_URL_HERE)**

### Quick Demo Flow:
1. **Command Center** - See organizational health at a glance
2. **Auditor** - Upload a document (try a meeting transcript or decision log)
3. **Causal Nexus** - Watch the knowledge graph grow in real-time
4. **Flags** - See conflict detection in action
5. **Oracle** - Ask questions and get citation-backed answers
6. **Strategic Intelligence** - View evolution story and accountability gaps

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                    │
│  Command Center │ Auditor │ Nexus │ Flags │ Oracle │ Story  │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────────┐
│                   BACKEND (Node.js/Express)                 │
│  Upload Service │ Job Queue │ Conflict Detector │ AI Engine │
└─────┬──────────┬──────────┬──────────┬────────────┬────────┘
      │          │          │          │            │
      ▼          ▼          ▼          ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐
│Supabase │ │  Neo4j  │ │ Gemini  │ │Strategic │ │  Risk    │
│PostgreSQL│ │ AuraDB  │ │   AI    │ │  Pulse   │ │  Radar   │
└─────────┘ └─────────┘ └─────────┘ └──────────┘ └──────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- React Flow (graph visualization)
- Tailwind CSS (glassmorphism design)
- Real-time polling

**Backend:**
- Node.js + Express
- TypeScript
- Job Queue (non-blocking uploads)
- SHA-256 deduplication

**AI & Data:**
- Google Gemini 3 Flash Preview (decision extraction)
- Gemini 1.5 Flash (Oracle queries)
- Supabase (PostgreSQL + Row Level Security)
- Neo4j AuraDB (causal graph database)

**DevOps:**
- Docker + Docker Compose
- Environment-based configuration
- Health checks & monitoring

---

## 🚀 Features Deep Dive

### 1️⃣ Command Center - Mission Control
**Real-time organizational health dashboard**

- **Consistency Score** (0-100): Live metric based on conflict detection
- **RED/GREEN/NEUTRAL Counters**: Visual sentiment analysis
- **Decision Velocity**: Track decision-making pace
- **Auto-refresh**: Updates every 10 seconds

**Formula:**
```
Consistency Score = 100 - (RED flags × 10) - (Unresolved conflicts × 5)
```

---

### 2️⃣ Auditor - Document Ingestion
**Non-blocking AI-powered document processing**

- **Drag & Drop Upload**: Supports TXT, PDF, DOCX, MD
- **Job Queue System**: No API blocking, scalable to 1000s of files
- **Progress Tracking**: Real-time status (queued → processing → completed)
- **Duplicate Detection**: SHA-256 hash prevents reprocessing
- **AI Extraction**: Gemini identifies decisions, actors, reasoning, constraints

**What Gets Extracted:**
```json
{
  "decision": "Migrate to microservices architecture",
  "actor": "CTO",
  "reasoning": "Improve scalability and team autonomy",
  "constraints": ["6-month timeline", "Zero downtime"],
  "sentiment": "GREEN",
  "importance": "strategic"
}
```

---

### 3️⃣ Causal Nexus - Knowledge Graph
**Interactive visualization of decision relationships**

- **React Flow Graph**: Drag, zoom, pan
- **Color-Coded Nodes**:
  - 🔴 RED: Conflicts detected
  - 🟢 GREEN: Aligned decisions
  - ⚪ NEUTRAL: Independent decisions
- **Relationship Types**:
  - `CAUSES`: Decision A led to Decision B
  - `BLOCKS`: Decision A prevents Decision B
  - `DEPENDS_ON`: Decision A requires Decision B
- **Click to Expand**: View full decision details

---

### 4️⃣ Flags - Conflict Audit Stream
**Automated conflict detection and severity rating**

- **Real-time Conflict Detection**: AI identifies contradictions
- **Severity Levels**: Critical, High, Medium, Low
- **Path Visualization**: Shows decision chains causing conflicts
- **Actionable Insights**: Suggested resolutions

**Example Conflict:**
```
⚠️ HIGH SEVERITY
Decision A: "Use React for all frontends" (2024-01-15)
Decision B: "Migrate dashboard to Vue.js" (2024-02-20)
Conflict: Technology stack contradiction
Suggested Action: Align on single framework or document exceptions
```

---

### 5️⃣ Oracle - Citation-Backed Q&A
**Zero-hallucination AI assistant powered by RAG**

- **Retrieval-Only Responses**: Every answer cites Decision IDs
- **No Hallucination**: If no verified decision exists → "No verified decision found"
- **Citation Enforcement**: Powered by Retrieval-Augmented Generation (RAG)
- **Context-Aware**: Searches causal graph for relevant decisions

**Example Query:**
```
Q: "What did we decide about database scaling?"

A: According to decision [a3f2b1c], the team decided to implement 
   read replicas for PostgreSQL. The reasoning was to handle 
   increased traffic without vertical scaling costs.
   
   Citations: [a3f2b1c], [d4e5f6a]
```

---

### 6️⃣ Strategic Intelligence - NEW! 🎉
**Transform data into strategic insights**

#### 📖 Strategic Evolution Story
- **Cohesive Narrative**: AI-generated story of organizational evolution
- **Inflection Points**: Detects pivots, conflict resolutions, strategic shifts
- **Strategic Themes**: Tracks growth, efficiency, innovation, quality themes
- **Chapter Structure**: Breaks timeline into Foundation → Growth → Transformation → Maturity
- **Trajectory Analysis**: Where you've been, where you're going

#### 🎯 Accountability & Memory Engine
- **6 Detection Algorithms**:
  1. Neglected Decisions (critical decisions with no follow-up)
  2. Abandoned Themes (strategic priorities that disappeared)
  3. Repeated Reversals (pattern of decision flip-flopping)
  4. Aging Conflicts (unresolved conflicts > 30 days)
  5. Actor Concentration (decision bottlenecks)
  6. Orphaned Decisions (strategic decisions with no ripple effects)
- **Accountability Score** (0-100): Measures strategic follow-through
- **Proactive Insights**: Actionable suggestions with evidence
- **Dashboard Widget**: Real-time critical gap monitoring

---

## 🎨 Design Philosophy

**Glassmorphism**: Modern, premium aesthetic inspired by Apple's design language

- **Backdrop Blur**: Layered depth with frosted glass effects
- **Vibrant Gradients**: Purple-to-blue brand identity
- **Smooth Animations**: Micro-interactions for premium feel
- **Dark Mode First**: Optimized for extended use

**Color Palette:**
- 🔴 RED: `#ef4444` (Conflicts)
- 🟢 GREEN: `#10b981` (Alignments)
- ⚪ NEUTRAL: `#6b7280` (Independent)
- 🔵 PRIMARY: `#6366f1` (Accents)
- 🟣 SECONDARY: `#8b5cf6` (Highlights)

---

## 📊 CME Decision Schema

Every decision stored follows this enterprise-grade schema:

```typescript
interface CMEDecision {
  decision_id: string;        // SHA-256 hash (unique)
  schema_version: "v1";       // Backward compatibility
  source_type: "video" | "slack" | "github" | "document";
  source_ref: string;         // Timestamp or URL
  actor: string;              // Person or team
  decision: string;           // What was decided
  reasoning: string;          // Why
  constraints: string[];      // Limitations or requirements
  sentiment: "RED" | "GREEN" | "NEUTRAL";
  importance: "low" | "medium" | "strategic" | "critical";
  precedents: string[];       // Related decision IDs
  timestamp: string;          // ISO8601
}
```

**Why Schema Versioning?**
- Ensures backward compatibility as system evolves
- Allows gradual migration of old data
- Enterprise-grade data governance

---

## 🔐 Security & Production Readiness

### ✅ Security Features
- **Environment Variables**: All secrets in `.env` (never committed)
- **Fail-Fast Validation**: Server won't start if required env vars missing
- **Row Level Security (RLS)**: Supabase policies enforce team isolation
- **Docker Security**: Non-root users in containers
- **SHA-256 Hashing**: Secure decision IDs and deduplication
- **CORS Protection**: Configurable allowed origins

### ✅ Production Features
- **Job Queue Abstraction**: Swappable backend (in-memory → BullMQ)
- **12-Hour Caching**: Executive Briefing cached to respect rate limits
- **Database Migrations**: Version-controlled schema changes
- **Health Checks**: `/health` endpoint for monitoring
- **Error Handling**: Comprehensive try-catch with fallbacks
- **Logging**: Structured logs (removed console.logs for security)

---

## 🛠️ Local Setup (For Judges)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/PrathmeshAdsod/Aletheia.git
cd Aletheia
```

### Step 2: Configure Environment
```bash
cp .env.template .env
```

**Edit `.env` and replace placeholders with YOUR credentials:**

```env
# Get from: https://supabase.com
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Get from: https://console.neo4j.io
NEO4J_URI=your_neo4j_uri_here
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password_here

# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Server config
PORT=8000
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**⚠️ IMPORTANT**: We cannot share our production credentials for security reasons. Please create free accounts:
- **Supabase**: https://supabase.com (free tier available)
- **Neo4j AuraDB**: https://neo4j.com/cloud/aura/ (free tier available)
- **Google Gemini**: https://aistudio.google.com/app/apikey (free tier available)

### Step 3: Database Setup

**Supabase:**
1. Create a new project
2. Run SQL migrations from `database/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_strategic_stories.sql`
   - `003_proactive_insights.sql`

**Neo4j:**
1. Create a new AuraDB instance
2. Note the connection URI and password
3. Graph will auto-populate when you upload documents

### Step 4: Start Application
```bash
docker-compose up --build
```

### Step 5: Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

### Step 6: Test the System

1. **Upload a Document**:
   - Go to Auditor page
   - Upload a sample decision document (create a TXT file with meeting notes)
   - Watch job progress

2. **View Results**:
   - Command Center: See updated metrics
   - Causal Nexus: View decision graph
   - Oracle: Ask "What decisions were made?"
   - Strategic Intelligence: View evolution story

---

## 📁 Project Structure

```
Aletheia/
├── backend/                      # Node.js Express API
│   ├── src/
│   │   ├── config/              # Environment validation
│   │   ├── services/            # Core business logic
│   │   │   ├── gemini.ts        # AI extraction (Gemini 3 Flash)
│   │   │   ├── supabase.ts      # PostgreSQL client
│   │   │   ├── neo4j.ts         # Graph database client
│   │   │   ├── job-queue.ts     # Non-blocking uploads
│   │   │   ├── strategic-story.ts    # Evolution narrative
│   │   │   ├── accountability-engine.ts  # Gap detection
│   │   │   ├── strategic-pulse.ts    # Health metrics
│   │   │   ├── risk-radar.ts    # Risk detection
│   │   │   └── executive-briefing.ts # Daily briefing
│   │   ├── routes/              # API endpoints
│   │   │   ├── upload.ts        # File upload & processing
│   │   │   ├── decisions.ts     # Decision CRUD
│   │   │   ├── graph.ts         # Graph queries
│   │   │   ├── metrics.ts       # Consistency score
│   │   │   ├── oracle.ts        # Q&A endpoint
│   │   │   └── strategic-intelligence.ts  # Story & accountability
│   │   ├── types/               # TypeScript interfaces
│   │   └── server.ts            # Express server
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                     # Next.js 14 App
│   ├── src/
│   │   ├── app/                 # Pages (App Router)
│   │   │   ├── page.tsx         # Command Center
│   │   │   ├── auditor/         # Document upload
│   │   │   ├── nexus/           # Graph visualization
│   │   │   ├── flags/           # Conflict stream
│   │   │   ├── oracle/          # Q&A interface
│   │   │   └── dashboard/
│   │   │       └── story/       # Strategic Evolution Story
│   │   ├── components/          # Reusable UI
│   │   │   ├── ExecutiveBriefing.tsx
│   │   │   ├── RiskRadar.tsx
│   │   │   ├── AccountabilityWidget.tsx
│   │   │   └── ...
│   │   └── lib/                 # API client
│   ├── Dockerfile
│   └── package.json
│
├── database/
│   └── migrations/              # SQL schema versions
│       ├── 001_initial_schema.sql
│       ├── 002_strategic_stories.sql
│       └── 003_proactive_insights.sql
│
├── docker-compose.yml           # Orchestration
├── .env.template                # Environment template
├── .gitignore                   # Ensures .env never committed
└── README.md                    # This file
```

---

## 🔌 API Documentation

### Upload Endpoints
```
POST /api/upload
Body: multipart/form-data (file)
Returns: { job_id: string }

GET /api/upload/:jobId/status
Returns: { status: 'queued' | 'processing' | 'completed' | 'failed', progress: number }
```

### Decision Endpoints
```
GET /api/decisions?team_id=xxx&limit=50&offset=0
Returns: { decisions: CMEDecision[], total: number }

GET /api/decisions/:decisionId
Returns: { decision: CMEDecision }
```

### Graph Endpoints
```
GET /api/graph?team_id=xxx
Returns: { nodes: Node[], edges: Edge[] }
```

### Metrics Endpoints
```
GET /api/metrics?team_id=xxx
Returns: { consistencyScore: number, red: number, green: number, neutral: number }

GET /api/flags?team_id=xxx
Returns: { conflicts: Conflict[] }
```

### Oracle Endpoint
```
POST /api/oracle/query
Body: { question: string, team_id: string }
Returns: { answer: string, citations: string[] } | { error: string }
```

### Strategic Intelligence Endpoints
```
GET /api/teams/:teamId/story
Returns: { story: StrategicStory }

GET /api/teams/:teamId/accountability
Returns: { insights: AccountabilityInsight[], overallScore: number }

GET /api/teams/:teamId/memory-gaps
Returns: { criticalGaps: AccountabilityInsight[] }
```

---

## 🧪 Testing Checklist

### Manual Verification (5 minutes)
1. ✅ **Upload Test**: Upload a text file with decision content
2. ✅ **Job Status**: Verify status updates (queued → processing → completed)
3. ✅ **Command Center**: Check metrics update (consistency score, counters)
4. ✅ **Causal Nexus**: View decisions in graph (nodes appear, colors correct)
5. ✅ **Oracle Query**: Ask "What decisions were made?" and verify citations
6. ✅ **Flags Page**: Check for any detected conflicts
7. ✅ **Strategic Story**: View evolution narrative and themes
8. ✅ **Accountability**: Check accountability score and critical gaps

### Sample Test Document
Create `test-decisions.txt`:
```
Meeting Notes - Product Strategy Session
Date: 2024-01-15

Decision 1: We will migrate to microservices architecture
Actor: CTO
Reasoning: Improve scalability and enable team autonomy
Constraints: Must complete within 6 months, zero downtime required

Decision 2: Adopt React for all new frontend projects
Actor: Engineering Lead
Reasoning: Standardize tech stack, improve hiring
Constraints: Existing Vue projects can remain

Decision 3: Implement weekly all-hands meetings
Actor: CEO
Reasoning: Improve transparency and alignment
Constraints: Keep under 30 minutes
```

---

## 🎯 Enterprise Improvements

This system includes **4 production-grade architectural decisions**:

### 1. Job Queue Abstraction
- **Problem**: Blocking API calls during file processing
- **Solution**: Non-blocking job queue with swappable backend
- **Impact**: Scalable to 1000s of concurrent uploads

### 2. Schema Versioning
- **Problem**: Breaking changes when evolving data model
- **Solution**: `schema_version: "v1"` field in every decision
- **Impact**: Safe evolution, backward compatibility

### 3. Retrieval-Only Oracle
- **Problem**: AI hallucination in Q&A systems
- **Solution**: Citation-enforced RAG (Retrieval-Augmented Generation)
- **Impact**: Zero hallucination, 100% verifiable answers

### 4. Consistency Score Formula
- **Problem**: Vague "health" metrics
- **Solution**: Transparent, explainable formula
- **Impact**: Stakeholder trust, actionable insights

---

## 🚢 Deployment

### Docker Production
```bash
docker-compose -f docker-compose.yml up -d
```

### Environment Variables (Production)
Ensure ALL required variables are set:
- Supabase credentials (URL, keys)
- Neo4j credentials (URI, username, password)
- Gemini API key
- Frontend URL (for CORS)

### Recommended Hosting
- **Frontend**: Vercel, Netlify
- **Backend**: AWS ECS, Google Cloud Run, Railway
- **Database**: Supabase (managed PostgreSQL)
- **Graph**: Neo4j AuraDB (managed)

---

## 📈 Roadmap

### Phase 1: Core CME (✅ Complete)
- [x] Document ingestion
- [x] AI decision extraction
- [x] Causal graph storage
- [x] Conflict detection
- [x] Oracle Q&A

### Phase 2: Strategic Intelligence (✅ Complete)
- [x] Strategic Evolution Story
- [x] Accountability Engine
- [x] Executive Briefing
- [x] Risk Radar

### Phase 3: Integrations (🚧 In Progress)
- [ ] Slack bot (real-time decision capture)
- [ ] GitHub integration (PR decisions)
- [ ] Google Meet transcription
- [ ] Zoom integration

### Phase 4: Advanced Features (📋 Planned)
- [ ] Multi-team workspaces
- [ ] Decision templates
- [ ] Approval workflows
- [ ] Mobile app
- [ ] API webhooks

---

## 🏆 Why Aletheia Wins

### Technical Excellence
- ✅ Full-stack TypeScript (type safety)
- ✅ Production-ready architecture (Docker, job queues, caching)
- ✅ Enterprise security (RLS, env vars, fail-fast validation)
- ✅ Scalable design (swappable backends, schema versioning)

### AI Innovation
- ✅ Multi-model Gemini integration (3 Flash Preview + 1.5 Flash)
- ✅ Advanced prompt engineering (cluster extraction → structured decisions)
- ✅ Zero-hallucination RAG (citation-enforced Oracle)
- ✅ Strategic narrative generation (inflection points, themes, trajectories)

### Real-World Impact
- ✅ Solves actual organizational pain (lost decisions, repeated mistakes)
- ✅ Measurable ROI (time saved, conflicts prevented)
- ✅ Scalable to any organization (startups to enterprises)

### User Experience
- ✅ Premium glassmorphism design
- ✅ Real-time updates (no page refreshes)
- ✅ Interactive visualizations (React Flow graph)
- ✅ Intuitive navigation (5-minute learning curve)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 📞 Contact & Support

- **GitHub**: https://github.com/PrathmeshAdsod/Aletheia
- **Issues**: https://github.com/PrathmeshAdsod/Aletheia/issues
- **Live Demo**: [YOUR_DEPLOYED_URL_HERE]

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Google Gemini](https://ai.google.dev/) - AI models
- [Supabase](https://supabase.com/) - PostgreSQL database
- [Neo4j](https://neo4j.com/) - Graph database
- [React Flow](https://reactflow.dev/) - Graph visualization
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

<div align="center">

**Built with ❤️ for teams who value institutional knowledge**

⭐ **Star this repo if Aletheia impressed you!** ⭐

[🚀 Try Live Demo](YOUR_DEPLOYED_URL_HERE) | [📖 Documentation](https://github.com/PrathmeshAdsod/Aletheia/wiki) | [🐛 Report Bug](https://github.com/PrathmeshAdsod/Aletheia/issues)

</div>
