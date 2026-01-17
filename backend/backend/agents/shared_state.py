"""LangGraph shared state management for CrewAI agents"""
from typing import TypedDict, List, Optional, Dict

try:
    from typing import Annotated
    from langgraph.graph.message import add_messages
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    # Fallback: define Annotated without add_messages
    try:
        from typing import Annotated
    except ImportError:
        Annotated = None
    add_messages = lambda x: x  # noqa: E731

from backend.models.extracted_fact import ExtractedFact
from backend.models.citation import Citation
from backend.models.agent_outputs import (
    BudgetAnalystOutput,
    PolicyAnalystOutput,
    UnderwriterOutput,
)


class AgentState(TypedDict):
    """Shared state for LangGraph agent workflow"""
    region_id: str
    facts: List[Dict]
    citations: List[Dict]
    budget_output: Optional[Dict]
    policy_output: Optional[Dict]
    underwriter_output: Optional[Dict]
    events: List[str]  # Simplified when langgraph not available
    scores: Dict[str, Optional[int]]
    constraints: List[str]
    plan_variants: List[str]


class SharedStateManager:
    """Manages shared state for LangGraph workflow"""
    
    def __init__(self):
        self.state: Optional[AgentState] = None
    
    def initialize_state(
        self,
        region_id: str,
        facts: List[ExtractedFact],
        citations: List[Citation],
    ) -> AgentState:
        """Initialize shared state"""
        self.state = AgentState(
            region_id=region_id,
            facts=[f.model_dump() for f in facts],
            citations=[c.model_dump() for c in citations],
            budget_output=None,
            policy_output=None,
            underwriter_output=None,
            events=[],
            scores={},
            constraints=[],
            plan_variants=[],
        )
        return self.state
    
    def update_budget_output(self, output: BudgetAnalystOutput) -> None:
        """Update budget analysis output in shared state"""
        if self.state:
            self.state["budget_output"] = output.model_dump()
            self.state["events"].append("Budget analysis completed")
            if output.funding_strength_score is not None:
                self.state["scores"]["funding_strength"] = output.funding_strength_score
    
    def update_policy_output(self, output: PolicyAnalystOutput) -> None:
        """Update policy analysis output in shared state"""
        if self.state:
            self.state["policy_output"] = output.model_dump()
            self.state["events"].append("Policy analysis completed")
            if output.zoning_flexibility_score is not None:
                self.state["scores"]["zoning_flexibility"] = output.zoning_flexibility_score
            if output.proposal_momentum_score is not None:
                self.state["scores"]["proposal_momentum"] = output.proposal_momentum_score
            # Collect constraints
            if output.constraints:
                self.state["constraints"].extend(output.constraints)
    
    def update_underwriter_output(self, output: UnderwriterOutput) -> None:
        """Update underwriter output in shared state"""
        if self.state:
            self.state["underwriter_output"] = output.model_dump()
            self.state["events"].append(f"Underwriter verdict: {output.verdict}")
            if output.feasibility_score is not None:
                self.state["scores"]["feasibility"] = output.feasibility_score
            if output.plan_variant != "unknown":
                self.state["plan_variants"].append(output.plan_variant)
            # Collect constraints from pros/cons
            for pro in output.pros:
                if "description" in pro:
                    self.state["events"].append(f"Pro: {pro['description']}")
            for con in output.cons:
                if "description" in con:
                    self.state["events"].append(f"Con: {con['description']}")
                if "description" in con and con["description"] not in self.state["constraints"]:
                    self.state["constraints"].append(con["description"])
    
    def get_state(self) -> Optional[AgentState]:
        """Get current shared state"""
        return self.state
    
    def add_event(self, event: str) -> None:
        """Add an event to the state"""
        if self.state:
            self.state["events"].append(event)
    
    def add_score(self, name: str, value: Optional[int]) -> None:
        """Add a score to the state"""
        if self.state:
            self.state["scores"][name] = value
    
    def add_constraint(self, constraint: str) -> None:
        """Add a constraint to the state"""
        if self.state and constraint not in self.state["constraints"]:
            self.state["constraints"].append(constraint)
    
    def add_plan_variant(self, variant: str) -> None:
        """Add a plan variant to the state"""
        if self.state and variant not in self.state["plan_variants"]:
            self.state["plan_variants"].append(variant)
