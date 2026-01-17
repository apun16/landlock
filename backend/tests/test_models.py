"""Test data model validation"""
import pytest
from datetime import datetime

from backend.models.citation import Citation
from backend.models.extracted_fact import ExtractedFact, FactType
from backend.models.discovered_source import DiscoveredSource, SourceCategory, DocumentType


def test_citation_model():
    """Test Citation model"""
    citation = Citation(
        id="cite_001",
        title="Test Source",
        uri="https://example.com/test",
        locator="Page 1",
    )
    assert citation.id == "cite_001"
    assert citation.locator == "Page 1"


def test_extracted_fact_requires_citations():
    """Test that facts with values must have citations"""
    fact_with_value = ExtractedFact(
        id="fact_001",
        region_id="test",
        fact_type=FactType.BUDGET,
        key="test_key",
        value=100,
        citation_ids=[],
    )
    
    with pytest.raises(ValueError, match="no citations"):
        fact_with_value.model_validate_citations()
    
    fact_with_citations = ExtractedFact(
        id="fact_002",
        region_id="test",
        fact_type=FactType.BUDGET,
        key="test_key",
        value=100,
        citation_ids=["cite_001"],
    )
    fact_with_citations.model_validate_citations()


def test_extracted_fact_null_value_allowed():
    """Test that facts with null values can have no citations (if marked as missing)"""
    fact_null = ExtractedFact(
        id="fact_003",
        region_id="test",
        fact_type=FactType.BUDGET,
        key="test_key",
        value=None,
        citation_ids=[],
        missing_reason="Data not found in sources",
    )
    fact_null.model_validate_citations()


def test_discovered_source_model():
    """Test DiscoveredSource model"""
    source = DiscoveredSource(
        title="Test",
        uri="https://example.com",
        category=SourceCategory.BUDGET,
        document_type=DocumentType.HTML,
    )
    assert source.category == SourceCategory.BUDGET
    assert source.file_hash is None


def test_agent_outputs_validation():
    """Test agent output models"""
    from backend.models.agent_outputs import (
        BudgetAnalystOutput,
        PolicyAnalystOutput,
        UnderwriterOutput,
    )
    
    budget_output = BudgetAnalystOutput(
        funding_strength_score=75,
        confidence=0.8,
        evidence_count=5,
        citation_ids=["cite_001"],
    )
    assert budget_output.funding_strength_score == 75
    assert budget_output.confidence == 0.8
    
    policy_output = PolicyAnalystOutput(
        zoning_flexibility_score=60,
        proposal_momentum_score=70,
        confidence=0.7,
        evidence_count=3,
        citation_ids=["cite_002"],
    )
    assert policy_output.zoning_flexibility_score == 60
    
    underwriter_output = UnderwriterOutput(
        feasibility_score=65,
        verdict="caution",
        plan_variant="B",
        confidence=0.75,
        evidence_count=10,
        citation_ids=["cite_001", "cite_002"],
        pros=[{
            "description": "Strong budget allocation",
            "supporting_fact_ids": ["fact_001"],
            "citation_ids": ["cite_001"],
        }],
        cons=[{
            "description": "Zoning restrictions",
            "supporting_fact_ids": ["fact_002"],
            "citation_ids": ["cite_002"],
        }],
    )
    assert underwriter_output.verdict == "caution"
    underwriter_output.validate_pros_cons()
