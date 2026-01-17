"""Budget Analyst agent - analyzes funding strength"""
from typing import List
from backend.models.extracted_fact import ExtractedFact, FactType
from backend.models.agent_outputs import BudgetAnalystOutput
from backend.models.citation import Citation


class BudgetAnalyst:
    """Analyzes budget facts and outputs funding strength score"""
    
    def analyze(
        self,
        facts: List[ExtractedFact],
        citations: List[Citation]
    ) -> BudgetAnalystOutput:
        """
        Analyze budget facts and produce output
        
        Args:
            facts: List of extracted facts (filtered to budget facts)
            citations: List of citations
        
        Returns:
            BudgetAnalystOutput with scores and key allocations
        """
        budget_facts = [f for f in facts if f.fact_type == FactType.BUDGET]
        
        if not budget_facts:
            return BudgetAnalystOutput(
                funding_strength_score=None,
                key_allocations=[],
                confidence=0.0,
                evidence_count=0,
                citation_ids=[],
            )
        
        score = min(len(budget_facts) * 10, 100)
        
        key_allocations = []
        used_citation_ids = set()
        
        for fact in budget_facts:
            if fact.value and fact.citation_ids:
                key_allocations.append({
                    "key": fact.key,
                    "value": fact.value,
                    "unit": fact.unit or "CAD",
                    "timeframe": fact.timeframe,
                    "citation_ids": fact.citation_ids,
                })
                used_citation_ids.update(fact.citation_ids)
        
        facts_with_citations = sum(1 for f in budget_facts if f.citation_ids)
        confidence = min(facts_with_citations / max(len(budget_facts), 1), 1.0)
        
        if len(budget_facts) < 3:
            score = max(score - 20, 0) if score else None
        
        return BudgetAnalystOutput(
            funding_strength_score=score if len(budget_facts) >= 2 else None,
            key_allocations=key_allocations,
            confidence=confidence,
            evidence_count=len(budget_facts),
            citation_ids=list(used_citation_ids),
        )
