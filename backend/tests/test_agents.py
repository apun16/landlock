"""Test agent logic"""
import pytest
from backend.agents.budget_analyst import BudgetAnalyst
from backend.agents.policy_analyst import PolicyAnalyst
from backend.agents.underwriter import Underwriter
from backend.models.extracted_fact import ExtractedFact, FactType
from backend.models.citation import Citation
from backend.models.agent_outputs import BudgetAnalystOutput, PolicyAnalystOutput


def test_budget_analyst_empty():
    """Test BudgetAnalyst with no facts"""
    analyst = BudgetAnalyst()
    output = analyst.analyze([], [])
    
    assert output.funding_strength_score is None
    assert output.confidence == 0.0
    assert output.evidence_count == 0


def test_budget_analyst_with_facts():
    """Test BudgetAnalyst with budget facts"""
    analyst = BudgetAnalyst()
    
    citation = Citation(
        id="cite_001",
        title="Test Budget",
        uri="https://example.com/budget"
    )
    
    facts = [
        ExtractedFact(
            id="fact_001",
            region_id="test",
            fact_type=FactType.BUDGET,
            key="budget_total",
            value="$1.5 billion",
            citation_ids=["cite_001"]
        ),
        ExtractedFact(
            id="fact_002",
            region_id="test",
            fact_type=FactType.BUDGET,
            key="budget_year",
            value="2024",
            citation_ids=["cite_001"]
        ),
    ]
    
    output = analyst.analyze(facts, [citation])
    
    assert output.funding_strength_score is not None
    assert output.confidence > 0
    assert output.evidence_count == 2
    assert "cite_001" in output.citation_ids


def test_policy_analyst_with_facts():
    """Test PolicyAnalyst with zoning and proposal facts"""
    analyst = PolicyAnalyst()
    
    citation = Citation(
        id="cite_001",
        title="Test Zoning",
        uri="https://example.com/zoning"
    )
    
    facts = [
        ExtractedFact(
            id="fact_001",
            region_id="test",
            fact_type=FactType.ZONING,
            key="zoning_code",
            value="RS-1",
            citation_ids=["cite_001"]
        ),
        ExtractedFact(
            id="fact_002",
            region_id="test",
            fact_type=FactType.ZONING,
            key="zoning_code",
            value="C-2",
            citation_ids=["cite_001"]
        ),
        ExtractedFact(
            id="fact_003",
            region_id="test",
            fact_type=FactType.PROPOSAL,
            key="proposal_status",
            value="approved",
            citation_ids=["cite_001"]
        ),
    ]
    
    output = analyst.analyze(facts, [citation])
    
    assert output.zoning_flexibility_score is not None
    assert output.confidence > 0
    assert output.evidence_count == 3


def test_underwriter_requires_citations():
    """Test that Underwriter output includes citations"""
    underwriter = Underwriter()
    
    budget_output = BudgetAnalystOutput(
        funding_strength_score=75,
        confidence=0.8,
        evidence_count=5,
        citation_ids=["cite_001"],
    )
    
    policy_output = PolicyAnalystOutput(
        zoning_flexibility_score=60,
        proposal_momentum_score=70,
        confidence=0.7,
        evidence_count=3,
        citation_ids=["cite_002"],
    )
    
    citation = Citation(
        id="cite_001",
        title="Test",
        uri="https://example.com"
    )
    
    facts = [
        ExtractedFact(
            id="fact_001",
            region_id="test",
            fact_type=FactType.BUDGET,
            key="budget",
            value=100,
            citation_ids=["cite_001"]
        ),
    ]
    
    output = underwriter.analyze(budget_output, policy_output, facts, [citation])
    
    assert output.verdict in ["go", "caution", "avoid", "unknown"]
    assert output.plan_variant in ["A", "B", "C", "unknown"]
    assert len(output.citation_ids) > 0
    
    # Validate pros/cons have required fields
    output.validate_pros_cons()  # Should not raise
