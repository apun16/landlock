"""Source discovery - finds relevant pages from city websites"""
from typing import List, Set, Optional
from urllib.parse import urljoin, urlparse, parse_qs
from urllib.robotparser import RobotFileParser
from bs4 import BeautifulSoup
import requests
import time
import json
import re

from backend.models.discovered_source import DiscoveredSource, SourceCategory, DocumentType
from backend.config import Settings

try:
    import feedparser
    FEEDPARSER_AVAILABLE = True
except ImportError:
    FEEDPARSER_AVAILABLE = False


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
            
            # Handle RSS feeds
            if "rss" in content_type or "xml" in content_type or url.lower().endswith((".rss", ".xml", "/feed")):
                rss_sources = self._discover_from_rss(url, category)
                if rss_sources:
                    discovered.extend(rss_sources)
                    return discovered
            
            # Handle JSON/API endpoints
            if "json" in content_type or url.lower().endswith(".json"):
                source = DiscoveredSource(
                    title=self._extract_title_from_api_url(url),
                    uri=url,
                    category=category,
                    document_type=DocumentType.API,
                )
                discovered.append(source)
                # Try to discover more API endpoints
                api_sources = self._discover_api_endpoints(url, category)
                discovered.extend(api_sources)
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
                
                # Look for RSS feed links
                rss_links = soup.find_all("link", type=["application/rss+xml", "application/atom+xml"])
                for rss_link in rss_links:
                    href = rss_link.get("href")
                    if href:
                        full_rss_url = urljoin(url, href)
                        if full_rss_url not in self.visited_urls:
                            rss_sources = self._discover_from_rss(full_rss_url, category)
                            discovered.extend(rss_sources)
                
                # Look for ArcGIS portals
                arcgis_sources = self._discover_arcgis_portals(soup, url, category)
                discovered.extend(arcgis_sources)
                
                # Look for API endpoints
                api_sources = self._discover_api_endpoints_from_html(soup, url, category)
                discovered.extend(api_sources)
                
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
    
    def _discover_from_rss(self, url: str, category: SourceCategory) -> List[DiscoveredSource]:
        """Discover sources from RSS feed"""
        sources: List[DiscoveredSource] = []
        
        if not FEEDPARSER_AVAILABLE:
            return sources
        
        try:
            time.sleep(self.settings.scrape_rate_limit_seconds)
            feed = feedparser.parse(url)
            
            # Each entry in the feed becomes a source
            for entry in feed.entries[:20]:  # Limit to 20 entries
                entry_url = entry.get("link", "")
                if entry_url and entry_url not in self.visited_urls:
                    source = DiscoveredSource(
                        title=entry.get("title", "RSS Entry"),
                        uri=entry_url,
                        category=category,
                        document_type=DocumentType.RSS,
                    )
                    sources.append(source)
                    self.visited_urls.add(entry_url)
        except Exception as e:
            print(f"Error parsing RSS feed {url}: {e}")
        
        return sources
    
    def _discover_arcgis_portals(
        self,
        soup: BeautifulSoup,
        current_url: str,
        category: SourceCategory
    ) -> List[DiscoveredSource]:
        """Discover ArcGIS portal links for zoning maps"""
        sources: List[DiscoveredSource] = []
        
        if category != SourceCategory.ZONING:
            return sources
        
        # Look for ArcGIS portal links
        arcgis_patterns = [
            r'arcgis\.com',
            r'arcgis.*map',
            r'arcgis.*zoning',
            r'geoportal',
        ]
        
        # Check all links
        for link in soup.find_all("a", href=True):
            href = link.get("href", "")
            href_lower = href.lower()
            
            # Check if it matches ArcGIS patterns
            if any(re.search(pattern, href_lower, re.IGNORECASE) for pattern in arcgis_patterns):
                full_url = urljoin(current_url, href)
                
                if full_url not in self.visited_urls:
                    source = DiscoveredSource(
                        title=link.get_text().strip() or "ArcGIS Portal",
                        uri=full_url,
                        category=category,
                        document_type=DocumentType.HTML,  # ArcGIS portals are web apps
                    )
                    sources.append(source)
                    self.visited_urls.add(full_url)
        
        # Also check for embedded ArcGIS iframes
        for iframe in soup.find_all("iframe", src=True):
            src = iframe.get("src", "")
            if "arcgis" in src.lower():
                full_url = urljoin(current_url, src)
                if full_url not in self.visited_urls:
                    source = DiscoveredSource(
                        title="ArcGIS Embedded Map",
                        uri=full_url,
                        category=category,
                        document_type=DocumentType.HTML,
                    )
                    sources.append(source)
                    self.visited_urls.add(full_url)
        
        return sources
    
    def _discover_api_endpoints(
        self,
        url: str,
        category: SourceCategory
    ) -> List[DiscoveredSource]:
        """Discover API endpoints from a JSON response"""
        sources: List[DiscoveredSource] = []
        
        try:
            time.sleep(self.settings.scrape_rate_limit_seconds)
            resp = requests.get(
                url,
                timeout=self.settings.scrape_timeout_seconds,
                headers={"User-Agent": "LandlockBot/1.0", "Accept": "application/json"}
            )
            resp.raise_for_status()
            
            data = resp.json()
            
            # Look for API endpoints in JSON response
            if isinstance(data, dict):
                # Check for common API patterns
                for key, value in data.items():
                    if isinstance(value, str) and (value.startswith("http") or value.startswith("/api")):
                        full_url = urljoin(url, value)
                        if full_url not in self.visited_urls:
                            source = DiscoveredSource(
                                title=f"API Endpoint: {key}",
                                uri=full_url,
                                category=category,
                                document_type=DocumentType.API,
                            )
                            sources.append(source)
                            self.visited_urls.add(full_url)
        except Exception as e:
            print(f"Error discovering API endpoints from {url}: {e}")
        
        return sources
    
    def _discover_api_endpoints_from_html(
        self,
        soup: BeautifulSoup,
        current_url: str,
        category: SourceCategory
    ) -> List[DiscoveredSource]:
        """Discover API endpoints from HTML page"""
        sources: List[DiscoveredSource] = []
        
        # Look for links to API endpoints
        api_patterns = [
            r'/api/',
            r'api\.',
            r'\.json',
            r'endpoint',
            r'json$',
        ]
        
        for link in soup.find_all("a", href=True):
            href = link.get("href", "")
            href_lower = href.lower()
            
            if any(re.search(pattern, href_lower, re.IGNORECASE) for pattern in api_patterns):
                full_url = urljoin(current_url, href)
                
                if full_url not in self.visited_urls:
                    source = DiscoveredSource(
                        title=link.get_text().strip() or "API Endpoint",
                        uri=full_url,
                        category=category,
                        document_type=DocumentType.API,
                    )
                    sources.append(source)
                    self.visited_urls.add(full_url)
        
        # Look for API endpoints in script tags
        for script in soup.find_all("script"):
            script_text = script.string or ""
            # Look for API URLs in JavaScript
            api_urls = re.findall(r'["\'](https?://[^"\']*api[^"\']*)["\']', script_text, re.IGNORECASE)
            for api_url in api_urls:
                if api_url not in self.visited_urls:
                    source = DiscoveredSource(
                        title="API Endpoint (from script)",
                        uri=api_url,
                        category=category,
                        document_type=DocumentType.API,
                    )
                    sources.append(source)
                    self.visited_urls.add(api_url)
        
        return sources
    
    def _extract_title_from_api_url(self, url: str) -> str:
        """Extract a title from an API URL"""
        from urllib.parse import unquote
        parsed = urlparse(url)
        path_parts = parsed.path.strip("/").split("/")
        
        # Try to extract meaningful name from path
        if len(path_parts) > 0:
            last_part = unquote(path_parts[-1])
            return last_part.replace(".json", "").replace("_", " ").title()
        
        return "API Endpoint"