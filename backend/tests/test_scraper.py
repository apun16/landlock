"""Test scraper functionality"""
import pytest
from pathlib import Path
from unittest.mock import Mock, patch
import responses

from backend.scraper.discovery import SourceDiscovery
from backend.scraper.scraper import CityScraper
from backend.models.discovered_source import SourceCategory, DocumentType


@pytest.fixture
def mock_html_response():
    """Mock HTML response"""
    return """
    <!DOCTYPE html>
    <html>
    <head><title>City Budget 2024</title></head>
    <body>
        <h1>Budget 2024</h1>
        <p>Total budget: $1.5 billion</p>
        <a href="/budget/detailed">Detailed Budget</a>
        <a href="/budget/capital">Capital Budget</a>
    </body>
    </html>
    """


@pytest.mark.usefixtures("test_settings")
def test_source_discovery_can_fetch(test_settings):
    """Test that SourceDiscovery checks robots.txt"""
    discovery = SourceDiscovery(test_settings)
    assert discovery.can_fetch("https://example.com/page") is True


@pytest.mark.usefixtures("test_settings")
@responses.activate
def test_source_discovery_finds_sources(test_settings, mock_html_response):
    """Test that SourceDiscovery finds relevant sources"""
    responses.add(
        responses.GET,
        "https://example.com/budget",
        body=mock_html_response,
        status=200,
        content_type="text/html",
    )
    
    discovery = SourceDiscovery(test_settings)
    sources = discovery._discover_from_entry_point(
        "https://example.com/budget",
        SourceCategory.BUDGET,
        "test_city",
        depth=0
    )
    
    assert len(sources) > 0
    assert sources[0].category == SourceCategory.BUDGET
    assert sources[0].document_type == DocumentType.HTML


@pytest.mark.usefixtures("test_settings")
@responses.activate
def test_city_scraper_stores_documents(test_settings, tmp_path, mock_html_response):
    """Test that CityScraper stores discovered documents"""
    test_settings.raw_documents_dir = str(tmp_path / "data" / "raw")
    test_settings.data_dir = str(tmp_path / "data")
    
    responses.add(
        responses.GET,
        "https://example.com/budget",
        body=mock_html_response,
        status=200,
        content_type="text/html",
    )
    
    scraper = CityScraper(test_settings)
    
    from backend.models.discovered_source import DiscoveredSource
    
    source = DiscoveredSource(
        title="City Budget 2024",
        uri="https://example.com/budget",
        category=SourceCategory.BUDGET,
        document_type=DocumentType.HTML,
    )
    
    region_dir = Path(test_settings.raw_documents_dir) / "test_city"
    region_dir.mkdir(parents=True, exist_ok=True)
    stored_source = scraper._store_source(source, "test_city", region_dir)
    
    assert stored_source.file_hash is not None
    assert stored_source.file_path is not None
    assert region_dir.exists()
    assert any(region_dir.iterdir())  
