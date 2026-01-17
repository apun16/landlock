import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/lib/state/region-state';
import { insuranceRiskAnalyst } from '@/lib/agents/insurance-risk-analyst';

export async function GET(request: NextRequest, { params }: { params: Promise<{ regionId: string }> }) {
  try {
    const { regionId } = await params;
    const region = stateManager.getRegion(regionId);

    if (!region) {
      return NextResponse.json({ error: 'Region not found', regionId }, { status: 404 });
    }

    const report = region.reports.length > 0 ? region.reports[region.reports.length - 1] : null;

    return NextResponse.json({
      regionId: region.regionId,
      regionName: region.regionName,
      regionType: region.regionType,
      riskScore: region.riskScore,
      latestReport: report,
      costProjections: region.costProjections,
      recoveryScenarios: region.recoveryScenarios,
      agentConclusions: region.agentConclusions.slice(-5),
      dataQuality: region.dataQuality,
      lastAnalyzed: region.lastAnalyzed,
      hazardSummary: {
        totalHistoricalFires: region.hazardData.historicalFires.length,
        totalAreaBurnedHa: region.hazardData.historicalFires.reduce((sum, f) => sum + f.areaBurnedHa, 0),
        lastUpdated: region.hazardData.lastUpdated
      },
      zoningSummary: {
        totalZones: region.zoningData.zones.length,
        developedPercent: region.zoningData.developedPercentage,
        underdevelopedPercent: region.zoningData.underdevelopedPercentage,
        lastUpdated: region.zoningData.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error fetching region risk:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ regionId: string }> }) {
  try {
    const { regionId } = await params;
    
    let region = stateManager.getRegion(regionId);
    if (!region) {
      stateManager.setRegion(regionId, { regionId, regionName: regionId, regionType: 'municipality' });
      region = stateManager.getRegion(regionId);
    }

    const result = await insuranceRiskAnalyst.analyzeRegion(regionId);

    return NextResponse.json({
      success: true,
      regionId,
      riskScore: result.riskScore,
      report: result.report,
      conclusionCount: result.conclusions.length,
      analyzedAt: new Date()
    });
  } catch (error) {
    console.error('Error running risk analysis:', error);
    return NextResponse.json({ error: 'Analysis failed', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
