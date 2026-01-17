import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/lib/state/region-state';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');

    let rankings = stateManager.getGlobalRankings();

    if (category) {
      const allRegions = stateManager.getAllRegions();
      const categoryRegionIds = allRegions.filter(r => r.riskScore?.category === category).map(r => r.regionId);
      rankings = rankings.filter(r => categoryRegionIds.includes(r.regionId));
    }

    rankings = rankings.slice(0, limit);

    const enrichedRankings = rankings.map(ranking => {
      const region = stateManager.getRegion(ranking.regionId);
      return {
        ...ranking,
        riskCategory: region?.riskScore?.category || 'unknown',
        components: region?.riskScore?.components,
        lastAnalyzed: region?.lastAnalyzed
      };
    });

    return NextResponse.json({
      rankings: enrichedRankings,
      totalRegions: stateManager.getAllRegions().length,
      scoredRegions: rankings.length,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
