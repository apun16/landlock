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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize settings and runner
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
        # Convert string keys to SourceCategory enum
        entry_points = {}
        for key, urls in request.known_entry_points.items():
            try:
                category = SourceCategory(key.upper())
                entry_points[category] = urls
            except ValueError:
                # Skip invalid categories
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
