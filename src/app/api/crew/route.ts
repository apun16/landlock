import { NextRequest, NextResponse } from 'next/server';
import { crewOrchestrator } from '@/lib/agents/crew-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regionId } = body;

    if (!regionId) {
      return NextResponse.json(
        { error: 'regionId is required' },
        { status: 400 }
      );
    }

    const result = await crewOrchestrator.runCrew(regionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Crew execution error:', error);
    return NextResponse.json(
      { 
        error: 'Crew execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const regionId = searchParams.get('regionId');

    if (!regionId) {
      const agents = crewOrchestrator.getAgents();
      return NextResponse.json({
        agents,
        description: 'Multi-agent crew for comprehensive wildfire risk analysis',
        agentCount: 3,
        capabilities: [
          'Data quality validation',
          'Insurance risk assessment',
          'Mitigation strategy development'
        ]
      });
    }

    const result = await crewOrchestrator.runCrew(regionId);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Crew info error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve crew information' },
      { status: 500 }
    );
  }
}
