"""FastAPI main application"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Dict, List, Optional

from backend.config import Settings
from backend.pipeline.runner import PipelineRunner
from backend.models.discovered_source import SourceCategory
from backend.models.agent_outputs import RegionPanelOutput

app = FastAPI(
    title="Landlock Backend API",
    description="Policy & Development Analysis System - Left Panel",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings = Settings()
runner = PipelineRunner(settings)


class RegionRequest(BaseModel):
    """Request model for region analysis"""
    region_id: str
    base_url: HttpUrl
    known_entry_points: Dict[str, List[str]] = {
        "budget": ["/budget", "/finance"],
        "zoning": ["/planning", "/zoning"],
        "proposals": ["/development", "/applications"],
        "analytics": ["/statistics", "/demographics"],
    }


class RegionFromRegistryRequest(BaseModel):
    """Request model for analysis from registry"""
    region_id: str


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Landlock Backend",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/api/v1/analyze", response_model=RegionPanelOutput)
async def analyze_region(request: RegionRequest) -> RegionPanelOutput:
    """
    Analyze a region by scraping and analyzing sources
    
    Args:
        request: Region request with region_id, base_url, and entry points
    
    Returns:
        RegionPanelOutput with analysis results
    """
    try:
        entry_points = {}
        for key, urls in request.known_entry_points.items():
            try:
                category = SourceCategory(key.upper())
                entry_points[category] = urls
            except ValueError:
                continue
        
        output = runner.run_pipeline(
            request.region_id,
            str(request.base_url),
            entry_points
        )
        
        return output
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/analyze-from-registry", response_model=RegionPanelOutput)
async def analyze_from_registry(request: RegionFromRegistryRequest) -> RegionPanelOutput:
    """
    Analyze a region using already-scraped sources from registry
    
    Args:
        request: Request with region_id
    
    Returns:
        RegionPanelOutput with analysis results
    """
    try:
        output = runner.run_from_registry(request.region_id)
        return output
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/sources/{region_id}")
async def get_sources(region_id: str):
    """Get discovered sources for a region"""
    try:
        sources = runner.registry.get_sources_by_region(region_id)
        return {
            "region_id": region_id,
            "sources": [s.model_dump() for s in sources],
            "count": len(sources)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/demo/{region_id}")
async def get_demo_analysis(region_id: str):
    """Returns demo data for testing the frontend without scraping"""
    from datetime import datetime
    return {
        "region_id": region_id,
        "budget_analysis": {
            "funding_strength_score": 72,
            "key_allocations": [
                {"key": "Infrastructure", "value": "45M", "unit": "CAD", "timeframe": "2024"},
                {"key": "Emergency Services", "value": "12M", "unit": "CAD", "timeframe": "2024"},
                {"key": "Parks & Recreation", "value": "8M", "unit": "CAD", "timeframe": "2024"}
            ],
            "confidence": 0.85,
            "evidence_count": 12,
            "citation_ids": []
        },
        "policy_analysis": {
            "zoning_flexibility_score": 58,
            "proposal_momentum_score": 65,
            "approval_friction_factors": [
                "Environmental review required for developments >5 acres",
                "Heritage overlay in downtown core",
                "Agricultural land reserve restrictions"
            ],
            "constraints": [
                "Water supply limitations in north sector",
                "Wildfire interface zone building codes"
            ],
            "confidence": 0.78,
            "evidence_count": 8,
            "citation_ids": []
        },
        "underwriter_analysis": {
            "feasibility_score": 67,
            "verdict": "caution",
            "plan_variant": "B",
            "pros": [
                {"text": "Strong municipal funding for infrastructure"},
                {"text": "Growing population with housing demand"},
                {"text": "Established transportation corridors"}
            ],
            "cons": [
                {"text": "Wildfire risk in interface areas"},
                {"text": "Water supply constraints during peak summer"},
                {"text": "Heritage restrictions limit density options"}
            ],
            "constraints": [
                {"text": "Must maintain 30m setback from watercourses"},
                {"text": "FireSmart compliance required"}
            ],
            "confidence": 0.82,
            "evidence_count": 15,
            "citation_ids": []
        },
        "generated_at": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
