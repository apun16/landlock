## To Do List

- [ ] Collect and normalize public BC zoning, land-use, and development data (federal + municipal sources)
- [ ] Ingest annual insurance risk reports and map risks to zoning regions
- [ ] Build geospatial heatmap (green → red) for developed vs underdeveloped areas
- [ ] Add grey dotted boundary styling for underdeveloped zones
- [ ] Make all regions clickable with deep links to region-specific map views
- [ ] Design UI layout with central map display and dual sidebars

### Left Sidebar (Policy & Development)
- [ ] Implement general area analytics (development trends, population, growth indicators)
- [ ] Display city/region metadata (budget, zoning laws, proposals)
- [ ] Create CrewAI Agent: Budget Analyst (extracts and summarizes regional funding data)
- [ ] Create CrewAI Agent: Policy Analyst (analyzes zoning laws and city proposals)
- [ ] Create CrewAI Agent: Underwriter (evaluates development feasibility)
- [ ] Generate consolidated conclusions with clear pros and cons per region

### Right Sidebar (Finance & Insurance)
- [ ] Integrate geospatial hazard datasets (wildfire historical loss data)
- [ ] Create CrewAI Agent: Insurance Risk Analyst
- [ ] Score insurance risks per region (ranked most → least probable)
- [ ] Generate regional insurance risk reports
- [ ] Model cost projections and disaster recovery scenarios

### Orchestration & Automation
- [ ] Implement CrewAI production crew
- [ ] Integrate LangGraph shared state (events, scores, constraints, plan variants)
- [ ] Automate data refresh and agent execution pipeline
- [ ] Validate outputs and ensure explainability for all agent conclusions