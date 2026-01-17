import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/lib/state/region-state';
import { BC_FIRE_CENTRES, BC_MAJOR_MUNICIPALITIES } from '@/lib/data/sources';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    const regions = stateManager.getAllRegions();
    let filteredRegions = type ? regions.filter(r => r.regionType === type) : regions;

    const regionSummaries = filteredRegions.map(region => ({
      id: region.regionId,
      name: region.regionName,
      type: region.regionType,
      riskScore: region.riskScore?.overallScore || null,
      riskCategory: region.riskScore?.category || null,
      hasData: region.hazardData.historicalFires.length > 0 || region.zoningData.zones.length > 0,
      lastAnalyzed: region.lastAnalyzed,
      dataQualityScore: region.dataQuality?.dataQualityScore || null
    }));

    const missingFireCentres = BC_FIRE_CENTRES
      .filter(fc => !regions.find(r => r.regionId === fc.id))
      .map(fc => ({ id: fc.id, name: fc.name, type: 'fire_centre', riskScore: null, riskCategory: null, hasData: false, lastAnalyzed: null, dataQualityScore: null }));

    const missingMunicipalities = BC_MAJOR_MUNICIPALITIES
      .filter(m => !regions.find(r => r.regionId === m.id))
      .map(m => ({ id: m.id, name: m.name, type: 'municipality', riskScore: null, riskCategory: null, hasData: false, lastAnalyzed: null, dataQualityScore: null, population: m.population, regionalDistrict: m.regionalDistrict }));

    const allRegions = [
      ...regionSummaries,
      ...(type !== 'municipality' ? missingFireCentres : []),
      ...(type !== 'fire_centre' ? missingMunicipalities : [])
    ];

    return NextResponse.json({
      regions: allRegions,
      counts: {
        total: allRegions.length,
        analyzed: regionSummaries.filter(r => r.riskScore !== null).length,
        fireCentres: BC_FIRE_CENTRES.length,
        municipalities: BC_MAJOR_MUNICIPALITIES.length
      }
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
