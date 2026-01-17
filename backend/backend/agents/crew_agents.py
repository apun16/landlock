"""CrewAI agent implementations"""
from typing import List, Optional
import json

from backend.models.extracted_fact import ExtractedFact, FactType
from backend.models.agent_outputs import (
    BudgetAnalystOutput,
    PolicyAnalystOutput,
    UnderwriterOutput,
)
from backend.models.citation import Citation
from backend.config import Settings

try:
    from crewai import Agent, Task, Crew
    from langchain_openai import ChatOpenAI
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False


def create_budget_analyst_agent(llm: Optional[ChatOpenAI] = None) -> Optional[Agent]:
    """Create Budget Analyst CrewAI agent"""
    if not CREWAI_AVAILABLE:
        return None
    
    return Agent(
        role="Budget Analyst",
        goal="Analyze budget facts and determine funding strength score (0-100) for the region",
        backstory="""You are an expert budget analyst specializing in municipal and regional 
        financial analysis. You analyze budget documents, funding allocations, and financial 
        data to assess the funding strength of development projects. Your analysis must be 
        based ONLY on extracted facts with citations - you cannot invent or assume any data.""",
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


def create_policy_analyst_agent(llm: Optional[ChatOpenAI] = None) -> Optional[Agent]:
    """Create Policy Analyst CrewAI agent"""
    if not CREWAI_AVAILABLE:
        return None
    
    return Agent(
        role="Policy Analyst",
        goal="Analyze zoning and proposal facts to determine zoning flexibility and proposal momentum scores",
        backstory="""You are an expert policy analyst specializing in municipal planning, 
        zoning regulations, and development proposals. You analyze zoning bylaws, planning 
        policies, and development applications to assess regulatory flexibility and approval 
        momentum. Your analysis must be based ONLY on extracted facts with citations - you 
        cannot invent or assume any data.""",
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


def create_underwriter_agent(llm: Optional[ChatOpenAI] = None) -> Optional[Agent]:
    """Create Underwriter CrewAI agent"""
    if not CREWAI_AVAILABLE:
        return None
    
    return Agent(
        role="Underwriter",
        goal="Evaluate development feasibility based on budget and policy analysis, providing verdict (go/caution/avoid/unknown) and plan variant",
        backstory="""You are an expert underwriter specializing in development feasibility 
        assessment. You evaluate all factors including budget strength, zoning flexibility, 
        and proposal momentum to make informed decisions about development projects. You must 
        provide clear pros, cons, and constraints, each referencing specific fact IDs and 
        citations. Your analysis must be based ONLY on provided facts - you cannot invent data.""",
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


def analyze_with_crewai_budget_analyst(
    facts: List[ExtractedFact],
    citations: List[Citation],
    settings: Settings,
) -> BudgetAnalystOutput:
    """Analyze budget facts using CrewAI Budget Analyst agent"""
    if not CREWAI_AVAILABLE or not settings.use_llm_mode or not settings.openai_api_key:
        # Fallback to deterministic
        from backend.agents.budget_analyst import BudgetAnalyst
        analyst = BudgetAnalyst()
        return analyst.analyze(facts, citations)
    
    budget_facts = [f for f in facts if f.fact_type == FactType.BUDGET]
    
    if not budget_facts:
        return BudgetAnalystOutput(
            funding_strength_score=None,
            key_allocations=[],
            confidence=0.0,
            evidence_count=0,
            citation_ids=[],
        )
    
    # Prepare context
    facts_json = json.dumps([f.model_dump() for f in budget_facts], default=str)
    citations_json = json.dumps([c.model_dump() for c in citations], default=str)
    
    # Create agent and task
    llm = ChatOpenAI(model="gpt-4", temperature=0, api_key=settings.openai_api_key)
    agent = create_budget_analyst_agent(llm)
    
    task = Task(
        description=f"""Analyze the following budget facts and produce a BudgetAnalystOutput in JSON format.

FACTS (with citations):
{facts_json}

CITATIONS:
{citations_json}

Requirements:
1. Calculate funding_strength_score (0-100 integer or null if insufficient data)
2. List key_allocations with citation_ids
3. Calculate confidence (0.0-1.0) based on evidence quality
4. Count evidence_count (number of facts used)
5. List all citation_ids referenced
6. Output must be valid JSON matching BudgetAnalystOutput schema
7. You MUST only use facts provided - do not invent data

Output format (JSON):
{{
    "funding_strength_score": <int or null>,
    "key_allocations": [{{"key": "...", "value": "...", "unit": "...", "timeframe": "...", "citation_ids": [...]}}],
    "confidence": <float 0.0-1.0>,
    "evidence_count": <int>,
    "citation_ids": ["cite_001", ...]
}}""",
        agent=agent,
        expected_output="JSON object matching BudgetAnalystOutput schema",
    )
    
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True,
    )
    
    result = crew.kickoff()
    
    # Parse result and create output
    try:
        # Extract JSON from result
        result_str = str(result)
        # Try to find JSON in the output
        json_start = result_str.find('{')
        json_end = result_str.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            output_data = json.loads(result_str[json_start:json_end])
            return BudgetAnalystOutput(**output_data)
    except Exception as e:
        print(f"Error parsing CrewAI output: {e}, falling back to deterministic")
    
    # Fallback to deterministic
    from backend.agents.budget_analyst import BudgetAnalyst
    analyst = BudgetAnalyst()
    return analyst.analyze(facts, citations)


def analyze_with_crewai_policy_analyst(
    facts: List[ExtractedFact],
    citations: List[Citation],
    settings: Settings,
) -> PolicyAnalystOutput:
    """Analyze policy facts using CrewAI Policy Analyst agent"""
    if not CREWAI_AVAILABLE or not settings.use_llm_mode or not settings.openai_api_key:
        # Fallback to deterministic
        from backend.agents.policy_analyst import PolicyAnalyst
        analyst = PolicyAnalyst()
        return analyst.analyze(facts, citations)
    
    zoning_facts = [f for f in facts if f.fact_type == FactType.ZONING]
    proposal_facts = [f for f in facts if f.fact_type == FactType.PROPOSAL]
    
    # Prepare context
    facts_json = json.dumps(
        [f.model_dump() for f in zoning_facts + proposal_facts], 
        default=str
    )
    citations_json = json.dumps([c.model_dump() for c in citations], default=str)
    
    # Create agent and task
    llm = ChatOpenAI(model="gpt-4", temperature=0, api_key=settings.openai_api_key)
    agent = create_policy_analyst_agent(llm)
    
    task = Task(
        description=f"""Analyze the following zoning and proposal facts and produce a PolicyAnalystOutput in JSON format.

FACTS (with citations):
{facts_json}

CITATIONS:
{citations_json}

Requirements:
1. Calculate zoning_flexibility_score (0-100 integer or null)
2. Calculate proposal_momentum_score (0-100 integer or null)
3. List approval_friction_factors (array of strings)
4. List constraints (array of strings)
5. Calculate confidence (0.0-1.0)
6. Count evidence_count
7. List all citation_ids referenced
8. Output must be valid JSON matching PolicyAnalystOutput schema
9. You MUST only use facts provided - do not invent data

Output format (JSON):
{{
    "zoning_flexibility_score": <int or null>,
    "proposal_momentum_score": <int or null>,
    "approval_friction_factors": ["...", ...],
    "constraints": ["...", ...],
    "confidence": <float 0.0-1.0>,
    "evidence_count": <int>,
    "citation_ids": ["cite_001", ...]
}}""",
        agent=agent,
        expected_output="JSON object matching PolicyAnalystOutput schema",
    )
    
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True,
    )
    
    result = crew.kickoff()
    
    # Parse result
    try:
        result_str = str(result)
        json_start = result_str.find('{')
        json_end = result_str.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            output_data = json.loads(result_str[json_start:json_end])
            return PolicyAnalystOutput(**output_data)
    except Exception as e:
        print(f"Error parsing CrewAI output: {e}, falling back to deterministic")
    
    # Fallback to deterministic
    from backend.agents.policy_analyst import PolicyAnalyst
    analyst = PolicyAnalyst()
    return analyst.analyze(facts, citations)


def analyze_with_crewai_underwriter(
    budget_output: BudgetAnalystOutput,
    policy_output: PolicyAnalystOutput,
    facts: List[ExtractedFact],
    citations: List[Citation],
    settings: Settings,
) -> UnderwriterOutput:
    """Analyze using CrewAI Underwriter agent"""
    if not CREWAI_AVAILABLE or not settings.use_llm_mode or not settings.openai_api_key:
        # Fallback to deterministic
        from backend.agents.underwriter import Underwriter
        underwriter = Underwriter()
        return underwriter.analyze(budget_output, policy_output, facts, citations)
    
    # Prepare context
    budget_json = json.dumps(budget_output.model_dump(), default=str)
    policy_json = json.dumps(policy_output.model_dump(), default=str)
    facts_json = json.dumps([f.model_dump() for f in facts], default=str)
    citations_json = json.dumps([c.model_dump() for c in citations], default=str)
    
    # Create agent and task
    llm = ChatOpenAI(model="gpt-4", temperature=0, api_key=settings.openai_api_key)
    agent = create_underwriter_agent(llm)
    
    task = Task(
        description=f"""Evaluate development feasibility based on the following analysis and produce an UnderwriterOutput in JSON format.

BUDGET ANALYSIS:
{budget_json}

POLICY ANALYSIS:
{policy_json}

ALL FACTS:
{facts_json}

CITATIONS:
{citations_json}

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
12. EVERY pro/con/constraint MUST reference specific fact IDs and citation IDs

Output format (JSON):
{{
    "feasibility_score": <int or null>,
    "verdict": "go|caution|avoid|unknown",
    "plan_variant": "A|B|C|unknown",
    "pros": [{{"description": "...", "supporting_fact_ids": [...], "citation_ids": [...]}}],
    "cons": [{{"description": "...", "supporting_fact_ids": [...], "citation_ids": [...]}}],
    "constraints": [{{"description": "...", "supporting_fact_ids": [...], "citation_ids": [...]}}],
    "confidence": <float 0.0-1.0>,
    "evidence_count": <int>,
    "citation_ids": ["cite_001", ...]
}}""",
        agent=agent,
        expected_output="JSON object matching UnderwriterOutput schema",
    )
    
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True,
    )
    
    result = crew.kickoff()
    
    # Parse result
    try:
        result_str = str(result)
        json_start = result_str.find('{')
        json_end = result_str.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            output_data = json.loads(result_str[json_start:json_end])
            return UnderwriterOutput(**output_data)
    except Exception as e:
        print(f"Error parsing CrewAI output: {e}, falling back to deterministic")
    
    # Fallback to deterministic
    from backend.agents.underwriter import Underwriter
    underwriter = Underwriter()
    return underwriter.analyze(budget_output, policy_output, facts, citations)
