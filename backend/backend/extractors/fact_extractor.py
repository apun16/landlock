"""Structured fact extraction from scraped documents"""
import re
from pathlib import Path
from typing import List, Optional, Dict, Any
from bs4 import BeautifulSoup
import pdfplumber

from backend.models.discovered_source import DiscoveredSource, SourceCategory, DocumentType
from backend.models.extracted_fact import ExtractedFact, FactType
from backend.models.citation import Citation
from backend.config import Settings


class FactExtractor:
    """Extracts structured facts from discovered sources"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.citation_counter = 0
    
    def extract_facts_from_sources(
        self,
        sources: List[DiscoveredSource],
        region_id: str
    ) -> tuple[List[Citation], List[ExtractedFact]]:
        """
        Extract facts and citations from a list of sources
        
        Returns:
            Tuple of (citations, facts)
        """
        citations: List[Citation] = []
        facts: List[ExtractedFact] = []
        
        for source in sources:
            citation = self._create_citation(source)
            citations.append(citation)
            
            # Extract facts based on source category
            source_facts = self._extract_from_source(source, region_id, citation.id)
            facts.extend(source_facts)
        
        return citations, facts
    
    def _create_citation(self, source: DiscoveredSource) -> Citation:
        """Create a citation from a discovered source"""
        self.citation_counter += 1
        citation_id = f"cite_{self.citation_counter:04d}"
        
        return Citation(
            id=citation_id,
            title=source.title,
            uri=source.uri,
            locator=None,  # Can be set later if page/section info available
            retrieved_at=source.retrieved_at,
        )
    
    def _extract_from_source(
        self,
        source: DiscoveredSource,
        region_id: str,
        citation_id: str
    ) -> List[ExtractedFact]:
        """Extract facts from a single source"""
        facts: List[ExtractedFact] = []
        
        if source.file_path is None:
            return facts
        
        file_path = Path(self.settings.data_dir) / source.file_path
        
        if not file_path.exists():
            return facts
        
        try:
            if source.document_type == DocumentType.HTML:
                facts = self._extract_from_html(source, region_id, citation_id, file_path)
            elif source.document_type == DocumentType.PDF:
                facts = self._extract_from_pdf(source, region_id, citation_id, file_path)
            elif source.document_type == DocumentType.RSS:
                facts = self._extract_from_rss(source, region_id, citation_id, file_path)
            elif source.document_type == DocumentType.API:
                facts = self._extract_from_api(source, region_id, citation_id, file_path)
        except Exception as e:
            print(f"Error extracting from {source.uri}: {e}")
        
        return facts
    
    def _extract_from_html(
        self,
        source: DiscoveredSource,
        region_id: str,
        citation_id: str,
        file_path: Path
    ) -> List[ExtractedFact]:
        """Extract facts from HTML document"""
        facts: List[ExtractedFact] = []
        content = file_path.read_text(encoding="utf-8", errors="ignore")
        soup = BeautifulSoup(content, "lxml")
        text = soup.get_text()
        
        # Map category to fact type
        category_to_fact_type = {
            SourceCategory.BUDGET: FactType.BUDGET,
            SourceCategory.ZONING: FactType.ZONING,
            SourceCategory.PROPOSALS: FactType.PROPOSAL,
            SourceCategory.ANALYTICS: FactType.DEMOGRAPHIC,
        }
        
        fact_type = category_to_fact_type.get(source.category, FactType.BUDGET)
        
        # Extract based on category
        if source.category == SourceCategory.BUDGET:
            facts.extend(self._extract_budget_facts(text, region_id, citation_id))
        elif source.category == SourceCategory.ZONING:
            facts.extend(self._extract_zoning_facts(text, region_id, citation_id))
        elif source.category == SourceCategory.PROPOSALS:
            facts.extend(self._extract_proposal_facts(text, region_id, citation_id))
        elif source.category == SourceCategory.ANALYTICS:
            facts.extend(self._extract_demographic_facts(text, region_id, citation_id))
        
        return facts
    
    def _extract_from_pdf(
        self,
        source: DiscoveredSource,
        region_id: str,
        citation_id: str,
        file_path: Path
    ) -> List[ExtractedFact]:
        """Extract facts from PDF document"""
        facts: List[ExtractedFact] = []
        
        try:
            with pdfplumber.open(str(file_path)) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
                
                # Map category to fact type
                if source.category == SourceCategory.BUDGET:
                    facts.extend(self._extract_budget_facts(text, region_id, citation_id))
                elif source.category == SourceCategory.ZONING:
                    facts.extend(self._extract_zoning_facts(text, region_id, citation_id))
                elif source.category == SourceCategory.PROPOSALS:
                    facts.extend(self._extract_proposal_facts(text, region_id, citation_id))
                elif source.category == SourceCategory.ANALYTICS:
                    facts.extend(self._extract_demographic_facts(text, region_id, citation_id))
        except Exception as e:
            print(f"Error reading PDF {file_path}: {e}")
        
        return facts
    
    def _extract_budget_facts(
        self,
        text: str,
        region_id: str,
        citation_id: str
    ) -> List[ExtractedFact]:
        """Extract budget-related facts from text"""
        facts: List[ExtractedFact] = []
        fact_counter = 0
        
        # Pattern for budget amounts (e.g., "$1.5 billion", "$500M", "1,500,000 CAD")
        budget_patterns = [
            r'\$[\d.,]+\s*(?:billion|million|B|M|k|thousand)',
            r'\$[\d,]+',
            r'[\d,]+(?:\s+)?(?:CAD|USD|dollars?)',
        ]
        
        for pattern in budget_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                fact_counter += 1
                fact_id = f"fact_{region_id}_budget_{fact_counter:04d}"
                
                value_str = match.group(0)
                # Try to extract numeric value
                value = self._parse_budget_value(value_str)
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.BUDGET,
                    key=f"budget_mention_{fact_counter}",
                    value=value_str,  # Store as string for now
                    unit="CAD",
                    citation_ids=[citation_id],
                ))
        
        # Look for year mentions
        year_match = re.search(r'(?:20\d{2}|FY\s*\d{4})', text)
        if year_match:
            fact_counter += 1
            fact_id = f"fact_{region_id}_budget_year_{fact_counter:04d}"
            facts.append(ExtractedFact(
                id=fact_id,
                region_id=region_id,
                fact_type=FactType.BUDGET,
                key="budget_year",
                value=year_match.group(0),
                citation_ids=[citation_id],
            ))
        
        return facts
    
    def _extract_zoning_facts(
        self,
        text: str,
        region_id: str,
        citation_id: str
    ) -> List[ExtractedFact]:
        """Extract zoning-related facts from text"""
        facts: List[ExtractedFact] = []
        fact_counter = 0
        
        # Look for zoning codes (e.g., "RS-1", "C-2", "M-3")
        zoning_pattern = r'\b[A-Z]{1,3}[- ]?\d+\b'
        matches = re.finditer(zoning_pattern, text)
        
        for match in matches:
            fact_counter += 1
            fact_id = f"fact_{region_id}_zoning_{fact_counter:04d}"
            
            facts.append(ExtractedFact(
                id=fact_id,
                region_id=region_id,
                fact_type=FactType.ZONING,
                key=f"zoning_code_{fact_counter}",
                value=match.group(0),
                citation_ids=[citation_id],
            ))
        
        # Look for zoning keywords
        zoning_keywords = ["residential", "commercial", "industrial", "mixed-use", "density"]
        for keyword in zoning_keywords:
            if keyword.lower() in text.lower():
                fact_counter += 1
                fact_id = f"fact_{region_id}_zoning_keyword_{fact_counter:04d}"
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.ZONING,
                    key=f"zoning_keyword_{keyword}",
                    value=keyword,
                    citation_ids=[citation_id],
                ))
        
        return facts
    
    def _extract_proposal_facts(
        self,
        text: str,
        region_id: str,
        citation_id: str
    ) -> List[ExtractedFact]:
        """Extract proposal-related facts from text"""
        facts: List[ExtractedFact] = []
        fact_counter = 0
        
        # Look for application numbers or proposal IDs
        proposal_patterns = [
            r'application\s*#?\s*([A-Z0-9-]+)',
            r'proposal\s*#?\s*([A-Z0-9-]+)',
            r'DP\s*([A-Z0-9-]+)',  # Development Permit
            r'DA\s*([A-Z0-9-]+)',  # Development Application
        ]
        
        for pattern in proposal_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                fact_counter += 1
                fact_id = f"fact_{region_id}_proposal_{fact_counter:04d}"
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.PROPOSAL,
                    key="proposal_id",
                    value=match.group(1) if match.lastindex else match.group(0),
                    citation_ids=[citation_id],
                ))
        
        # Look for status keywords
        status_keywords = ["approved", "pending", "under review", "rejected", "withdrawn"]
        for keyword in status_keywords:
            if keyword.lower() in text.lower():
                fact_counter += 1
                fact_id = f"fact_{region_id}_proposal_status_{fact_counter:04d}"
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.PROPOSAL,
                    key="proposal_status",
                    value=keyword,
                    citation_ids=[citation_id],
                ))
        
        return facts
    
    def _extract_demographic_facts(
        self,
        text: str,
        region_id: str,
        citation_id: str
    ) -> List[ExtractedFact]:
        """Extract demographic/analytics facts from text"""
        facts: List[ExtractedFact] = []
        fact_counter = 0
        
        # Look for population numbers
        population_patterns = [
            r'population\s*:?\s*([\d,]+)',
            r'([\d,]+)\s*residents',
            r'([\d,]+)\s*people',
        ]
        
        for pattern in population_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                fact_counter += 1
                fact_id = f"fact_{region_id}_demographic_{fact_counter:04d}"
                
                value_str = match.group(1) if match.lastindex else match.group(0)
                value = int(re.sub(r'[,\s]', '', value_str))
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.DEMOGRAPHIC,
                    key="population",
                    value=value,
                    unit="people",
                    citation_ids=[citation_id],
                ))
        
        # Look for growth percentages
        growth_pattern = r'growth\s*(?:rate|of)?\s*:?\s*([\d.]+)%'
        matches = re.finditer(growth_pattern, text, re.IGNORECASE)
        for match in matches:
            fact_counter += 1
            fact_id = f"fact_{region_id}_demographic_growth_{fact_counter:04d}"
            
            facts.append(ExtractedFact(
                id=fact_id,
                region_id=region_id,
                fact_type=FactType.DEMOGRAPHIC,
                key="growth_rate",
                value=float(match.group(1)),
                unit="percent",
                citation_ids=[citation_id],
            ))
        
        return facts
    
    def _parse_budget_value(self, value_str: str) -> Optional[float]:
        """Parse a budget value string to a float"""
        # Remove currency symbols and normalize
        normalized = value_str.replace("$", "").replace(",", "").strip()
        
        # Handle billions, millions, thousands
        if "billion" in value_str.lower() or "b" in value_str.lower():
            multiplier = 1_000_000_000
            normalized = normalized.replace("billion", "").replace("b", "").strip()
        elif "million" in value_str.lower() or "m" in value_str.lower():
            multiplier = 1_000_000
            normalized = normalized.replace("million", "").replace("m", "").strip()
        elif "thousand" in value_str.lower() or "k" in value_str.lower():
            multiplier = 1_000
            normalized = normalized.replace("thousand", "").replace("k", "").strip()
        else:
            multiplier = 1
        
        try:
            return float(normalized) * multiplier
        except ValueError:
            return None
