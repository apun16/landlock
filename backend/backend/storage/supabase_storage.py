"""Supabase storage for analysis results"""
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

from backend.config import Settings
from backend.models.agent_outputs import RegionPanelOutput

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None


class SupabaseStorage:
    """Store and retrieve analysis results from Supabase"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client: Optional[Client] = None
        
        if SUPABASE_AVAILABLE and settings.supabase_url and settings.supabase_key:
            self.client = create_client(settings.supabase_url, settings.supabase_key)
    
    @property
    def is_available(self) -> bool:
        """Check if Supabase is configured and available"""
        return self.client is not None
    
    def store_analysis(self, output: RegionPanelOutput) -> Optional[str]:
        """
        Store a RegionPanelOutput to Supabase
        
        Args:
            output: The analysis output to store
            
        Returns:
            The ID of the stored record, or None if storage failed
        """
        if not self.is_available:
            print("Supabase not configured, skipping storage")
            return None
        
        try:
            # Convert to dict for storage
            data = {
                "region_id": output.region_id,
                "budget_analysis": output.budget_analysis.model_dump(),
                "policy_analysis": output.policy_analysis.model_dump(),
                "underwriter_analysis": output.underwriter_analysis.model_dump(),
                "generated_at": output.generated_at,
                "created_at": datetime.utcnow().isoformat(),
            }
            
            result = self.client.table("region_analyses").insert(data).execute()
            
            if result.data and len(result.data) > 0:
                record_id = result.data[0].get("id")
                print(f"Stored analysis to Supabase: {record_id}")
                return record_id
            
            return None
            
        except Exception as e:
            print(f"Error storing to Supabase: {e}")
            return None
    
    def get_analysis(self, region_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the latest analysis for a region
        
        Args:
            region_id: The region identifier
            
        Returns:
            The analysis data, or None if not found
        """
        if not self.is_available:
            return None
        
        try:
            result = (
                self.client.table("region_analyses")
                .select("*")
                .eq("region_id", region_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            return None
            
        except Exception as e:
            print(f"Error retrieving from Supabase: {e}")
            return None
    
    def get_all_analyses(self, region_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get all analyses for a region
        
        Args:
            region_id: The region identifier
            limit: Maximum number of records to return
            
        Returns:
            List of analysis records
        """
        if not self.is_available:
            return []
        
        try:
            result = (
                self.client.table("region_analyses")
                .select("*")
                .eq("region_id", region_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            
            return result.data if result.data else []
            
        except Exception as e:
            print(f"Error retrieving from Supabase: {e}")
            return []
    
    def list_regions(self) -> List[str]:
        """
        List all regions that have analyses stored
        
        Returns:
            List of region IDs
        """
        if not self.is_available:
            return []
        
        try:
            result = (
                self.client.table("region_analyses")
                .select("region_id")
                .execute()
            )
            
            if result.data:
                # Get unique region IDs
                return list(set(r["region_id"] for r in result.data))
            
            return []
            
        except Exception as e:
            print(f"Error listing regions from Supabase: {e}")
            return []


def get_supabase_storage(settings: Settings) -> Optional[SupabaseStorage]:
    """Factory function to get Supabase storage if configured"""
    if not settings.use_supabase:
        return None
    
    if not SUPABASE_AVAILABLE:
        print("Warning: Supabase package not installed. Run: pip install supabase")
        return None
    
    if not settings.supabase_url or not settings.supabase_key:
        print("Warning: SUPABASE_URL and SUPABASE_KEY must be set in .env")
        return None
    
    return SupabaseStorage(settings)
