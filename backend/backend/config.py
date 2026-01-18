"""Configuration management"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    data_dir: str = "data"
    raw_documents_dir: str = "data/raw"
    sources_registry_path: str = "data/sources_registry.jsonl"
    
    scrape_rate_limit_seconds: float = 2.0
    scrape_timeout_seconds: int = 30
    scrape_max_depth: int = 3
    scrape_max_pages_per_category: int = 50
    
    openai_api_key: Optional[str] = None
    use_llm_mode: bool = False
    
    # Supabase configuration
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    use_supabase: bool = False
    
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
