"""Policy Analyst agent - analyzes zoning and proposals"""
from typing import List
from backend.models.extracted_fact import ExtractedFact, FactType
from backend.models.agent_outputs import PolicyAnalystOutput
from backend.models.citation import Citation


class PolicyAnalyst:
    """Analyzes zoning and proposal facts and outputs scores"""
    
    def analyze(
        self,
        facts: List[ExtractedFact],
        citations: List[Citation]
    ) -> PolicyAnalystOutput:
        """
        Analyze policy facts (zoning + proposals) and produce output
        
        Args:
            facts: List of extracted facts (filtered to zoning/proposal facts)
            citations: List of citations
        
        Returns:
            PolicyAnalystOutput with scores and constraints
        """
        zoning_facts = [f for f in facts if f.fact_type == FactType.ZONING]
        proposal_facts = [f for f in facts if f.fact_type == FactType.PROPOSAL]
        

        zoning_score = None
        if zoning_facts:
            unique_zones = len(set(f.value for f in zoning_facts if f.value))
            zoning_score = min(unique_zones * 15, 100) if unique_zones > 0 else None
        
        proposal_score = None
        approval_friction_factors = []
        constraints = []
        
        if proposal_facts:
            # Count status-related facts for momentum calculation
            status_facts = [f for f in proposal_facts if f.key == "proposal_status"]
            approved_count = sum(
                1 for f in status_facts
                if f.value and "approved" in str(f.value).lower()
            )
            pending_count = sum(
                1 for f in status_facts
                if f.value and "pending" in str(f.value).lower()
            )
            rejected_count = sum(
                1 for f in status_facts
                if f.value and "rejected" in str(f.value).lower()
            )
            
            # Calculate momentum based on status facts if available
            total_status_facts = approved_count + pending_count + rejected_count
            if total_status_facts > 0:
                # Approved = positive, pending = neutral, rejected = negative
                approval_rate = (approved_count / total_status_facts)
                proposal_score = int(approval_rate * 100)
            else:
                # If no status facts, estimate based on presence of development activity
                permit_types = len([f for f in proposal_facts if f.key == "permit_type"])
                project_types = len([f for f in proposal_facts if f.key == "project_type"])
                unit_counts = len([f for f in proposal_facts if f.key == "unit_count"])
                
                # More activity indicators = higher momentum
                activity_score = min((permit_types + project_types + unit_counts) * 5, 100)
                proposal_score = activity_score if activity_score > 0 else None
            
            if pending_count > approved_count and total_status_facts > 0:
                approval_friction_factors.append("More pending than approved proposals")
            
            for fact in zoning_facts:
                if fact.value and isinstance(fact.value, str):
                    if "restricted" in fact.value.lower() or "residential" in fact.value.lower():
                        constraints.append(f"Zoning restriction: {fact.value}")
        
        all_facts = zoning_facts + proposal_facts
        facts_with_citations = sum(1 for f in all_facts if f.citation_ids)
        confidence = min(facts_with_citations / max(len(all_facts), 1), 1.0)
        
        used_citation_ids = set()
        for fact in all_facts:
            used_citation_ids.update(fact.citation_ids)
        
        return PolicyAnalystOutput(
            zoning_flexibility_score=zoning_score if zoning_facts else None,
            proposal_momentum_score=proposal_score if proposal_facts else None,
            approval_friction_factors=approval_friction_factors,
            constraints=constraints,
            confidence=confidence,
            evidence_count=len(all_facts),
            citation_ids=list(used_citation_ids),
        )
