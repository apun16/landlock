"""Test fact extraction"""
import pytest
from pathlib import Path

from backend.extractors.fact_extractor import FactExtractor
from backend.models.discovered_source import DiscoveredSource, SourceCategory, DocumentType


@pytest.mark.usefixtures("test_settings")
def test_fact_extractor_budget(test_settings, tmp_path):
    """Test extracting budget facts from HTML"""
    # Create a test HTML file
    test_file = tmp_path / "budget.html"
    test_file.write_text("""
    <html>
    <head><title>City Budget 2024</title></head>
    <body>
        <h1>Budget 2024</h1>
        <p>Total budget: $1.5 billion CAD</p>
        <p>Capital budget: $500 million</p>
    </body>
    </html>
    """)
    
    test_settings.data_dir = str(tmp_path)
    
    source = DiscoveredSource(
        title="City Budget 2024",
        uri="https://example.com/budget",
        category=SourceCategory.BUDGET,
        document_type=DocumentType.HTML,
        file_path=str(test_file.relative_to(tmp_path))
    )
    
    extractor = FactExtractor(test_settings)
    citations, facts = extractor.extract_facts_from_sources([source], "test_region")
    
    assert len(citations) == 1
    assert len(facts) > 0
    assert any(f.fact_type.value == "budget" for f in facts)
    assert all(f.citation_ids for f in facts if f.value)  # All facts with values have citations


@pytest.mark.usefixtures("test_settings")
def test_fact_extractor_zoning(test_settings, tmp_path):
    """Test extracting zoning facts from HTML"""
    test_file = tmp_path / "zoning.html"
    test_file.write_text("""
    <html>
    <head><title>Zoning Bylaw</title></head>
    <body>
        <h1>Zoning Regulations</h1>
        <p>RS-1: Single Family Residential</p>
        <p>C-2: Commercial District</p>
        <p>M-3: Industrial Zone</p>
    </body>
    </html>
    """)
    
    test_settings.data_dir = str(tmp_path)
    
    source = DiscoveredSource(
        title="Zoning Bylaw",
        uri="https://example.com/zoning",
        category=SourceCategory.ZONING,
        document_type=DocumentType.HTML,
        file_path=str(test_file.relative_to(tmp_path))
    )
    
    extractor = FactExtractor(test_settings)
    citations, facts = extractor.extract_facts_from_sources([source], "test_region")
    
    assert len(citations) == 1
    assert len(facts) > 0
    assert any(f.fact_type.value == "zoning" for f in facts)
    assert any("RS-1" in str(f.value) or "C-2" in str(f.value) for f in facts)
