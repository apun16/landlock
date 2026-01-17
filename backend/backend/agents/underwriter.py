"""Underwriter agent - evaluates development feasibility"""
from typing import List, Literal
from backend.models.extracted_fact import ExtractedFact, FactType
from backend.models.agent_outputs import (
    BudgetAnalystOutput,
    PolicyAnalystOutput,
    UnderwriterOutput,
)
from backend.models.citation import Citation


class Underwriter:
    """Evaluates feasibility based on budget, policy, and demographic facts"""
    
    def analyze(
        self,
        budget_output: BudgetAnalystOutput,
        policy_output: PolicyAnalystOutput,
        facts: List[ExtractedFact],
        citations: List[Citation]
    ) -> UnderwriterOutput:
        """
        Analyze all inputs and produce underwriter verdict
        
        Args:
            budget_output: Budget analysis output
            policy_output: Policy analysis output
            facts: All extracted facts
            citations: List of citations
        
        Returns:
            UnderwriterOutput with verdict, pros, cons, constraints
        """
        # Calculate feasibility score
        feasibility_score = None
        score_components = []
        
        if budget_output.funding_strength_score is not None:
            score_components.append(budget_output.funding_strength_score * 0.4)  # 40% weight
        
        if policy_output.zoning_flexibility_score is not None:
            score_components.append(policy_output.zoning_flexibility_score * 0.3)  # 30% weight
        
        if policy_output.proposal_momentum_score is not None:
            score_components.append(policy_output.proposal_momentum_score * 0.3)  # 30% weight
        
        if score_components:
            feasibility_score = int(sum(score_components))
        
        verdict: Literal["go", "caution", "avoid", "unknown"] = "unknown"
        
        if feasibility_score is not None:
            if feasibility_score >= 70:
                verdict = "go"
            elif feasibility_score >= 50:
                verdict = "caution"
            else:
                verdict = "avoid"
        else:
            if budget_output.evidence_count == 0 and policy_output.evidence_count == 0:
                verdict = "unknown"
            elif budget_output.evidence_count > 0 and policy_output.evidence_count == 0:
                verdict = "caution"
            else:
                verdict = "caution"
        
        plan_variant: Literal["A", "B", "C", "unknown"] = "unknown"
        if verdict == "go":
            plan_variant = "A"
        elif verdict == "caution":
            plan_variant = "B"
        elif verdict == "avoid":
            plan_variant = "C"
        
        pros = []
        cons = []
        constraints = []
        
        used_citation_ids = set()
        used_fact_ids = set()
        
        if budget_output.funding_strength_score and budget_output.funding_strength_score >= 60:
            budget_facts = [f for f in facts if f.fact_type == FactType.BUDGET and f.citation_ids]
            if budget_facts:
                fact_ids = [f.id for f in budget_facts]
                cite_ids = []
                for f in budget_facts:
                    cite_ids.extend(f.citation_ids)
                
                pros.append({
                    "description": f"Strong funding environment (score: {budget_output.funding_strength_score})",
                    "supporting_fact_ids": fact_ids,
                    "citation_ids": list(set(cite_ids)),
                })
                used_fact_ids.update(fact_ids)
                used_citation_ids.update(cite_ids)
        
        if policy_output.zoning_flexibility_score and policy_output.zoning_flexibility_score >= 60:
            zoning_facts = [f for f in facts if f.fact_type == FactType.ZONING and f.citation_ids]
            if zoning_facts:
                fact_ids = [f.id for f in zoning_facts]
                cite_ids = []
                for f in zoning_facts:
                    cite_ids.extend(f.citation_ids)
                
                pros.append({
                    "description": f"Flexible zoning regulations (score: {policy_output.zoning_flexibility_score})",
                    "supporting_fact_ids": fact_ids,
                    "citation_ids": list(set(cite_ids)),
                })
                used_fact_ids.update(fact_ids)
                used_citation_ids.update(cite_ids)
        
        if budget_output.funding_strength_score and budget_output.funding_strength_score < 40:
            budget_facts = [f for f in facts if f.fact_type == FactType.BUDGET and f.citation_ids]
            if budget_facts:
                fact_ids = [f.id for f in budget_facts]
                cite_ids = []
                for f in budget_facts:
                    cite_ids.extend(f.citation_ids)
                
                cons.append({
                    "description": f"Limited funding availability (score: {budget_output.funding_strength_score})",
                    "supporting_fact_ids": fact_ids,
                    "citation_ids": list(set(cite_ids)),
                })
                used_fact_ids.update(fact_ids)
                used_citation_ids.update(cite_ids)
        
        if policy_output.approval_friction_factors:
            proposal_facts = [f for f in facts if f.fact_type == FactType.PROPOSAL and f.citation_ids]
            if proposal_facts:
                fact_ids = [f.id for f in proposal_facts]
                cite_ids = []
                for f in proposal_facts:
                    cite_ids.extend(f.citation_ids)
                
                cons.append({
                    "description": "Approval friction: " + "; ".join(policy_output.approval_friction_factors),
                    "supporting_fact_ids": fact_ids,
                    "citation_ids": list(set(cite_ids)),
                })
                used_fact_ids.update(fact_ids)
                used_citation_ids.update(cite_ids)
        
        if policy_output.constraints:
            zoning_facts = [f for f in facts if f.fact_type == FactType.ZONING and f.citation_ids]
            if zoning_facts:
                fact_ids = [f.id for f in zoning_facts]
                cite_ids = []
                for f in zoning_facts:
                    cite_ids.extend(f.citation_ids)
                
                constraints.append({
                    "description": "; ".join(policy_output.constraints),
                    "supporting_fact_ids": fact_ids,
                    "citation_ids": list(set(cite_ids)),
                })
                used_fact_ids.update(fact_ids)
                used_citation_ids.update(cite_ids)
        
        total_evidence = budget_output.evidence_count + policy_output.evidence_count
        confidence = min(total_evidence / 10.0, 1.0) if total_evidence > 0 else 0.0
        
        used_citation_ids.update(budget_output.citation_ids)
        used_citation_ids.update(policy_output.citation_ids)
        
        return UnderwriterOutput(
            feasibility_score=feasibility_score,
            verdict=verdict,
            plan_variant=plan_variant,
            pros=pros,
            cons=cons,
            constraints=constraints,
            confidence=confidence,
            evidence_count=total_evidence,
            citation_ids=list(used_citation_ids),
        )
