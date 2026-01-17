"""ExtractedFact model - structured facts with citations"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Union, Any
from pydantic import BaseModel, Field


class FactType(str, Enum):
    """Type of extracted fact"""
    BUDGET = "budget"
    ZONING = "zoning"
    PROPOSAL = "proposal"
    DEMOGRAPHIC = "demographic"
    DEVELOPMENT = "development"


class ExtractedFact(BaseModel):
    """A structured fact extracted from discovered sources"""
    
    id: str = Field(..., description="Unique fact ID")
    region_id: str = Field(..., description="Region identifier (e.g., city name)")
    fact_type: FactType = Field(..., description="Type of fact")
    key: str = Field(..., description="Fact key/identifier")
    value: Optional[Union[str, int, float, bool, dict, list]] = Field(
        None,
        description="Fact value (null if missing)"
    )
    unit: Optional[str] = Field(None, description="Unit of measurement")
    timeframe: Optional[str] = Field(
        None,
        description="Time period (e.g., '2024', 'Q1 2024', 'FY2023')"
    )
    citation_ids: List[str] = Field(
        default_factory=list,
        description="IDs of citations supporting this fact (REQUIRED)"
    )
    extracted_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="When this fact was extracted"
    )
    missing_reason: Optional[str] = Field(
        None,
        description="Reason why value is null (if applicable)"
    )
    
    def model_validate_citations(self) -> None:
        """Validate that facts with values have citations"""
        if self.value is not None and len(self.citation_ids) == 0:
            raise ValueError(
                f"Fact {self.id} has a value but no citations. "
                "All facts with values MUST have at least one citation."
            )
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "fact_001",
                "region_id": "vancouver",
                "fact_type": "budget",
                "key": "annual_budget_total",
                "value": 1500000000,
                "unit": "CAD",
                "timeframe": "2024",
                "citation_ids": ["cite_001"],
                "extracted_at": "2024-01-15T10:35:00Z",
                "missing_reason": None
            }
        }
