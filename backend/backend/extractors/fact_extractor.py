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
            locator=None,
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
        
        category_to_fact_type = {
            SourceCategory.BUDGET: FactType.BUDGET,
            SourceCategory.ZONING: FactType.ZONING,
            SourceCategory.PROPOSALS: FactType.PROPOSAL,
            SourceCategory.ANALYTICS: FactType.DEMOGRAPHIC,
        }
        
        fact_type = category_to_fact_type.get(source.category, FactType.BUDGET)
        
        if source.category == SourceCategory.BUDGET:
            facts.extend(self._extract_budget_facts(text, region_id, citation_id))
        elif source.category == SourceCategory.ZONING:
            facts.extend(self._extract_zoning_facts(text, region_id, citation_id))
            # Also extract proposal facts if the page has development content
            if self._has_development_content(text):
                facts.extend(self._extract_proposal_facts(text, region_id, citation_id))
        elif source.category == SourceCategory.PROPOSALS:
            facts.extend(self._extract_proposal_facts(text, region_id, citation_id))
        elif source.category == SourceCategory.ANALYTICS:
            facts.extend(self._extract_demographic_facts(text, region_id, citation_id))
        
        return facts
    
    def _has_development_content(self, text: str) -> bool:
        """Check if text contains development-related content"""
        text_lower = text.lower()
        development_keywords = [
            "development permit", "building permit", "variance permit",
            "rezoning", "subdivision", "development application",
            "permit application", "development proposal", "current applications",
            "active development", "epermit", "e-permit",
        ]
        return any(kw in text_lower for kw in development_keywords)
    
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
                
                if source.category == SourceCategory.BUDGET:
                    facts.extend(self._extract_budget_facts(text, region_id, citation_id))
                elif source.category == SourceCategory.ZONING:
                    facts.extend(self._extract_zoning_facts(text, region_id, citation_id))
                    # Also extract proposal facts if the PDF has development content
                    if self._has_development_content(text):
                        facts.extend(self._extract_proposal_facts(text, region_id, citation_id))
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
                value = self._parse_budget_value(value_str)
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.BUDGET,
                    key=f"budget_mention_{fact_counter}",
                    value=value_str,
                    unit="CAD",
                    citation_ids=[citation_id],
                ))
        
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
        
        # Zoning code patterns (e.g., R-1, C-2, M-1, RS-1, RM-3)
        zoning_pattern = r'\b[A-Z]{1,3}[- ]?\d+[A-Z]?\b'
        matches = re.finditer(zoning_pattern, text)
        seen_codes = set()
        
        for match in matches:
            code = match.group(0)
            if code not in seen_codes:
                seen_codes.add(code)
                fact_counter += 1
                fact_id = f"fact_{region_id}_zoning_{fact_counter:04d}"
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.ZONING,
                    key="zoning_code",
                    value=code,
                    citation_ids=[citation_id],
                ))
        
        # Zoning district/area names
        district_patterns = [
            r'(?:downtown|north shore|south shore|city centre|transit.oriented|neighbourhood)\s*(?:plan|area|district|zone)?',
            r'(?:single.family|multi.family|multi.unit|duplex|triplex|fourplex|townhouse)\s*(?:residential|zone|district)?',
            r'(?:low|medium|high)\s*density\s*(?:residential|zone|area)?',
        ]
        
        for pattern in district_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                district = match.group(0).strip()
                if len(district) > 3:
                    fact_counter += 1
                    fact_id = f"fact_{region_id}_zoning_district_{fact_counter:04d}"
                    facts.append(ExtractedFact(
                        id=fact_id,
                        region_id=region_id,
                        fact_type=FactType.ZONING,
                        key="zoning_district",
                        value=district,
                        citation_ids=[citation_id],
                    ))
        
        # Height restrictions (e.g., "12 metres", "4 storeys", "40 feet")
        height_patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:metre|meter|m)\s*(?:height|tall|maximum)?',
            r'(\d+)\s*(?:storey|story|stories|floors?)\s*(?:height|maximum|building)?',
            r'(?:height|maximum)\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*(?:m|metres?|feet|ft)?',
        ]
        
        for pattern in height_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                value = match.group(1) if match.lastindex else match.group(0)
                fact_counter += 1
                fact_id = f"fact_{region_id}_zoning_height_{fact_counter:04d}"
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.ZONING,
                    key="height_restriction",
                    value=match.group(0).strip(),
                    unit="metres" if "metre" in match.group(0).lower() or "m" in match.group(0).lower() else "storeys",
                    citation_ids=[citation_id],
                ))
        
        # Density/FSR (Floor Space Ratio)
        density_patterns = [
            r'(?:fsr|floor\s*space\s*ratio)\s*(?:of|:)?\s*(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)\s*(?:fsr|floor\s*space\s*ratio)',
            r'density\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*(?:units?|dwelling|per)',
            r'(\d+)\s*(?:units?|dwellings?)\s*per\s*(?:hectare|acre|ha)',
        ]
        
        for pattern in density_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                fact_counter += 1
                fact_id = f"fact_{region_id}_zoning_density_{fact_counter:04d}"
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.ZONING,
                    key="density_regulation",
                    value=match.group(0).strip(),
                    citation_ids=[citation_id],
                ))
        
        # Lot coverage percentages
        coverage_patterns = [
            r'(?:lot\s*coverage|site\s*coverage|building\s*coverage)\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*%?',
            r'(\d+(?:\.\d+)?)\s*%?\s*(?:lot\s*coverage|site\s*coverage|maximum\s*coverage)',
        ]
        
        for pattern in coverage_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                fact_counter += 1
                fact_id = f"fact_{region_id}_zoning_coverage_{fact_counter:04d}"
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.ZONING,
                    key="lot_coverage",
                    value=match.group(0).strip(),
                    unit="percent",
                    citation_ids=[citation_id],
                ))
        
        # Setback requirements
        setback_patterns = [
            r'(?:front|rear|side|setback)\s*(?:yard|setback)?\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*(?:m|metres?|feet|ft)?',
            r'(\d+(?:\.\d+)?)\s*(?:m|metres?|feet|ft)\s*(?:front|rear|side)\s*(?:yard|setback)?',
        ]
        
        for pattern in setback_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                fact_counter += 1
                fact_id = f"fact_{region_id}_zoning_setback_{fact_counter:04d}"
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.ZONING,
                    key="setback_requirement",
                    value=match.group(0).strip(),
                    citation_ids=[citation_id],
                ))
        
        # Bylaw numbers
        bylaw_patterns = [
            r'(?:bylaw|by-law)\s*(?:no\.?|#)?\s*(\d+)',
            r'(?:zoning\s*bylaw|land\s*use\s*bylaw)\s*(?:no\.?|#)?\s*(\d+)?',
        ]
        
        for pattern in bylaw_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                fact_counter += 1
                fact_id = f"fact_{region_id}_zoning_bylaw_{fact_counter:04d}"
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.ZONING,
                    key="bylaw_reference",
                    value=match.group(0).strip(),
                    citation_ids=[citation_id],
                ))
        
        # Land use keywords with context
        land_use_keywords = [
            "residential", "commercial", "industrial", "mixed-use", "mixed use",
            "agricultural", "institutional", "recreational", "open space",
            "transit-oriented", "transit oriented", "high density", "low density",
            "medium density", "multi-family", "single-family", "multi-unit",
            "small-scale", "small scale", "infill", "intensification",
        ]
        
        seen_keywords = set()
        for keyword in land_use_keywords:
            if keyword.lower() in text.lower() and keyword.lower() not in seen_keywords:
                seen_keywords.add(keyword.lower())
                fact_counter += 1
                fact_id = f"fact_{region_id}_zoning_landuse_{fact_counter:04d}"
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.ZONING,
                    key="land_use_type",
                    value=keyword,
                    citation_ids=[citation_id],
                ))
        
        # Parking requirements
        parking_patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:parking\s*)?(?:stalls?|spaces?)\s*(?:per|/)\s*(?:unit|dwelling|sq\.?\s*(?:m|ft|metre|foot))',
            r'(?:parking|stalls?|spaces?)\s*(?:requirement|required|minimum)\s*(?:of|:)?\s*(\d+(?:\.\d+)?)',
        ]
        
        for pattern in parking_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                fact_counter += 1
                fact_id = f"fact_{region_id}_zoning_parking_{fact_counter:04d}"
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.ZONING,
                    key="parking_requirement",
                    value=match.group(0).strip(),
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
        
        # Application/proposal IDs
        proposal_patterns = [
            r'application\s*#?\s*([A-Z0-9-]+)',
            r'proposal\s*#?\s*([A-Z0-9-]+)',
            r'DP\s*([A-Z0-9-]+)',  # Development Permit
            r'DA\s*([A-Z0-9-]+)',  # Development Application
            r'DVP\s*([A-Z0-9-]+)',  # Development Variance Permit
            r'REZ\s*([A-Z0-9-]+)',  # Rezoning
            r'SUB\s*([A-Z0-9-]+)',  # Subdivision
            r'OCP\s*([A-Z0-9-]+)',  # Official Community Plan amendment
            r'BP\s*([A-Z0-9-]+)',  # Building Permit
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
                    value=match.group(0).strip(),
                    citation_ids=[citation_id],
                ))
        
        # Development permit types
        permit_types = [
            "development permit", "building permit", "variance permit",
            "rezoning", "subdivision", "sign permit", "demolition permit",
            "plumbing permit", "electrical permit", "minor variance",
            "ocp amendment", "community plan amendment",
        ]
        
        seen_permits = set()
        for permit_type in permit_types:
            if permit_type.lower() in text.lower() and permit_type.lower() not in seen_permits:
                seen_permits.add(permit_type.lower())
                fact_counter += 1
                fact_id = f"fact_{region_id}_proposal_type_{fact_counter:04d}"
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.PROPOSAL,
                    key="permit_type",
                    value=permit_type,
                    citation_ids=[citation_id],
                ))
        
        # Development rates/statistics
        rate_patterns = [
            r'(\d+)\s*(?:development\s*)?(?:permits?|applications?)\s*(?:issued|approved|submitted|received)',
            r'(?:issued|approved|submitted|received)\s*(\d+)\s*(?:development\s*)?(?:permits?|applications?)',
            r'(\d+)\s*(?:new|total)\s*(?:units?|dwellings?|homes?)\s*(?:approved|built|constructed|permitted)',
            r'(?:approval\s*rate|success\s*rate)\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*%',
            r'(\d+)\s*(?:days?|weeks?|months?)\s*(?:processing|review|approval)\s*(?:time|period)?',
        ]
        
        for pattern in rate_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                fact_counter += 1
                fact_id = f"fact_{region_id}_proposal_rate_{fact_counter:04d}"
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.PROPOSAL,
                    key="development_rate",
                    value=match.group(0).strip(),
                    citation_ids=[citation_id],
                ))
        
        # Development cost charges
        dcc_patterns = [
            r'(?:development\s*cost\s*charge|dcc)\s*(?:of|:)?\s*\$?([\d,]+(?:\.\d+)?)',
            r'\$?([\d,]+(?:\.\d+)?)\s*(?:per\s*)?(?:development\s*cost\s*charge|dcc)',
            r'(?:amenity\s*contribution|community\s*amenity)\s*(?:of|:)?\s*\$?([\d,]+(?:\.\d+)?)',
        ]
        
        for pattern in dcc_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                fact_counter += 1
                fact_id = f"fact_{region_id}_proposal_dcc_{fact_counter:04d}"
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.PROPOSAL,
                    key="development_cost_charge",
                    value=match.group(0).strip(),
                    unit="CAD",
                    citation_ids=[citation_id],
                ))
        
        # Status keywords
        status_keywords = ["approved", "pending", "under review", "rejected", "withdrawn", 
                          "in progress", "complete", "conditional approval"]
        seen_statuses = set()
        for keyword in status_keywords:
            if keyword.lower() in text.lower() and keyword.lower() not in seen_statuses:
                seen_statuses.add(keyword.lower())
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
        
        # Project types/categories
        project_types = [
            "multi-family", "multi family", "single-family", "single family",
            "townhouse", "apartment", "condo", "condominium", "mixed-use",
            "commercial", "retail", "office", "industrial", "warehouse",
            "affordable housing", "rental housing", "seniors housing",
        ]
        
        seen_projects = set()
        for project_type in project_types:
            if project_type.lower() in text.lower() and project_type.lower() not in seen_projects:
                seen_projects.add(project_type.lower())
                fact_counter += 1
                fact_id = f"fact_{region_id}_proposal_project_{fact_counter:04d}"
                
                facts.append(ExtractedFact(
                    id=fact_id,
                    region_id=region_id,
                    fact_type=FactType.PROPOSAL,
                    key="project_type",
                    value=project_type,
                    citation_ids=[citation_id],
                ))
        
        # Unit counts
        unit_patterns = [
            r'(\d+)\s*(?:residential\s*)?(?:units?|dwellings?|suites?|apartments?)',
            r'(\d+)\s*(?:bed|bedroom)\s*(?:units?|apartments?)?',
            r'(\d+)\s*(?:storeys?|stories?|floors?)\s*(?:building|tower|development)?',
        ]
        
        for pattern in unit_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                value = match.group(1)
                # Only capture meaningful unit counts (not tiny numbers from other contexts)
                if int(value) >= 2:
                    fact_counter += 1
                    fact_id = f"fact_{region_id}_proposal_units_{fact_counter:04d}"
                    
                    facts.append(ExtractedFact(
                        id=fact_id,
                        region_id=region_id,
                        fact_type=FactType.PROPOSAL,
                        key="unit_count",
                        value=match.group(0).strip(),
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
        normalized = value_str.replace("$", "").replace(",", "").strip()
        
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
    
    def _extract_from_rss(
        self,
        source: DiscoveredSource,
        region_id: str,
        citation_id: str,
        file_path: Path
    ) -> List[ExtractedFact]:
        """Extract facts from RSS feed"""
        facts: List[ExtractedFact] = []
        
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            # RSS feeds are XML, try to parse as such
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(content, "xml")
            
            for entry in soup.find_all("item")[:10]:  # Limit entries
                title = entry.find("title")
                description = entry.find("description")
                
                text = ""
                if title:
                    text += title.get_text() + " "
                if description:
                    text += description.get_text()
                
                if source.category == SourceCategory.BUDGET:
                    facts.extend(self._extract_budget_facts(text, region_id, citation_id))
                elif source.category == SourceCategory.ZONING:
                    facts.extend(self._extract_zoning_facts(text, region_id, citation_id))
                elif source.category == SourceCategory.PROPOSALS:
                    facts.extend(self._extract_proposal_facts(text, region_id, citation_id))
                elif source.category == SourceCategory.ANALYTICS:
                    facts.extend(self._extract_demographic_facts(text, region_id, citation_id))
        except Exception as e:
            print(f"Error reading RSS {file_path}: {e}")
        
        return facts
    
    def _extract_from_api(
        self,
        source: DiscoveredSource,
        region_id: str,
        citation_id: str,
        file_path: Path
    ) -> List[ExtractedFact]:
        """Extract facts from API/JSON response"""
        facts: List[ExtractedFact] = []
        
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            data = json.loads(content)
            
            text = json.dumps(data, indent=2)
            
            if source.category == SourceCategory.BUDGET:
                facts.extend(self._extract_budget_facts(text, region_id, citation_id))
                facts.extend(self._extract_budget_facts_from_json(data, region_id, citation_id))
            elif source.category == SourceCategory.ZONING:
                facts.extend(self._extract_zoning_facts(text, region_id, citation_id))
            elif source.category == SourceCategory.PROPOSALS:
                facts.extend(self._extract_proposal_facts(text, region_id, citation_id))
            elif source.category == SourceCategory.ANALYTICS:
                facts.extend(self._extract_demographic_facts(text, region_id, citation_id))
                facts.extend(self._extract_demographic_facts_from_json(data, region_id, citation_id))
        except Exception as e:
            print(f"Error reading API JSON {file_path}: {e}")
        
        return facts
    
    def _extract_budget_facts_from_json(
        self,
        data: dict,
        region_id: str,
        citation_id: str
    ) -> List[ExtractedFact]:
        """Extract budget facts from structured JSON"""
        facts: List[ExtractedFact] = []
        fact_counter = 0
        
        budget_keys = ["budget", "total", "amount", "funding", "allocation", "spending"]
        
        def extract_from_dict(d, path=""):
            nonlocal fact_counter
            if isinstance(d, dict):
                for key, value in d.items():
                    key_lower = key.lower()
                    if any(bk in key_lower for bk in budget_keys):
                        if isinstance(value, (int, float)):
                            fact_counter += 1
                            fact_id = f"fact_{region_id}_budget_json_{fact_counter:04d}"
                            facts.append(ExtractedFact(
                                id=fact_id,
                                region_id=region_id,
                                fact_type=FactType.BUDGET,
                                key=f"{path}.{key}" if path else key,
                                value=value,
                                unit="CAD",
                                citation_ids=[citation_id],
                            ))
                        elif isinstance(value, dict):
                            extract_from_dict(value, f"{path}.{key}" if path else key)
                    else:
                        extract_from_dict(value, f"{path}.{key}" if path else key)
            elif isinstance(d, list):
                for item in d:
                    extract_from_dict(item, path)
        
        extract_from_dict(data)
        return facts
    
    def _extract_demographic_facts_from_json(
        self,
        data: dict,
        region_id: str,
        citation_id: str
    ) -> List[ExtractedFact]:
        """Extract demographic facts from structured JSON"""
        facts: List[ExtractedFact] = []
        fact_counter = 0
        
        demo_keys = ["population", "demographics", "growth", "residents", "people", "count"]
        
        def extract_from_dict(d, path=""):
            nonlocal fact_counter
            if isinstance(d, dict):
                for key, value in d.items():
                    key_lower = key.lower()
                    if any(dk in key_lower for dk in demo_keys):
                        if isinstance(value, (int, float)):
                            fact_counter += 1
                            fact_id = f"fact_{region_id}_demographic_json_{fact_counter:04d}"
                            unit = "percent" if "rate" in key_lower or "growth" in key_lower else "people"
                            facts.append(ExtractedFact(
                                id=fact_id,
                                region_id=region_id,
                                fact_type=FactType.DEMOGRAPHIC,
                                key=f"{path}.{key}" if path else key,
                                value=value,
                                unit=unit,
                                citation_ids=[citation_id],
                            ))
                        elif isinstance(value, dict):
                            extract_from_dict(value, f"{path}.{key}" if path else key)
                    else:
                        extract_from_dict(value, f"{path}.{key}" if path else key)
            elif isinstance(d, list):
                for item in d:
                    extract_from_dict(item, path)
        
        extract_from_dict(data)
        return facts