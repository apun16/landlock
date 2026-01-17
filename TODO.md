# LandLock TODO

## ✅ Done

### Data Infrastructure
- Types system for hazards, zones, risks, reports, agent conclusions
- 20+ BC government data source configs (wildfire, zoning, insurance, climate)
- HTTP fetch service w/ caching + WFS query builder
- Wildfire data ingestion (perimeters, hotspots, stats, costs)
- Zoning data ingestion (municipal boundaries, development status)
- Data normalization for Vancouver + generic BC municipalities

### State Management
- Shared state manager (LangGraph-style concept)
- Region data storage (hazards, zoning, scores, reports)
- Event logging system
- Constraint tracking (budget limits, zoning restrictions)
- Plan variant management for scenarios
- Global risk rankings

### Insurance Risk Analyst Agent
- Agent config (role, goal, backstory, tools)
- 6 task pipeline:
  - Wildfire exposure assessment
  - Historical loss analysis
  - Vulnerability evaluation
  - Risk score calculation (weighted 0-100)
  - Cost projections (baseline + climate scenarios)
  - Report generation w/ explainability
- Risk categorization (low → extreme)
- Recovery scenarios (minor → catastrophic)
- Recommendations generator
- **Note: Rule-based formulas, not actual LLM**

### Automation Pipeline
- 8-stage pipeline (init → ingest → validate → score → report → sync → cleanup)
- Scheduled execution support
- Per-region + full refresh modes
- Error handling + retries
- Status tracking

### API Endpoints
- `GET /api/regions` - List all regions
- `GET/POST /api/risk/[regionId]` - Get/run region analysis
- `GET /api/risk/rankings` - Global ranked list
- `GET/POST/DELETE /api/pipeline` - Control pipeline

### Right Sidebar (Finance & Insurance) ✅ COMPLETE
- ✅ Integrate geospatial hazard datasets (wildfire historical loss data)
- ✅ Create Insurance Risk Analyst agent (CrewAI-style structure)
- ✅ Score insurance risks per region (ranked most → least probable)
- ✅ Generate regional insurance risk reports
- ✅ Model cost projections and disaster recovery scenarios
- ✅ Implement shared state manager (LangGraph-style concept)
- ✅ Automate data refresh and agent execution pipeline
- ✅ Validate outputs and ensure explainability
- ✅ API endpoints (4 routes)
- ✅ UI components (5 components: RiskScoreCard, RiskRankings, CostProjections, AgentInsights, RightSidebar)

### Testing
- ✅ 40 tests across 3 suites
- ✅ State manager operations
- ✅ Data source validation
- ✅ Risk analyst logic
- ✅ Vitest setup (switched from Jest due to Next.js conflicts)

### Code Quality
- ✅ Cleaned up verbose comments
- ✅ Minimal human-readable comments only
- ✅ Build verified
- ✅ Tests passing

---

## 🔲 Next

### Right Sidebar - Upgrade to Real AI ⚠️
- ❌ Actual CrewAI SDK integration (currently rule-based formulas)
- ❌ Actual LangGraph SDK integration (currently custom state manager)
- ❌ Real LLM integration (OpenAI/Anthropic/etc)
- ❌ Dynamic agent reasoning instead of hardcoded formulas
- ❌ Multi-agent orchestration and task delegation
- ❌ Tool use for dynamic data fetching

### Left Sidebar (Policy & Development)
- General area analytics component
- City/region metadata display
- Budget Analyst agent (funding data)
- Policy Analyst agent (zoning laws)
- Underwriter agent (development feasibility)
- Consolidated pros/cons view

### Central Map
- Geospatial heatmap (green → red gradient)
- Grey dotted boundaries for underdeveloped zones
- Clickable regions w/ deep links
- Interactive zoom/pan
- Layer toggles

### Production Features
- Database persistence (PostgreSQL/Supabase)
- User authentication
- Rate limiting
- Error monitoring
- Deployment config
- Environment management

### Nice to Have
- Real-time wildfire updates
- Email alerts for high-risk regions
- PDF report exports
- Historical trend charts
- Comparative analysis tool
