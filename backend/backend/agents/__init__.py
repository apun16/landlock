"""CrewAI agents for policy and development analysis"""

from .budget_analyst import BudgetAnalyst
from .policy_analyst import PolicyAnalyst
from .underwriter import Underwriter

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
    from .production_crew import (
        create_production_crew,
        run_production_crew,
    )
    from .shared_state import (
        SharedStateManager,
        AgentState,
        LANGGRAPH_AVAILABLE,
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
        "create_production_crew",
        "run_production_crew",
        "SharedStateManager",
        "AgentState",
        "CREWAI_AVAILABLE",
        "LANGGRAPH_AVAILABLE",
    ]
except ImportError:
    CREWAI_AVAILABLE = False
    LANGGRAPH_AVAILABLE = False
    try:
        from .shared_state import SharedStateManager, AgentState
        __all__ = [
            "BudgetAnalyst",
            "PolicyAnalyst",
            "Underwriter",
            "SharedStateManager",
            "AgentState",
            "CREWAI_AVAILABLE",
            "LANGGRAPH_AVAILABLE",
        ]
    except ImportError:
        __all__ = ["BudgetAnalyst", "PolicyAnalyst", "Underwriter", "CREWAI_AVAILABLE"]
