"""Test source registry"""
import pytest
from pathlib import Path
import json

from backend.storage.source_registry import SourceRegistry
from backend.models.discovered_source import DiscoveredSource, SourceCategory, DocumentType


@pytest.mark.usefixtures("test_settings")
def test_source_registry_add_get(test_settings, sample_discovered_source):
    """Test adding and retrieving sources"""
    registry = SourceRegistry(test_settings)
    
    # Modify source to have a file_path with region_id
    sample_discovered_source.file_path = f"data/raw/test_region/test_file.html"
    
    # Add source
    registry.add_source(sample_discovered_source)
    
    # Should be able to retrieve
    assert Path(test_settings.sources_registry_path).exists()
    
    # Get sources by region
    sources = registry.get_sources_by_region("test_region")
    assert len(sources) > 0
    assert sources[0].title == sample_discovered_source.title


@pytest.mark.usefixtures("test_settings")
def test_source_registry_get_by_category(test_settings):
    """Test getting sources by category"""
    registry = SourceRegistry(test_settings)
    
    budget_source = DiscoveredSource(
        title="Budget",
        uri="https://example.com/budget",
        category=SourceCategory.BUDGET,
        document_type=DocumentType.HTML,
        file_path="data/raw/test/budget.html"
    )
    
    zoning_source = DiscoveredSource(
        title="Zoning",
        uri="https://example.com/zoning",
        category=SourceCategory.ZONING,
        document_type=DocumentType.HTML,
        file_path="data/raw/test/zoning.html"
    )
    
    registry.add_source(budget_source)
    registry.add_source(zoning_source)
    
    budget_sources = registry.get_sources_by_category("budget")
    assert len(budget_sources) > 0
    assert all(s.category == SourceCategory.BUDGET for s in budget_sources)
