"""CLI for running the pipeline"""
import json
import sys
from pathlib import Path

from backend.config import Settings
from backend.pipeline.runner import PipelineRunner
from backend.models.discovered_source import SourceCategory


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Landlock Backend - Policy & Development Analysis Pipeline"
    )
    parser.add_argument(
        "--region",
        required=True,
        help="Region identifier (e.g., 'vancouver')"
    )
    parser.add_argument(
        "--base-url",
        required=True,
        help="Base URL of city website (e.g., 'https://vancouver.ca')"
    )
    parser.add_argument(
        "--budget-entry",
        action="append",
        help="Budget entry point URL (can specify multiple)"
    )
    parser.add_argument(
        "--zoning-entry",
        action="append",
        help="Zoning entry point URL (can specify multiple)"
    )
    parser.add_argument(
        "--proposal-entry",
        action="append",
        help="Proposal entry point URL (can specify multiple)"
    )
    parser.add_argument(
        "--analytics-entry",
        action="append",
        help="Analytics entry point URL (can specify multiple)"
    )
    parser.add_argument(
        "--from-registry",
        action="store_true",
        help="Use already-scraped sources from registry"
    )
    parser.add_argument(
        "--output",
        help="Output file path (default: stdout)"
    )
    
    args = parser.parse_args()
    
    known_entry_points = {}
    
    if args.budget_entry:
        known_entry_points[SourceCategory.BUDGET] = args.budget_entry
    if args.zoning_entry:
        known_entry_points[SourceCategory.ZONING] = args.zoning_entry
    if args.proposal_entry:
        known_entry_points[SourceCategory.PROPOSALS] = args.proposal_entry
    if args.analytics_entry:
        known_entry_points[SourceCategory.ANALYTICS] = args.analytics_entry
    
    if not known_entry_points:
        known_entry_points = {
            SourceCategory.BUDGET: ["/budget", "/finance"],
            SourceCategory.ZONING: ["/planning", "/zoning"],
            SourceCategory.PROPOSALS: ["/development", "/applications"],
            SourceCategory.ANALYTICS: ["/statistics", "/demographics"],
        }
    
    settings = Settings()
    runner = PipelineRunner(settings)
    
    try:
        if args.from_registry:
            output = runner.run_from_registry(args.region)
        else:
            if not args.base_url:
                print("Error: --base-url required when not using --from-registry", file=sys.stderr)
                sys.exit(1)
            
            output = runner.run_pipeline(
                args.region,
                args.base_url,
                known_entry_points
            )
        
        output_json = output.model_dump_json(indent=2)
        
        if args.output:
            Path(args.output).write_text(output_json)
            print(f"Output written to {args.output}")
        else:
            print(output_json)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
