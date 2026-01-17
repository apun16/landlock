import { NextRequest, NextResponse } from 'next/server';
import { automationPipeline } from '@/lib/services/automation-pipeline';
import { stateManager } from '@/lib/state/region-state';

export async function GET() {
  try {
    const status = automationPipeline.getStatus();
    const pipelineState = stateManager.getPipelineStatus();
    const recentEvents = stateManager.getRecentEvents(20);

    return NextResponse.json({
      status: { ...status, ...pipelineState },
      recentEvents,
      regions: {
        total: stateManager.getAllRegions().length,
        scored: stateManager.getAllRegions().filter(r => r.riskScore).length
      }
    });
  } catch (error) {
    console.error('Error fetching pipeline status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action = 'full' } = body;

    if (action === 'full') {
      const result = await automationPipeline.runFullPipeline();
      return NextResponse.json({
        success: result.success,
        summary: result.summary,
        stages: result.stages.map(s => ({
          stage: s.stage,
          success: s.success,
          duration: s.duration,
          recordsProcessed: s.recordsProcessed,
          errorCount: s.errors.length,
          warningCount: s.warnings.length
        })),
        totalDuration: result.totalDuration
      });
    }

    if (action === 'schedule') {
      automationPipeline.startScheduledExecution();
      return NextResponse.json({ success: true, message: 'Scheduled execution started' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error running pipeline:', error);
    return NextResponse.json({ error: 'Pipeline execution failed', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    automationPipeline.stopScheduledExecution();
    return NextResponse.json({ success: true, message: 'Scheduled execution stopped' });
  } catch (error) {
    console.error('Error stopping pipeline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
