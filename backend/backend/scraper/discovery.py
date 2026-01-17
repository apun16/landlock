"""Source discovery - finds relevant pages from city websites"""
from typing import List, Set
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser
from bs4 import BeautifulSoup
import requests
import time

from backend.models.discovered_source import DiscoveredSource, SourceCategory, DocumentType
from backend.config import Settings


class SourceDiscovery:
    """Discovers sources from city websites"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.visited_urls: Set[str] = set()
        self.robots_parsers: dict[str, RobotFileParser] = {}
    
    def can_fetch(self, url: str) -> bool:
        """Check if URL can be fetched according to robots.txt"""
        parsed = urlparse(url)
        domain = f"{parsed.scheme}://{parsed.netloc}"
        
        if domain not in self.robots_parsers:
            try:
                robots_url = urljoin(domain, "/robots.txt")
                parser = RobotFileParser()
                parser.set_url(robots_url)
                parser.read()
                self.robots_parsers[domain] = parser
            except Exception:
                # Assume allowed if robots.txt doesn't exist or fails
                # Create a permissive parser that always allows
                class PermissiveParser(RobotFileParser):
                    def can_fetch(self, *args, **kwargs):
                        return True
                parser = PermissiveParser()
                self.robots_parsers[domain] = parser
        
        parser = self.robots_parsers[domain]
        try:
            result = parser.can_fetch("*", url)
            return result
        except Exception:
            # Default to allowed on error
            return True
    
    def discover_from_city(
        self,
        base_url: str,
        region_id: str,
        known_entry_points: dict[SourceCategory, List[str]]
    ) -> List[DiscoveredSource]:
        """
        Discover all sources for a city starting from known entry points
        
        Args:
            base_url: Base URL of the city website
            region_id: Region identifier (e.g., "vancouver")
            known_entry_points: Dict mapping categories to list of entry point URLs
        
        Returns:
            List of discovered sources
        """
        discovered: List[DiscoveredSource] = []
        self.visited_urls.clear()
        
        for category, entry_urls in known_entry_points.items():
            for entry_url in entry_urls:
                full_url = urljoin(base_url, entry_url)
                if not self.can_fetch(full_url):
                    continue
                
                sources = self._discover_from_entry_point(
                    full_url,
                    category,
                    region_id,
                    depth=0
                )
                discovered.extend(sources)
        
        return discovered
    
    def _discover_from_entry_point(
        self,
        url: str,
        category: SourceCategory,
        region_id: str,
        depth: int
    ) -> List[DiscoveredSource]:
        """Recursively discover sources from an entry point"""
        if depth > self.settings.scrape_max_depth:
            return []
        
        if url in self.visited_urls:
            return []
        
        self.visited_urls.add(url)
        
        discovered: List[DiscoveredSource] = []
        
        try:
            time.sleep(self.settings.scrape_rate_limit_seconds)
            
            resp = requests.get(
                url,
                timeout=self.settings.scrape_timeout_seconds,
                headers={"User-Agent": "LandlockBot/1.0"}
            )
            resp.raise_for_status()
            
            content_type = resp.headers.get("Content-Type", "").lower()
            
            # Handle PDFs
            if "pdf" in content_type or url.lower().endswith(".pdf"):
                source = DiscoveredSource(
                    title=self._extract_title_from_pdf_url(url),
                    uri=url,
                    category=category,
                    document_type=DocumentType.PDF,
                )
                discovered.append(source)
                return discovered
            
            # Handle HTML
            if "html" in content_type or url.lower().endswith((".html", ".htm")):
                soup = BeautifulSoup(resp.text, "lxml")
                title = soup.find("title")
                title_text = title.text.strip() if title else url
                
                source = DiscoveredSource(
                    title=title_text,
                    uri=url,
                    category=category,
                    document_type=DocumentType.HTML,
                )
                discovered.append(source)
                
                # Follow internal links
                if len(discovered) < self.settings.scrape_max_pages_per_category:
                    internal_links = self._extract_internal_links(
                        soup,
                        url,
                        category
                    )
                    for link in internal_links[:10]:  # Limit per page
                        child_sources = self._discover_from_entry_point(
                            link,
                            category,
                            region_id,
                            depth + 1
                        )
                        discovered.extend(child_sources)
            
        except Exception as e:
            # Log error but continue
            print(f"Error discovering from {url}: {e}")
        
        return discovered
    
    def _extract_internal_links(
        self,
        soup: BeautifulSoup,
        current_url: str,
        category: SourceCategory
    ) -> List[str]:
        """Extract internal links relevant to the category"""
        parsed_current = urlparse(current_url)
        base_domain = parsed_current.netloc
        
        links: List[str] = []
        keywords = {
            SourceCategory.BUDGET: ["budget", "finance", "spending", "capital"],
            SourceCategory.ZONING: ["zoning", "bylaw", "land-use", "planning"],
            SourceCategory.PROPOSALS: ["proposal", "application", "development", "plan"],
            SourceCategory.ANALYTICS: ["statistics", "demographics", "population", "growth"],
        }
        
        for link in soup.find_all("a", href=True):
            href = link.get("href")
            text = link.get_text().lower()
            href_lower = href.lower()
            
            full_url = urljoin(current_url, href)
            parsed_link = urlparse(full_url)
            
            # Only internal links
            if parsed_link.netloc != base_domain:
                continue
            
            # Check if relevant to category
            relevant_keywords = keywords.get(category, [])
            if any(kw in href_lower or kw in text for kw in relevant_keywords):
                links.append(full_url)
        
        return links
    
    def _extract_title_from_pdf_url(self, url: str) -> str:
        """Extract a title from a PDF URL"""
        from urllib.parse import unquote
        parsed = urlparse(url)
        filename = unquote(parsed.path.split("/")[-1])
        return filename.replace(".pdf", "").replace("_", " ").title()
