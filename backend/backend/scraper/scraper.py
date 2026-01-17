"""Main scraper class - orchestrates discovery and document storage"""
import hashlib
import os
from pathlib import Path
from typing import List, Dict
from datetime import datetime

import requests

from backend.models.discovered_source import DiscoveredSource, SourceCategory
from backend.scraper.discovery import SourceDiscovery
from backend.config import Settings


class CityScraper:
    """Scrapes and stores documents for a city"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.discovery = SourceDiscovery(settings)
        self._ensure_data_dirs()
    
    def _ensure_data_dirs(self) -> None:
        """Ensure data directories exist"""
        raw_dir = Path(self.settings.raw_documents_dir)
        raw_dir.mkdir(parents=True, exist_ok=True)
    
    def scrape_city(
        self,
        region_id: str,
        base_url: str,
        known_entry_points: Dict[SourceCategory, List[str]]
    ) -> List[DiscoveredSource]:
        """
        Scrape a city and store all discovered documents
        
        Args:
            region_id: Region identifier (e.g., "vancouver")
            base_url: Base URL of city website
            known_entry_points: Dict mapping SourceCategory to list of entry URLs
        
        Returns:
            List of discovered sources with file_path and file_hash populated
        """
        # Discover sources
        discovered = self.discovery.discover_from_city(
            base_url,
            region_id,
            known_entry_points
        )
        
        # Download and store each source
        region_dir = Path(self.settings.raw_documents_dir) / region_id
        region_dir.mkdir(parents=True, exist_ok=True)
        
        stored_sources: List[DiscoveredSource] = []
        
        for source in discovered:
            stored_source = self._store_source(source, region_id, region_dir)
            stored_sources.append(stored_source)
        
        return stored_sources
    
    def _store_source(
        self,
        source: DiscoveredSource,
        region_id: str,
        region_dir: Path
    ) -> DiscoveredSource:
        """Download and store a source document"""
        try:
            resp = requests.get(
                str(source.uri),
                timeout=self.settings.scrape_timeout_seconds,
                headers={"User-Agent": "LandlockBot/1.0"}
            )
            resp.raise_for_status()
            
            content = resp.content
            
            # Generate hash
            file_hash = hashlib.sha256(content).hexdigest()
            
            # Determine file extension
            ext_map = {
                "html": ".html",
                "pdf": ".pdf",
                "rss": ".xml",
                "api": ".json",
            }
            ext = ext_map.get(source.document_type.value, ".txt")
            
            # Generate safe filename
            safe_title = "".join(
                c if c.isalnum() or c in ("-", "_") else "_"
                for c in source.title
            )[:100]
            filename = f"{safe_title}_{file_hash[:8]}{ext}"
            file_path = region_dir / filename
            
            # Write file
            file_path.write_bytes(content)
            
            # Update source
            source.file_hash = file_hash
            source.file_path = str(file_path.relative_to(Path(self.settings.data_dir)))
            
            return source
            
        except Exception as e:
            print(f"Error storing source {source.uri}: {e}")
            # Return source without file_path/hash on error
            return source
