"""Pytest fixtures"""
import pytest
from pathlib import Path
from backend.config import Settings


@pytest.fixture
def test_settings(tmp_path):
    """Test settings with temporary data directory"""
    return Settings(
        data_dir=str(tmp_path / "data"),
        raw_documents_dir=str(tmp_path / "data" / "raw"),
        sources_registry_path=str(tmp_path / "data" / "sources_registry.jsonl"),
        scrape_rate_limit_seconds=0.1,
    )


@pytest.fixture
def sample_html():
    """Sample HTML for testing"""
    return """
    <!DOCTYPE html>
    <html>
    <head><title>City Budget 2024</title></head>
    <body>
        <h1>Budget 2024</h1>
        <p>Total budget: $1.5 billion</p>
        <a href="/budget/detailed">Detailed Budget</a>
    </body>
    </html>
    """


@pytest.fixture
def sample_discovered_source():
    """Sample discovered source for testing"""
    from backend.models.discovered_source import DiscoveredSource, SourceCategory, DocumentType
    from datetime import datetime
    
    return DiscoveredSource(
        title="City Budget 2024",
        uri="https://example.com/budget/2024",
        category=SourceCategory.BUDGET,
        document_type=DocumentType.HTML,
        retrieved_at=datetime.utcnow(),
    )
