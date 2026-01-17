"""Agent output models - strict JSON contracts"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class BudgetAnalystOutput(BaseModel):
    """Budget Analyst agent output"""
    
    funding_strength_score: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Funding strength score 0-100 (null if insufficient data)"
    )
    key_allocations: List[dict] = Field(
        default_factory=list,
        description="Key budget allocations with citations"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence in analysis (0.0-1.0)"
    )
    evidence_count: int = Field(
        ...,
        ge=0,
        description="Number of supporting facts used"
    )
    citation_ids: List[str] = Field(
        default_factory=list,
        description="All citation IDs referenced in this output"
    )


class PolicyAnalystOutput(BaseModel):
    """Policy Analyst agent output"""
    
    zoning_flexibility_score: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Zoning flexibility score 0-100 (null if insufficient data)"
    )
    proposal_momentum_score: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Proposal momentum score 0-100 (null if insufficient data)"
    )
    approval_friction_factors: List[str] = Field(
        default_factory=list,
        description="Identified friction factors"
    )
    constraints: List[str] = Field(
        default_factory=list,
        description="Identified constraints"
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence_count: int = Field(..., ge=0)
    citation_ids: List[str] = Field(default_factory=list)


class UnderwriterOutput(BaseModel):
    """Underwriter agent output"""
    
    feasibility_score: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Feasibility score 0-100 (null if insufficient data)"
    )
    verdict: Literal["go", "caution", "avoid", "unknown"] = Field(
        ...,
        description="Development verdict"
    )
    plan_variant: Literal["A", "B", "C", "unknown"] = Field(
        ...,
        description="Recommended plan variant"
    )
    pros: List[dict] = Field(
        default_factory=list,
        description="Pros, each with supporting_fact_ids and citation_ids"
    )
    cons: List[dict] = Field(
        default_factory=list,
        description="Cons, each with supporting_fact_ids and citation_ids"
    )
    constraints: List[dict] = Field(
        default_factory=list,
        description="Constraints, each with supporting_fact_ids and citation_ids"
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence_count: int = Field(..., ge=0)
    citation_ids: List[str] = Field(default_factory=list)
    
    def validate_pros_cons(self) -> None:
        """Validate that pros/cons have required fields"""
        for pro in self.pros:
            if "supporting_fact_ids" not in pro or "citation_ids" not in pro:
                raise ValueError("All pros must have supporting_fact_ids and citation_ids")
        for con in self.cons:
            if "supporting_fact_ids" not in con or "citation_ids" not in con:
                raise ValueError("All cons must have supporting_fact_ids and citation_ids")


class RegionPanelOutput(BaseModel):
    """Final output for a region's left panel"""
    
    region_id: str = Field(..., description="Region identifier")
    budget_analysis: BudgetAnalystOutput
    policy_analysis: PolicyAnalystOutput
    underwriter_analysis: UnderwriterOutput
    generated_at: str = Field(..., description="ISO timestamp of generation")
