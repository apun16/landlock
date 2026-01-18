# LandLock
<img width="1756" height="987" alt="landing" src="https://github.com/user-attachments/assets/1219b2d7-ef86-43af-a687-034b20d23fbb" />

LandLock is an **AI-powered land risk intelligence platform** that helps people make informed decisions about where to live, build, and insure. It pairs an interactive map-based UI with automated analysis pipelines and agent-based explanations to translate climate and wildfire exposure into **actionable financial and planning insights**.

## 💡 Inspiration
> Identity isn’t just who you are, it’s where you belong.

For most people, **identity starts with a home**: a place tied to safety, stability, and the future they imagine for themselves. But as climate risk accelerates, that identity is increasingly fragile. In 2024 alone, **over 4,500 people** in British Columbia were displaced by wildfires, losing not just housing, but a sense of permanence and belonging.

Cities continue to approve development in wildfire-exposed regions **using fragmented, inaccessible data**: zoning bylaws buried in decade-old PDFs, budgets that signal intent but are never connected to risk, and hazard maps that don’t translate into real financial consequences.

We asked a simple question: **How can someone build an identity, a home, a community, or even a future, if the systems deciding where we build don’t understand risk holistically?**

**LandLock was built to answer that.**

---
## ⚙️ What it does

LandLock produces regional risk scores and allows stakeholders **make informed decisions** across housing, development, insurance, and policy.

### 🏠 For Homebuyers

- Translates wildfire, climate, and insurance risk into clear 0–100 scores
- Reveals long-term safety and affordability risks before purchase
- Helps buyers understand not just if a place is risky, but why

### 🏗️ For Developers

 - Identifies where development is viable and where risk is too high
- Connects zoning rules, municipal intent, and wildfire exposure
- Shows how mitigation strategies can reduce financial and insurance risk

### 🏦 For Insurers and Policymakers

- Provides consistent, data-driven regional risk assessments
- Supports premium optimization, underwriting, and planning decisions
- Links climate risk directly to financial and recovery outcomes
---
## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Next.js for a responsive and interactive map-based UI.
- **Mapping**: Mapbox and Leaflet for real-time interactive mapping of risk and mitigation data.
- **Backend**: Python + FastAPI to handle data ingestion, processing, and AI orchestration.
- **Multi-Agent Orchestration**: CrewAI + LangGraph for managing agent workflows and shared state.
- **AI & NLP**: 3 rule-based TypeScript agents with optional OpenAI GPT-4 integration for insights.
- **Data Integration & Parsing**: Beautiful Soup for scraping and parsing unstructured public datasets, combined with 20+ BC government and public datasets for zoning, wildfire, climate, and insurance data.

---
## 📡 API Routes
#### Region Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/regions` | List all available regions with risk scores and metadata |
| GET | `/api/risk/[regionId]` | Get detailed risk analysis for a specific region |
| POST | `/api/risk/[regionId]` | Trigger a new risk analysis for a region |

#### Risk Analysis Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/risk/rankings` | Get ranked list of regions by risk score |

#### Pipeline Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pipeline` | Get current pipeline status and recent events |
| POST | `/api/pipeline` | Run the full data ingestion and analysis pipeline |
| DELETE | `/api/pipeline` | Stop scheduled pipeline execution |

#### Multi-Agent Crew Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/crew` | Run the 3-agent crew analysis for a region |
| GET | `/api/crew` | Get information about available agents and capabilities |

### Backend API (FastAPI)
*Base URL: `http://localhost:8000/`*

#### Service Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint with service information |
| GET | `/health` | Health check endpoint |

#### Analysis Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/analyze` | Analyze a region by scraping and analyzing sources |
| POST | `/api/v1/analyze-from-registry` | Analyze a region using already-scraped sources from registry |
| POST | `/api/v1/demo/{region_id}` | Returns demo data for testing the frontend without scraping |

#### Source Management Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sources/{region_id}` | Get discovered sources for a region |

---
## 🏢 Architecture 
### Frontend Architecture

```
src/
├── app/
│   ├── api/                          # Next.js API routes
│   │   ├── crew/                     # Multi-agent crew endpoint
│   │   ├── pipeline/                 # Pipeline control
│   │   ├── regions/                  # Region listing
│   │   └── risk/                     # Risk analysis endpoints
│   │       ├── [regionId]/           # Region-specific analysis
│   │       └── rankings/             # Risk rankings
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Home page
├── components/
│   ├── HazardMap.tsx                # Central map component
│   ├── landing/                      # Landing page components
│   ├── left-sidebar/                 # Policy & development panel
│   └── right-sidebar/                # Risk & finance panel
│       ├── RiskScoreCard.tsx
│       ├── RiskRankings.tsx
│       ├── CostProjections.tsx
│       └── AgentInsights.tsx
├── lib/
│   ├── agents/                       # Multi-agent system
│   │   ├── base-agent.ts            # Base agent class
│   │   ├── crew-orchestrator.ts      # Agent coordination
│   │   ├── data-analyst-agent.ts     # Agent 1: Data validation
│   │   ├── insurance-risk-analyst.ts # Agent 2: Risk analysis
│   │   └── mitigation-strategist-agent.ts # Agent 3: Strategy
│   ├── data/
│   │   └── sources.ts                # BC data source configs
│   ├── services/
│   │   ├── automation-pipeline.ts    # 8-stage pipeline
│   │   ├── data-fetcher.ts           # Data fetching
│   │   ├── wildfire-ingestion.ts    # Wildfire data ingestion
│   │   └── zoning-ingestion.ts      # Zoning data ingestion
│   ├── state/
│   │   └── region-state.ts          # State manager (LangGraph-style)
│   └── types/
│       └── hazard.ts                 # TypeScript interfaces
└── __tests__/                        # Test suite (40+ tests)
```

### Backend Architecture

```
backend/
├── backend/
│   ├── agents/                       # CrewAI agents
│   │   ├── budget_analyst.py        # Budget analysis agent
│   │   ├── policy_analyst.py        # Policy analysis agent
│   │   ├── underwriter.py           # Underwriting agent
│   │   ├── production_crew.py       # Agent orchestration
│   │   └── shared_state.py          # Shared state management
│   ├── api/
│   │   └── main.py                  # FastAPI application
│   ├── config.py                    # Configuration management
│   ├── extractors/
│   │   └── fact_extractor.py        # Fact extraction from documents
│   ├── models/                      # Pydantic models
│   │   ├── agent_outputs.py
│   │   ├── citation.py
│   │   ├── discovered_source.py
│   │   └── extracted_fact.py
│   ├── pipeline/
│   │   └── runner.py                # Pipeline orchestration
│   ├── scraper/
│   │   ├── discovery.py            # Source discovery
│   │   └── scraper.py              # Web scraping
│   └── storage/
│       ├── source_registry.py      # Source registry
│       └── supabase_storage.py     # Supabase integration
├── cli.py                           # CLI interface
├── requirements.txt                 # Python dependencies
└── tests/                           # Backend test suite
```

---
## 🧱 Local setup
### Prerequisites

- **Python** 3.11 (recommended to match pyproject.toml)
- **Node.js** 18+ and npm/pnpm (Next.js 16)
- **Git**

### Environment Variables

**Backend:**
Create a `.env` file in `backend/`:

```bash
OPENAI_API_KEY=your_key                    # Optional: for LLM-enhanced agent insights
SUPABASE_URL=https://your-project.supabase.co  # Optional: for database storage
SUPABASE_KEY=your_supabase_key            # Optional: for database storage
```

**Frontend:**
Create a `.env.local` file in the root directory:

```bash
# frontend/.env.local
OPENAI_API_KEY=your_key  # Optional: for LLM-enhanced agent insights
```

If you skip this, the system works with rule-based logic (no LLM required).

### Backend (FastAPI)

Located in `backend/`.

**Option A — Using pip/venv (recommended):**

```bash
cd backend
python -m venv venv && source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
python -m backend.api.main
```

**Option B — Using setup script:**

```bash
cd backend
./setup_and_test.sh  # Installs deps and runs tests
python -m backend.api.main
```

The API will be available at `http://localhost:8000`.

**Health check:**
```
GET http://localhost:8000/health -> { "status": "healthy" }
```

**Key endpoints used by the frontend:**
- `POST /api/v1/analyze` - Analyze region by scraping sources
- `POST /api/v1/analyze-from-registry` - Analyze from registry
- `GET /api/v1/sources/{region_id}` - Get discovered sources
- `POST /api/v1/demo/{region_id}` - Demo data for testing

### Frontend (Next.js)

Located in root directory.

**Install deps:**
```bash
npm install
# or
pnpm install
```

**Run the dev server:**
```bash
npm run dev
```

Next.js runs at `http://localhost:3000` by default.

**Build/start (optional):**
```bash
npm run build
npm start
```

**Run tests:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Using the CLI

The backend includes a CLI for running analysis pipelines:

```bash
cd backend
source venv/bin/activate

# Analyze region with scraping
python cli.py --region vancouver --base-url https://vancouver.ca \
  --budget-entry /budget --zoning-entry /planning

# Analyze from registry (already scraped sources)
python cli.py --region vancouver --from-registry
```
---

## 📝 License
This project is open source and available under the MIT License.
