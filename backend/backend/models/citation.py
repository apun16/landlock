"""Citation model - required for all extracted facts"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl, Field


class Citation(BaseModel):
    """Citation with URI and optional locator"""
    
    id: str = Field(..., description="Unique citation ID")
    title: str = Field(..., description="Source title")
    uri: HttpUrl = Field(..., description="Source URI")
    locator: Optional[str] = Field(
        None, 
        description="Page, section, anchor, or paragraph reference"
    )
    retrieved_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="When this source was retrieved"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "cite_001",
                "title": "City of Vancouver 2024 Budget",
                "uri": "https://vancouver.ca/budget/2024",
                "locator": "Section 3.2, Page 45",
                "retrieved_at": "2024-01-15T10:30:00Z"
            }
        }
