import {
  ZoningRegion,
  ZoningCategory,
  DevelopmentIndicators,
  GeoFeatureCollection,
  GeoFeature,
  GeoPolygon
} from '../types/hazard';
import { dataFetcher, validateGeoJSON, FetchMetadata } from './data-fetcher';
import { getDataSourceById, BC_MAJOR_MUNICIPALITIES } from '../data/sources';

interface VancouverZoningProperties {
  zone_category: string;
  zone_classification: string;
  zone_label: string;
  zone_name: string;
  zone_shape_area: number;
  zoning_distr: string;
}

interface BCMunicipalityProperties {
  ADMIN_AREA_NAME: string;
  ADMIN_AREA_GROUP_NAME: string;
  ADMIN_AREA_ABBREVIATION: string;
  WHEN_UPDATED: string;
  FEATURE_AREA_SQM: number;
  FEATURE_LENGTH_M: number;
  OBJECTID: number;
}

interface BCRegionalDistrictProperties {
  REGIONAL_DISTRICT_NAME: string;
  REGIONAL_DISTRICT_ID: number;
  FEATURE_AREA_SQM: number;
  WHEN_UPDATED: string;
  OBJECTID: number;
}

interface BCLandCoverProperties {
  PRESENT_LAND_USE_LABEL: string;
  FEATURE_AREA_SQM: number;
  OBJECTID: number;
}

export class ZoningIngestionService {
  
  async fetchVancouverZoning(): Promise<{
    zones: ZoningRegion[];
    metadata: FetchMetadata;
    validation: ReturnType<typeof validateGeoJSON>;
  }> {
    const source = getDataSourceById('vancouver-zoning');
    if (!source) throw new Error('Vancouver zoning source not found');

    const result = await dataFetcher.fetchFromSource<GeoFeatureCollection<VancouverZoningProperties>>(source);
    const validation = validateGeoJSON(result.data);
    const zones = this.normalizeVancouverZoning(result.data);

    return { zones, metadata: result.metadata, validation };
  }

  async fetchMunicipalities(): Promise<{ municipalities: GeoFeatureCollection<BCMunicipalityProperties>; metadata: FetchMetadata }> {
    const source = getDataSourceById('bc-municipalities');
    if (!source) throw new Error('BC municipalities source not found');
    const result = await dataFetcher.fetchFromSource<GeoFeatureCollection<BCMunicipalityProperties>>(source);
    return { municipalities: result.data, metadata: result.metadata };
  }

  async fetchRegionalDistricts(): Promise<{ districts: GeoFeatureCollection<BCRegionalDistrictProperties>; metadata: FetchMetadata }> {
    const source = getDataSourceById('bc-regional-districts');
    if (!source) throw new Error('BC regional districts source not found');
    const result = await dataFetcher.fetchFromSource<GeoFeatureCollection<BCRegionalDistrictProperties>>(source);
    return { districts: result.data, metadata: result.metadata };
  }

  async fetchLandCover(bbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number }): Promise<{
    landCover: GeoFeatureCollection<BCLandCoverProperties>;
    metadata: FetchMetadata;
  }> {
    const source = getDataSourceById('bc-land-cover');
    if (!source) throw new Error('BC land cover source not found');

    let url = source.url;
    if (bbox) url = dataFetcher.buildWFSUrl(source.url, { bbox });

    const result = await dataFetcher.fetchFromSource<GeoFeatureCollection<BCLandCoverProperties>>({ ...source, url });
    return { landCover: result.data, metadata: result.metadata };
  }

  async fetchMunicipalityZoning(municipalityId: string): Promise<{
    zones: ZoningRegion[];
    metadata: FetchMetadata;
    validation: ReturnType<typeof validateGeoJSON>;
  } | null> {
    const sourceMap: Record<string, string> = {
      'vancouver': 'vancouver-zoning',
      'surrey': 'surrey-zoning',
      'burnaby': 'burnaby-zoning'
    };

    const sourceId = sourceMap[municipalityId.toLowerCase()];
    if (!sourceId) return null;

    const source = getDataSourceById(sourceId);
    if (!source) return null;

    try {
      const result = await dataFetcher.fetchFromSource<GeoFeatureCollection>(source);
      const validation = validateGeoJSON(result.data);
      
      let zones: ZoningRegion[];
      if (municipalityId.toLowerCase() === 'vancouver') {
        zones = this.normalizeVancouverZoning(result.data as unknown as GeoFeatureCollection<VancouverZoningProperties>);
      } else {
        zones = this.normalizeGenericZoning(result.data, municipalityId);
      }

      return { zones, metadata: result.metadata, validation };
    } catch {
      return null;
    }
  }

  calculateDevelopmentIndicators(zones: ZoningRegion[], _populationData?: Map<string, number>): DevelopmentIndicators[] {
    const developmentRatios: Record<ZoningCategory, number> = {
      residential_single: 0.85,
      residential_multi: 0.92,
      commercial: 0.95,
      industrial: 0.88,
      mixed_use: 0.90,
      agricultural: 0.15,
      parkland: 0.05,
      institutional: 0.80,
      rural: 0.25,
      undeveloped: 0.02
    };

    return zones.map(zone => ({
      regionId: zone.municipality.toLowerCase().replace(/\s+/g, '-'),
      populationDensity: this.estimatePopulationDensity(zone),
      buildingCoverage: developmentRatios[zone.zoningCategory] * 100,
      infrastructureValue: this.estimateInfrastructureValue(zone),
      growthRate5yr: this.estimateGrowthRate(zone.zoningCategory)
    }));
  }

  private normalizeVancouverZoning(data: GeoFeatureCollection<VancouverZoningProperties>): ZoningRegion[] {
    return data.features.filter(f => f.geometry !== null).map((feature, index) => this.normalizeVancouverZone(feature, index));
  }

  private normalizeVancouverZone(feature: GeoFeature<VancouverZoningProperties>, index: number): ZoningRegion {
    const props = feature.properties;
    return {
      id: `van-${props.zoning_distr || index}`,
      municipality: 'Vancouver',
      regionDistrict: 'Metro Vancouver',
      zoningCode: props.zone_label || props.zone_classification,
      zoningCategory: this.mapVancouverCategory(props.zone_category),
      zoningDescription: props.zone_name,
      geometry: feature.geometry as GeoPolygon,
      areaHa: (props.zone_shape_area || 0) / 10000,
      developmentStatus: this.determineDevelopmentStatus(this.mapVancouverCategory(props.zone_category)),
      allowedUses: this.getVancouverAllowedUses(props.zone_category)
    };
  }

  private normalizeGenericZoning(data: GeoFeatureCollection, municipalityName: string): ZoningRegion[] {
    return data.features.filter(f => f.geometry !== null).map((feature, index) => ({
      id: `${municipalityName.toLowerCase()}-${index}`,
      municipality: municipalityName,
      regionDistrict: 'Unknown',
      zoningCode: String(feature.properties?.zone_code || feature.properties?.ZONE || 'UNK'),
      zoningCategory: this.inferZoningCategory(feature.properties),
      zoningDescription: String(feature.properties?.zone_name || feature.properties?.DESCRIPTION || ''),
      geometry: feature.geometry as GeoPolygon,
      areaHa: this.calculateAreaHa(feature),
      developmentStatus: 'developed' as const,
      allowedUses: []
    }));
  }

  private mapVancouverCategory(category: string): ZoningCategory {
    if (!category) return 'undeveloped';
    const lower = category.toLowerCase();
    
    if (lower.includes('one-family') || lower.includes('rs-') || lower.includes('single')) return 'residential_single';
    if (lower.includes('multi') || lower.includes('rm-') || lower.includes('apartment')) return 'residential_multi';
    if (lower.includes('commercial') || lower.includes('c-')) return 'commercial';
    if (lower.includes('industrial') || lower.includes('i-') || lower.includes('m-')) return 'industrial';
    if (lower.includes('mixed') || lower.includes('comprehensive')) return 'mixed_use';
    if (lower.includes('agricultural') || lower.includes('ra-')) return 'agricultural';
    if (lower.includes('park') || lower.includes('recreation')) return 'parkland';
    if (lower.includes('institutional') || lower.includes('cd-')) return 'institutional';
    
    return 'undeveloped';
  }

  private inferZoningCategory(properties: Record<string, unknown> | null): ZoningCategory {
    if (!properties) return 'undeveloped';
    const searchStr = JSON.stringify(properties).toLowerCase();
    
    if (searchStr.includes('residential') && searchStr.includes('single')) return 'residential_single';
    if (searchStr.includes('residential') || searchStr.includes('multi')) return 'residential_multi';
    if (searchStr.includes('commercial')) return 'commercial';
    if (searchStr.includes('industrial')) return 'industrial';
    if (searchStr.includes('agricultural')) return 'agricultural';
    if (searchStr.includes('park')) return 'parkland';
    
    return 'undeveloped';
  }

  private determineDevelopmentStatus(category: ZoningCategory): 'developed' | 'underdeveloped' | 'undeveloped' {
    const developed: ZoningCategory[] = ['residential_single', 'residential_multi', 'commercial', 'industrial', 'mixed_use', 'institutional'];
    const underdeveloped: ZoningCategory[] = ['rural', 'agricultural'];
    
    if (developed.includes(category)) return 'developed';
    if (underdeveloped.includes(category)) return 'underdeveloped';
    return 'undeveloped';
  }

  private getVancouverAllowedUses(category: string): string[] {
    if (!category) return [];
    const lower = category.toLowerCase();
    
    if (lower.includes('one-family')) return ['Single-family dwelling', 'Secondary suite', 'Laneway house'];
    if (lower.includes('multi')) return ['Apartment', 'Townhouse', 'Ground-oriented housing'];
    if (lower.includes('commercial')) return ['Retail', 'Office', 'Service', 'Restaurant'];
    if (lower.includes('industrial')) return ['Manufacturing', 'Warehouse', 'Distribution'];
    
    return [];
  }

  private calculateAreaHa(feature: GeoFeature): number {
    const props = feature.properties as Record<string, unknown>;
    if (props?.FEATURE_AREA_SQM) return (props.FEATURE_AREA_SQM as number) / 10000;
    if (props?.area) return props.area as number;
    return 0;
  }

  private estimatePopulationDensity(zone: ZoningRegion): number {
    const densityMap: Record<ZoningCategory, number> = {
      residential_single: 3500,
      residential_multi: 12000,
      commercial: 2000,
      industrial: 500,
      mixed_use: 8000,
      agricultural: 50,
      parkland: 0,
      institutional: 1000,
      rural: 100,
      undeveloped: 10
    };
    return densityMap[zone.zoningCategory];
  }

  private estimateInfrastructureValue(zone: ZoningRegion): number {
    const valueMap: Record<ZoningCategory, number> = {
      residential_single: 15000000,
      residential_multi: 50000000,
      commercial: 80000000,
      industrial: 25000000,
      mixed_use: 60000000,
      agricultural: 500000,
      parkland: 1000000,
      institutional: 40000000,
      rural: 200000,
      undeveloped: 100000
    };
    return valueMap[zone.zoningCategory] * zone.areaHa;
  }

  private estimateGrowthRate(category: ZoningCategory): number {
    const growthMap: Record<ZoningCategory, number> = {
      residential_single: 2.5,
      residential_multi: 8.0,
      commercial: 5.0,
      industrial: 3.0,
      mixed_use: 10.0,
      agricultural: -1.0,
      parkland: 0.5,
      institutional: 2.0,
      rural: 1.0,
      undeveloped: 15.0
    };
    return growthMap[category];
  }
}

export const zoningIngestion = new ZoningIngestionService();

export async function fetchComprehensiveZoningData(municipalityId?: string) {
  const results = {
    municipalities: null as Awaited<ReturnType<ZoningIngestionService['fetchMunicipalities']>> | null,
    regionalDistricts: null as Awaited<ReturnType<ZoningIngestionService['fetchRegionalDistricts']>> | null,
    specificZoning: null as Awaited<ReturnType<ZoningIngestionService['fetchMunicipalityZoning']>> | null,
    fetchedAt: new Date()
  };

  const [municipalities, districts] = await Promise.all([
    zoningIngestion.fetchMunicipalities().catch(() => null),
    zoningIngestion.fetchRegionalDistricts().catch(() => null)
  ]);

  results.municipalities = municipalities;
  results.regionalDistricts = districts;

  if (municipalityId) {
    results.specificZoning = await zoningIngestion.fetchMunicipalityZoning(municipalityId);
  }

  return results;
}

export async function fetchMajorMunicipalitiesZoning() {
  const results = new Map<string, Awaited<ReturnType<ZoningIngestionService['fetchMunicipalityZoning']>>>();
  
  await Promise.all(BC_MAJOR_MUNICIPALITIES.map(async (muni) => {
    const data = await zoningIngestion.fetchMunicipalityZoning(muni.id);
    results.set(muni.id, data);
  }));

  return results;
}
