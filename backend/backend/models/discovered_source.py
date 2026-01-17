"""DiscoveredSource model - raw sources discovered by scraper"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, HttpUrl, Field


class DocumentType(str, Enum):
    """Type of document discovered"""
    HTML = "html"
    PDF = "pdf"
    RSS = "rss"
    API = "api"


class SourceCategory(str, Enum):
    """Category of source"""
    BUDGET = "budget"
    ZONING = "zoning"
    PROPOSALS = "proposals"
    ANALYTICS = "analytics"


class DiscoveredSource(BaseModel):
    """A source discovered by the web scraper"""
    
    title: str = Field(..., description="Source title")
    uri: HttpUrl = Field(..., description="Source URI")
    category: SourceCategory = Field(..., description="Source category")
    document_type: DocumentType = Field(..., description="Document type")
    retrieved_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="When this source was retrieved"
    )
    file_hash: Optional[str] = Field(
        None,
        description="SHA256 hash of the raw document content"
    )
    file_path: Optional[str] = Field(
        None,
        description="Local path to stored raw document"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "City of Vancouver 2024 Budget",
                "uri": "https://vancouver.ca/budget/2024",
                "category": "budget",
                "document_type": "html",
                "retrieved_at": "2024-01-15T10:30:00Z",
                "file_hash": "abc123...",
                "file_path": "data/raw/vancouver/budget_2024.html"
            }
        }
