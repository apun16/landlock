#!/usr/bin/env python3
"""Basic test script to verify backend works without full dependencies"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all modules can be imported"""
    print("Testing imports...")
    
    try:
        from backend.config import Settings
        print("✓ Settings imported")
        
        from backend.models.citation import Citation
        from backend.models.discovered_source import DiscoveredSource, SourceCategory, DocumentType
        from backend.models.extracted_fact import ExtractedFact, FactType
        print("✓ Models imported")
        
        from backend.models.agent_outputs import (
            BudgetAnalystOutput,
            PolicyAnalystOutput,
            UnderwriterOutput,
        )
        print("✓ Agent outputs imported")
        
        from backend.scraper.scraper import CityScraper
        from backend.scraper.discovery import SourceDiscovery
        print("✓ Scraper imported")
        
        from backend.storage.source_registry import SourceRegistry
        print("✓ Storage imported")
        
        from backend.extractors.fact_extractor import FactExtractor
        print("✓ Extractors imported")
        
        from backend.agents.budget_analyst import BudgetAnalyst
        from backend.agents.policy_analyst import PolicyAnalyst
        from backend.agents.underwriter import Underwriter
        print("✓ Agents imported")
        
        from backend.pipeline.runner import PipelineRunner
        print("✓ Pipeline imported")
        
        return True
    except ImportError as e:
        print(f"✗ Import failed: {e}")
        return False


def test_models():
    """Test that models work correctly"""
    print("\nTesting models...")
    
    try:
        from backend.models.citation import Citation
        from backend.models.discovered_source import DiscoveredSource, SourceCategory, DocumentType
        from backend.models.extracted_fact import ExtractedFact, FactType
        
        # Test Citation
        citation = Citation(
            id="cite_001",
            title="Test Source",
            uri="https://example.com/test"
        )
        assert citation.id == "cite_001"
        print("✓ Citation model works")
        
        # Test DiscoveredSource
        source = DiscoveredSource(
            title="Test",
            uri="https://example.com",
            category=SourceCategory.BUDGET,
            document_type=DocumentType.HTML,
        )
        assert source.category == SourceCategory.BUDGET
        print("✓ DiscoveredSource model works")
        
        # Test ExtractedFact with citation
        fact = ExtractedFact(
            id="fact_001",
            region_id="test",
            fact_type=FactType.BUDGET,
            key="test_key",
            value=100,
            citation_ids=["cite_001"],
        )
        fact.model_validate_citations()  # Should not raise
        print("✓ ExtractedFact with citations works")
        
        # Test ExtractedFact without citation should raise
        fact_no_cite = ExtractedFact(
            id="fact_002",
            region_id="test",
            fact_type=FactType.BUDGET,
            key="test_key",
            value=100,
            citation_ids=[],
        )
        try:
            fact_no_cite.model_validate_citations()
            print("✗ ExtractedFact validation should have failed")
            return False
        except ValueError:
            print("✓ ExtractedFact validation correctly requires citations")
        
        return True
    except Exception as e:
        print(f"✗ Model test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_agents():
    """Test that agents work"""
    print("\nTesting agents...")
    
    try:
        from backend.agents.budget_analyst import BudgetAnalyst
        from backend.agents.policy_analyst import PolicyAnalyst
        from backend.agents.underwriter import Underwriter
        from backend.models.extracted_fact import ExtractedFact, FactType
        from backend.models.citation import Citation
        
        # Test BudgetAnalyst
        analyst = BudgetAnalyst()
        output = analyst.analyze([], [])
        assert output.funding_strength_score is None
        assert output.confidence == 0.0
        print("✓ BudgetAnalyst works (empty input)")
        
        # Test with facts
        citation = Citation(id="cite_001", title="Test", uri="https://example.com")
        facts = [
            ExtractedFact(
                id="fact_001",
                region_id="test",
                fact_type=FactType.BUDGET,
                key="budget",
                value="$100",
                citation_ids=["cite_001"]
            ),
        ]
        output = analyst.analyze(facts, [citation])
        assert output.evidence_count == 1
        print("✓ BudgetAnalyst works (with facts)")
        
        # Test PolicyAnalyst
        policy_analyst = PolicyAnalyst()
        output = policy_analyst.analyze([], [])
        assert output.zoning_flexibility_score is None
        print("✓ PolicyAnalyst works")
        
        # Test Underwriter
        underwriter = Underwriter()
        from backend.models.agent_outputs import BudgetAnalystOutput, PolicyAnalystOutput
        
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
        
        output = underwriter.analyze(budget_output, policy_output, facts, [citation])
        assert output.verdict in ["go", "caution", "avoid", "unknown"]
        print("✓ Underwriter works")
        
        return True
    except Exception as e:
        print(f"✗ Agent test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all basic tests"""
    print("=" * 60)
    print("Landlock Backend - Basic Verification Test")
    print("=" * 60)
    
    results = []
    results.append(("Imports", test_imports()))
    results.append(("Models", test_models()))
    results.append(("Agents", test_agents()))
    
    print("\n" + "=" * 60)
    print("Results:")
    print("=" * 60)
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name:20} {status}")
    
    all_passed = all(result[1] for result in results)
    print("=" * 60)
    if all_passed:
        print("✓ All basic tests passed!")
        return 0
    else:
        print("✗ Some tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
