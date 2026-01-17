"""Unified CrewAI Production Crew - all agents working together"""
from __future__ import annotations
from typing import List, Optional, Any
import json

from backend.models.extracted_fact import ExtractedFact, FactType
from backend.models.agent_outputs import (
    BudgetAnalystOutput,
    PolicyAnalystOutput,
    UnderwriterOutput,
    RegionPanelOutput,
)
from backend.models.citation import Citation
from backend.config import Settings

try:
    from crewai import Agent, Task, Crew
    from langchain_openai import ChatOpenAI
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False
    Agent = None
    Task = None
    Crew = None
    ChatOpenAI = None

from backend.agents.shared_state import SharedStateManager, LANGGRAPH_AVAILABLE


def create_production_crew(
    facts: List[ExtractedFact],
    citations: List[Citation],
    settings: Settings,
    region_id: str,
) -> Optional[Any]:
    """Create unified production crew with all agents working together"""
    if not CREWAI_AVAILABLE or not settings.use_llm_mode or not settings.openai_api_key:
        return None
    
    llm = ChatOpenAI(model="gpt-4", temperature=0, api_key=settings.openai_api_key)
    
    budget_agent = Agent(
        role="Budget Analyst",
        goal="Analyze budget facts and determine funding strength score (0-100)",
        backstory="""You are an expert budget analyst specializing in municipal financial analysis. 
        Your analysis must be based ONLY on extracted facts with citations.""",
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )
    
    policy_agent = Agent(
        role="Policy Analyst",
        goal="Analyze zoning and proposal facts to determine flexibility and momentum scores",
        backstory="""You are an expert policy analyst specializing in municipal planning and zoning. 
        Your analysis must be based ONLY on extracted facts with citations.""",
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )
    
    underwriter_agent = Agent(
        role="Underwriter",
        goal="Evaluate development feasibility based on budget and policy analysis",
        backstory="""You are an expert underwriter. You must provide pros/cons/constraints with 
        specific fact IDs and citations. Your analysis must be based ONLY on provided facts.""",
        verbose=True,
        allow_delegation=True,
        llm=llm,
    )
    
    budget_facts = [f for f in facts if f.fact_type == FactType.BUDGET]
    zoning_facts = [f for f in facts if f.fact_type == FactType.ZONING]
    proposal_facts = [f for f in facts if f.fact_type == FactType.PROPOSAL]
    all_facts_json = json.dumps([f.model_dump() for f in facts], default=str)
    citations_json = json.dumps([c.model_dump() for c in citations], default=str)
    
    budget_task = Task(
        description=f"""Analyze the following budget facts and produce a BudgetAnalystOutput in JSON format.

BUDGET FACTS (with citations):
{json.dumps([f.model_dump() for f in budget_facts], default=str)}

CITATIONS:
{citations_json}

Requirements:
1. Calculate funding_strength_score (0-100 integer or null)
2. List key_allocations with citation_ids
3. Calculate confidence (0.0-1.0)
4. Count evidence_count
5. List all citation_ids referenced
6. Output must be valid JSON matching BudgetAnalystOutput schema
7. You MUST only use facts provided - do not invent data""",
        agent=budget_agent,
        expected_output="JSON object matching BudgetAnalystOutput schema",
    )
    
    policy_task = Task(
        description=f"""Analyze the following zoning and proposal facts and produce a PolicyAnalystOutput in JSON format.

ZONING FACTS:
{json.dumps([f.model_dump() for f in zoning_facts], default=str)}

PROPOSAL FACTS:
{json.dumps([f.model_dump() for f in proposal_facts], default=str)}

CITATIONS:
{citations_json}

Requirements:
1. Calculate zoning_flexibility_score (0-100 integer or null)
2. Calculate proposal_momentum_score (0-100 integer or null)
3. List approval_friction_factors
4. List constraints
5. Calculate confidence (0.0-1.0)
6. Count evidence_count
7. List all citation_ids referenced
8. Output must be valid JSON matching PolicyAnalystOutput schema
9. You MUST only use facts provided - do not invent data""",
        agent=policy_agent,
        expected_output="JSON object matching PolicyAnalystOutput schema",
        context=[budget_task], 
    )
    
    underwriter_task = Task(
        description=f"""Evaluate development feasibility based on budget and policy analysis.

ALL FACTS:
{all_facts_json}

CITATIONS:
{citations_json}

You will receive the budget and policy analysis results from previous tasks.

Requirements:
1. Calculate feasibility_score (0-100 integer or null)
2. Determine verdict: "go", "caution", "avoid", or "unknown"
3. Determine plan_variant: "A", "B", "C", or "unknown"
4. List pros - each MUST have "description", "supporting_fact_ids", and "citation_ids"
5. List cons - each MUST have "description", "supporting_fact_ids", and "citation_ids"
6. List constraints - each MUST have "description", "supporting_fact_ids", and "citation_ids"
7. Calculate confidence (0.0-1.0)
8. Count evidence_count
9. List all citation_ids referenced
10. Output must be valid JSON matching UnderwriterOutput schema
11. You MUST only use facts provided - do not invent data
12. EVERY pro/con/constraint MUST reference specific fact IDs and citation IDs""",
        agent=underwriter_agent,
        expected_output="JSON object matching UnderwriterOutput schema",
        context=[budget_task, policy_task], 
    )
    
    crew = Crew(
        agents=[budget_agent, policy_agent, underwriter_agent],
        tasks=[budget_task, policy_task, underwriter_task],
        verbose=True,
        process="sequential", 
    )
    
    return crew


def run_production_crew(
    facts: List[ExtractedFact],
    citations: List[Citation],
    settings: Settings,
    region_id: str,
) -> RegionPanelOutput:
    """Run unified production crew with LangGraph shared state and return RegionPanelOutput"""
    if not CREWAI_AVAILABLE or not settings.use_llm_mode or not settings.openai_api_key:
        from backend.agents.budget_analyst import BudgetAnalyst
        from backend.agents.policy_analyst import PolicyAnalyst
        from backend.agents.underwriter import Underwriter
        
        budget_analyst = BudgetAnalyst()
        policy_analyst = PolicyAnalyst()
        underwriter = Underwriter()
        
        budget_output = budget_analyst.analyze(facts, citations)
        policy_output = policy_analyst.analyze(facts, citations)
        underwriter_output = underwriter.analyze(
            budget_output,
            policy_output,
            facts,
            citations
        )
        
        from datetime import datetime
        return RegionPanelOutput(
            region_id=region_id,
            budget_analysis=budget_output,
            policy_analysis=policy_output,
            underwriter_analysis=underwriter_output,
            generated_at=datetime.utcnow().isoformat(),
        )
    
    state_manager = SharedStateManager()
    state_manager.initialize_state(region_id, facts, citations)
    
    crew = create_production_crew(facts, citations, settings, region_id)
    if not crew:
        raise ValueError("Failed to create production crew")
    
    result = crew.kickoff()
    
    budget_output = None
    policy_output = None
    underwriter_output = None
    
    try:
        result_str = str(result)
        
        budget_start = result_str.find('"funding_strength_score"')
        if budget_start > 0:
            budget_json_start = result_str.rfind('{', 0, budget_start)
            budget_json_end = result_str.find('}', budget_start) + 1
            if budget_json_start >= 0 and budget_json_end > budget_json_start:
                budget_data = json.loads(result_str[budget_json_start:budget_json_end])
                budget_output = BudgetAnalystOutput(**budget_data)
                state_manager.update_budget_output(budget_output)

        policy_start = result_str.find('"zoning_flexibility_score"')
        if policy_start > 0:
            policy_json_start = result_str.rfind('{', 0, policy_start)
            policy_json_end = result_str.find('}', policy_start) + 1
            if policy_json_start >= 0 and policy_json_end > policy_json_start:
                policy_data = json.loads(result_str[policy_json_start:policy_json_end])
                policy_output = PolicyAnalystOutput(**policy_data)
                state_manager.update_policy_output(policy_output)

        underwriter_start = result_str.find('"feasibility_score"')
        if underwriter_start > 0:
            underwriter_json_start = result_str.rfind('{', 0, underwriter_start)
            underwriter_json_end = result_str.rfind('}') + 1
            if underwriter_json_start >= 0 and underwriter_json_end > underwriter_json_start:
                underwriter_data = json.loads(result_str[underwriter_json_start:underwriter_json_end])
                underwriter_output = UnderwriterOutput(**underwriter_data)
                state_manager.update_underwriter_output(underwriter_output)

        shared_state = state_manager.get_state()
        if shared_state and shared_state["events"]:
            print(f"[LangGraph] Events: {len(shared_state['events'])} events logged")
            print(f"[LangGraph] Scores: {shared_state['scores']}")
            print(f"[LangGraph] Constraints: {len(shared_state['constraints'])} constraints")
            print(f"[LangGraph] Plan variants: {shared_state['plan_variants']}")
        
    except Exception as e:
        print(f"Error parsing production crew output: {e}, falling back to deterministic")
    
    if not (budget_output and policy_output and underwriter_output):
        from backend.agents.budget_analyst import BudgetAnalyst
        from backend.agents.policy_analyst import PolicyAnalyst
        from backend.agents.underwriter import Underwriter
        
        budget_analyst = BudgetAnalyst()
        policy_analyst = PolicyAnalyst()
        underwriter = Underwriter()
        
        if not budget_output:
            budget_output = budget_analyst.analyze(facts, citations)
        if not policy_output:
            policy_output = policy_analyst.analyze(facts, citations)
        if not underwriter_output:
            underwriter_output = underwriter.analyze(
                budget_output,
                policy_output,
                facts,
                citations
            )
    
    from datetime import datetime
    return RegionPanelOutput(
        region_id=region_id,
        budget_analysis=budget_output,
        policy_analysis=policy_output,
        underwriter_analysis=underwriter_output,
        generated_at=datetime.utcnow().isoformat(),
    )
