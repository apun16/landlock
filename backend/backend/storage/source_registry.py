"""Source registry - tracks all discovered sources"""
import json
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from backend.models.discovered_source import DiscoveredSource
from backend.config import Settings


class SourceRegistry:
    """Registry for tracking discovered sources"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.registry_path = Path(settings.sources_registry_path)
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
    
    def add_source(self, source: DiscoveredSource) -> None:
        """Add a source to the registry (JSONL format)"""
        with open(self.registry_path, "a", encoding="utf-8") as f:
            json.dump(source.model_dump(mode="json"), f, default=str)
            f.write("\n")
    
    def add_sources(self, sources: List[DiscoveredSource]) -> None:
        """Add multiple sources to the registry"""
        for source in sources:
            self.add_source(source)
    
    def get_sources_by_region(
        self,
        region_id: str
    ) -> List[DiscoveredSource]:
        """Get all sources for a region"""
        if not self.registry_path.exists():
            return []
        
        sources: List[DiscoveredSource] = []
        with open(self.registry_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                data = json.loads(line)
                # Filter by region_id (inferred from file_path)
                file_path = data.get("file_path", "")
                if region_id in file_path:
                    sources.append(DiscoveredSource(**data))
        
        return sources
    
    def get_sources_by_category(
        self,
        category: str,
        region_id: Optional[str] = None
    ) -> List[DiscoveredSource]:
        """Get sources by category, optionally filtered by region"""
        if not self.registry_path.exists():
            return []
        
        sources: List[DiscoveredSource] = []
        with open(self.registry_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                data = json.loads(line)
                if data.get("category") != category:
                    continue
                if region_id:
                    file_path = data.get("file_path", "")
                    if region_id not in file_path:
                        continue
                sources.append(DiscoveredSource(**data))
        
        return sources
    
    def get_all_sources(self) -> List[DiscoveredSource]:
        """Get all sources in the registry"""
        if not self.registry_path.exists():
            return []
        
        sources: List[DiscoveredSource] = []
        with open(self.registry_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                data = json.loads(line)
                sources.append(DiscoveredSource(**data))
        
        return sources
