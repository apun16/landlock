# LandLock - BC Land Development & Insurance Risk Analysis

Next.js platform for analyzing land development and insurance risks in British Columbia using geospatial data and AI agents.

## Quick Start

```bash
npm install
npm run dev       # Start dev server at http://localhost:3000
npm test          # Run 40 tests
npm run build     # Production build
```

---

## Project Status

### ✅ Right Sidebar (Finance & Insurance) - COMPLETE

#### Data Infrastructure
- ✅ **Integrate geospatial hazard datasets** - Wildfire perimeters, hotspots, fire statistics from BC Wildfire Service + CWFIS
- ✅ **Data normalization** - 20+ BC government data sources configured and operational
- ✅ **Score insurance risks per region** - Weighted 0-100 risk scores, ranked most → least probable
- ✅ **Generate regional insurance risk reports** - Full reports with recommendations, explainability, and data sources
- ✅ **Model cost projections and disaster recovery scenarios** - 9 scenarios (3 climate × 3 development), 4 recovery magnitudes

#### Multi-Agent System (3 Agents)
- ✅ **Agent 1: Data Analyst** - Validates wildfire/zoning data quality
- ✅ **Agent 2: Insurance Risk Analyst** - Analyzes risk and generates reports
- ✅ **Agent 3: Mitigation Strategist** - Develops risk reduction strategies
- ✅ **Crew Orchestrator** - Coordinates agent hand-offs with communication logs
- ✅ **LangGraph-style state** - Shared state management for agent coordination
- ⚠️ **Optional LLM** - Works with rule-based logic, can integrate OpenAI/Anthropic

#### Automation
- ✅ **Automate data refresh and agent execution pipeline** - 8-stage pipeline with scheduling
- ✅ **State management** - Custom state manager (LangGraph-style concept)
- ✅ **Validate outputs and ensure explainability** - All conclusions include methodology and data sources

#### API & UI
- ✅ **API Routes** - 4 endpoints (`/api/regions`, `/api/risk/[regionId]`, `/api/risk/rankings`, `/api/pipeline`)
- ✅ **UI Components** - 5 components (RiskScoreCard, RiskRankings, CostProjections, AgentInsights, RightSidebar)

#### Testing
- ✅ **Test Coverage** - 40 tests passing (state manager, data sources, risk analyst logic)

### ✅ Multi-Agent Orchestration - COMPLETE

- ✅ **3-Agent System** - Data Analyst → Insurance Risk Analyst → Mitigation Strategist
- ✅ **Agent Hand-offs** - Clear data flow with communication logs
- ✅ **LangGraph-style State** - Shared state management across agents
- ✅ **Communication Logs** - Step-by-step reasoning and agent messages
- ✅ **Optional LLM** - Supports OpenAI GPT-4 (set OPENAI_API_KEY)
- ⚠️ **Works Without LLM** - Rule-based system is fully functional

### 🔲 Left Sidebar (Policy & Development) - NOT STARTED

- [ ] Implement general area analytics (development trends, population, growth indicators)
- [ ] Display city/region metadata (budget, zoning laws, proposals)
- [ ] Create CrewAI Agent: Budget Analyst (extracts and summarizes regional funding data)
- [ ] Create CrewAI Agent: Policy Analyst (analyzes zoning laws and city proposals)
- [ ] Create CrewAI Agent: Underwriter (evaluates development feasibility)
- [ ] Generate consolidated conclusions with clear pros and cons per region

### 🔲 Central Map - NOT STARTED

- [ ] Build geospatial heatmap (green → red) for developed vs underdeveloped areas
- [ ] Add grey dotted boundary styling for underdeveloped zones
- [ ] Make all regions clickable with deep links to region-specific map views
- [ ] Design UI layout with central map display and dual sidebars

### 🔲 Production Features - NOT STARTED

- [ ] Database persistence (PostgreSQL/Supabase)
- [ ] User authentication
- [ ] Real-time wildfire updates
- [ ] PDF report exports
- [ ] Deployment configuration

---

## Architecture

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── pipeline/           # Pipeline control
│   │   ├── regions/            # Region list
│   │   └── risk/               # Risk scoring & rankings
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   └── right-sidebar/          # Risk visualization components
├── lib/
│   ├── agents/                 # Insurance Risk Analyst (rule-based)
│   ├── data/                   # BC data source configurations
│   ├── services/               # Data ingestion & pipeline
│   ├── state/                  # State management (LangGraph-style)
│   └── types/                  # TypeScript interfaces
└── __tests__/                  # 40 tests
```

---

## Key Features

### Data Sources (20+ BC Government APIs)
- BC Wildfire Service (current/historical perimeters)
- CWFIS (Canadian Wildfire Information System)
- Vancouver, Surrey, Burnaby municipal zoning
- IBC catastrophic losses
- BC property assessments
- PCIC climate projections

### Risk Scoring System
Weighted multi-factor model (0-100):
- Wildfire Exposure (35%)
- Historical Loss (25%)
- Vulnerability Index (20%)
- Climate Projection (15%)
- Mitigation Factor (5%)

### Automation Pipeline
8-stage process:
1. Initialization
2. Wildfire data ingestion
3. Zoning data ingestion
4. Data validation
5. Risk scoring
6. Report generation
7. State synchronization
8. Cleanup

---

## API Examples

```bash
# List all regions
curl http://localhost:3000/api/regions

# Get risk rankings
curl http://localhost:3000/api/risk/rankings

# Analyze specific region
curl http://localhost:3000/api/risk/kamloops

# Run full pipeline
curl -X POST http://localhost:3000/api/pipeline \
  -H "Content-Type: application/json" \
  -d '{"action": "full"}'

# Run 3-agent crew analysis
curl -X POST http://localhost:3000/api/crew \
  -H "Content-Type: application/json" \
  -d '{"regionId": "kamloops"}'
```

---

## Important Notes

### Multi-Agent System

**3 specialized agents** work together:

1. **Data Analyst** - Validates data quality
2. **Insurance Risk Analyst** - Calculates risk scores
3. **Mitigation Strategist** - Develops action plans

**LLM Integration (Optional):**
```bash
export OPENAI_API_KEY="sk-..."  # Enables GPT-4 for recommendations
```

System works perfectly **without LLM** using rule-based logic.

---

## Tech Stack

- **Framework:** Next.js 16.1.3
- **Language:** TypeScript 5
- **Runtime:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **Testing:** Vitest 4 (40 tests passing)
- **APIs:** RESTful endpoints

---

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Build for production
npm run build
npm start

# Lint
npm run lint
```

---

## Documentation

- `MULTI_AGENT_SYSTEM.md` - Complete 3-agent system guide
- `TODO.md` - Detailed task breakdown
- `BUG_FIXES.md` - Recent bug fixes (4 bugs fixed Jan 2026)

---

## License

Private project for BC land development analysis.
