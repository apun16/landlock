"""CrewAI agents for policy and development analysis"""

from .budget_analyst import BudgetAnalyst
from .policy_analyst import PolicyAnalyst
from .underwriter import Underwriter

# CrewAI implementations (with fallback to deterministic)
try:
    from .crew_agents import (
        create_budget_analyst_agent,
        create_policy_analyst_agent,
        create_underwriter_agent,
        analyze_with_crewai_budget_analyst,
        analyze_with_crewai_policy_analyst,
        analyze_with_crewai_underwriter,
        CREWAI_AVAILABLE,
    )
    __all__ = [
        "BudgetAnalyst",
        "PolicyAnalyst",
        "Underwriter",
        "create_budget_analyst_agent",
        "create_policy_analyst_agent",
        "create_underwriter_agent",
        "analyze_with_crewai_budget_analyst",
        "analyze_with_crewai_policy_analyst",
        "analyze_with_crewai_underwriter",
        "CREWAI_AVAILABLE",
    ]
except ImportError:
    CREWAI_AVAILABLE = False
    __all__ = ["BudgetAnalyst", "PolicyAnalyst", "Underwriter", "CREWAI_AVAILABLE"]
