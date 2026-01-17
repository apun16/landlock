"""Pipeline runner - orchestrates scraping, extraction, and analysis"""
from datetime import datetime
from typing import Dict, List

from backend.config import Settings
from backend.scraper.scraper import CityScraper
from backend.storage.source_registry import SourceRegistry
from backend.extractors.fact_extractor import FactExtractor
from backend.agents.budget_analyst import BudgetAnalyst
from backend.agents.policy_analyst import PolicyAnalyst
from backend.agents.underwriter import Underwriter
from backend.models.discovered_source import SourceCategory
from backend.models.agent_outputs import RegionPanelOutput
from backend.models.extracted_fact import ExtractedFact
from backend.models.citation import Citation


class PipelineRunner:
    """Runs the full pipeline from scraping to analysis"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.scraper = CityScraper(settings)
        self.registry = SourceRegistry(settings)
        self.extractor = FactExtractor(settings)
        self.budget_analyst = BudgetAnalyst()
        self.policy_analyst = PolicyAnalyst()
        self.underwriter = Underwriter()
    
    def run_pipeline(
        self,
        region_id: str,
        base_url: str,
        known_entry_points: Dict[SourceCategory, List[str]]
    ) -> RegionPanelOutput:
        """
        Run the full pipeline for a region
        
        Args:
            region_id: Region identifier (e.g., "vancouver")
            base_url: Base URL of city website
            known_entry_points: Dict mapping SourceCategory to list of entry URLs
        
        Returns:
            RegionPanelOutput with all analysis results
        """
        # Step 1: Scrape and discover sources
        print(f"[Pipeline] Scraping {region_id}...")
        discovered_sources = self.scraper.scrape_city(
            region_id,
            base_url,
            known_entry_points
        )
        
        # Step 2: Register sources
        print(f"[Pipeline] Registering {len(discovered_sources)} sources...")
        self.registry.add_sources(discovered_sources)
        
        # Step 3: Extract facts
        print(f"[Pipeline] Extracting facts...")
        citations, facts = self.extractor.extract_facts_from_sources(
            discovered_sources,
            region_id
        )
        
        # Step 4: Run agents (unified production crew or individual)
        if self.settings.use_llm_mode:
            print(f"[Pipeline] Running unified production crew...")
            from backend.agents.production_crew import run_production_crew
            output = run_production_crew(facts, citations, self.settings, region_id)
            return output
        else:
            # Deterministic mode - run agents individually
            print(f"[Pipeline] Running Budget Analyst...")
            budget_output = self.budget_analyst.analyze(facts, citations)
            
            print(f"[Pipeline] Running Policy Analyst...")
            policy_output = self.policy_analyst.analyze(facts, citations)
            
            print(f"[Pipeline] Running Underwriter...")
            underwriter_output = self.underwriter.analyze(
                budget_output,
                policy_output,
                facts,
                citations
            )
        
        # Step 5: Compile final output
        output = RegionPanelOutput(
            region_id=region_id,
            budget_analysis=budget_output,
            policy_analysis=policy_output,
            underwriter_analysis=underwriter_output,
            generated_at=datetime.utcnow().isoformat(),
        )
        
        print(f"[Pipeline] Complete. Verdict: {underwriter_output.verdict}")
        return output
    
    def run_from_registry(self, region_id: str) -> RegionPanelOutput:
        """
        Run pipeline using already-scraped sources from registry
        
        Args:
            region_id: Region identifier
        
        Returns:
            RegionPanelOutput with all analysis results
        """
        # Get sources from registry
        sources = self.registry.get_sources_by_region(region_id)
        
        if not sources:
            raise ValueError(f"No sources found for region: {region_id}")
        
        # Extract facts
        citations, facts = self.extractor.extract_facts_from_sources(
            sources,
            region_id
        )
        
        # Run agents (unified production crew or individual)
        if self.settings.use_llm_mode:
            from backend.agents.production_crew import run_production_crew
            return run_production_crew(facts, citations, self.settings, region_id)
        else:
            # Deterministic mode
            budget_output = self.budget_analyst.analyze(facts, citations)
            policy_output = self.policy_analyst.analyze(facts, citations)
            underwriter_output = self.underwriter.analyze(
                budget_output,
                policy_output,
                facts,
                citations
            )
        
        return RegionPanelOutput(
            region_id=region_id,
            budget_analysis=budget_output,
            policy_analysis=policy_output,
            underwriter_analysis=underwriter_output,
            generated_at=datetime.utcnow().isoformat(),
        )
