import {
  WildfirePerimeter,
  WildfireHotspot,
  WildfireStatistics,
  FireWeatherIndex,
  GeoFeatureCollection,
  GeoFeature,
  GeoPolygon
} from '../types/hazard';
import { dataFetcher, validateGeoJSON, FetchMetadata } from './data-fetcher';
import { getDataSourceById, BC_FIRE_CENTRES } from '../data/sources';

interface BCWildfirePerimeterProperties {
  FIRE_NUMBER: string;
  FIRE_YEAR: number;
  FIRE_LABEL: string;
  FIRE_CAUSE: string;
  FIRE_SIZE_HECTARES: number;
  FIRE_STATUS: string;
  FIRE_CENTRE: string;
  ZONE: string;
  IGNITION_DATE: string;
  FIRE_OUT_DATE?: string;
  GEOGRAPHIC_DESCRIPTION?: string;
  CURRENT_SIZE: number;
  FIRE_TYPE?: string;
  INCIDENT_NAME?: string;
}

interface CWFISHotspotProperties {
  lat: number;
  lon: number;
  src: string;
  datetime: string;
  conf: number;
  frp: number;
  prov: string;
  brtemp: number;
}

interface BCFireCentreProperties {
  FIRE_CENTRE_NAME: string;
  FIRE_CENTRE_ID: number;
  MAILING_ADDRESS?: string;
  PHONE_NUMBER?: string;
  OBJECTID: number;
}

export class WildfireIngestionService {
  
  async fetchCurrentPerimeters(): Promise<{
    perimeters: WildfirePerimeter[];
    metadata: FetchMetadata;
    validation: ReturnType<typeof validateGeoJSON>;
  }> {
    const source = getDataSourceById('bc-wildfire-perimeters');
    if (!source) throw new Error('BC wildfire perimeters source not found');

    const result = await dataFetcher.fetchFromSource<GeoFeatureCollection<BCWildfirePerimeterProperties>>(source);
    const validation = validateGeoJSON(result.data);
    const perimeters = this.normalizePerimeters(result.data);

    return { perimeters, metadata: result.metadata, validation };
  }

  async fetchHistoricalPerimeters(options: { startYear?: number; endYear?: number; fireCentre?: string } = {}): Promise<{
    perimeters: WildfirePerimeter[];
    metadata: FetchMetadata;
    validation: ReturnType<typeof validateGeoJSON>;
  }> {
    const source = getDataSourceById('bc-wildfire-historical');
    if (!source) throw new Error('BC historical wildfire source not found');

    const filters: string[] = [];
    if (options.startYear) filters.push(`FIRE_YEAR >= ${options.startYear}`);
    if (options.endYear) filters.push(`FIRE_YEAR <= ${options.endYear}`);
    if (options.fireCentre) filters.push(`FIRE_CENTRE = '${options.fireCentre}'`);

    let url = source.url;
    if (filters.length > 0) {
      url = dataFetcher.buildWFSUrl(source.url, { cqlFilter: filters.join(' AND ') });
    }

    const result = await dataFetcher.fetchFromSource<GeoFeatureCollection<BCWildfirePerimeterProperties>>(
      { ...source, url }, 
      { cache: true, cacheKey: `historical-${JSON.stringify(options)}` }
    );
    const validation = validateGeoJSON(result.data);
    const perimeters = this.normalizePerimeters(result.data);

    return { perimeters, metadata: result.metadata, validation };
  }

  async fetchActiveHotspots(): Promise<{
    hotspots: WildfireHotspot[];
    metadata: FetchMetadata;
    validation: ReturnType<typeof validateGeoJSON>;
  }> {
    const source = getDataSourceById('cwfis-hotspots');
    if (!source) throw new Error('CWFIS hotspots source not found');

    const result = await dataFetcher.fetchFromSource<GeoFeatureCollection<CWFISHotspotProperties>>(source);
    const validation = validateGeoJSON(result.data);
    const hotspots = this.normalizeHotspots(result.data);

    return { hotspots, metadata: result.metadata, validation };
  }

  async fetchFireCentres(): Promise<{ centres: GeoFeatureCollection<BCFireCentreProperties>; metadata: FetchMetadata }> {
    const source = getDataSourceById('bc-fire-centres');
    if (!source) throw new Error('BC fire centres source not found');
    const result = await dataFetcher.fetchFromSource<GeoFeatureCollection<BCFireCentreProperties>>(source);
    return { centres: result.data, metadata: result.metadata };
  }

  async fetchFireZones(): Promise<{ zones: GeoFeatureCollection; metadata: FetchMetadata }> {
    const source = getDataSourceById('bc-fire-zones');
    if (!source) throw new Error('BC fire zones source not found');
    const result = await dataFetcher.fetchFromSource<GeoFeatureCollection>(source);
    return { zones: result.data, metadata: result.metadata };
  }

  calculateStatistics(perimeters: WildfirePerimeter[]): WildfireStatistics[] {
    const statsMap = new Map<string, WildfireStatistics>();

    for (const centre of BC_FIRE_CENTRES) {
      const years = [...new Set(perimeters.map(p => p.fireYear))];
      for (const year of years) {
        const key = `${centre.name}-${year}`;
        statsMap.set(key, {
          year,
          fireCentre: centre.name,
          totalFires: 0,
          totalAreaBurnedHa: 0,
          averageFireSizeHa: 0,
          lightningCaused: 0,
          humanCaused: 0,
          structuresDestroyed: 0,
          estimatedCost: 0,
          evacuationOrders: 0
        });
      }
    }

    for (const perimeter of perimeters) {
      const key = `${perimeter.fireCentre}-${perimeter.fireYear}`;
      const stats = statsMap.get(key);
      
      if (stats) {
        stats.totalFires++;
        stats.totalAreaBurnedHa += perimeter.areaBurnedHa;
        if (perimeter.cause === 'lightning') stats.lightningCaused++;
        else if (perimeter.cause === 'human') stats.humanCaused++;
        if (perimeter.structuresLost) stats.structuresDestroyed += perimeter.structuresLost;
        if (perimeter.estimatedCost) stats.estimatedCost += perimeter.estimatedCost;
      }
    }

    for (const stats of statsMap.values()) {
      if (stats.totalFires > 0) {
        stats.averageFireSizeHa = stats.totalAreaBurnedHa / stats.totalFires;
      }
    }

    return Array.from(statsMap.values()).filter(s => s.totalFires > 0);
  }

  async fetchPerimetersInBoundingBox(
    minLng: number, minLat: number, maxLng: number, maxLat: number, historical: boolean = true
  ): Promise<WildfirePerimeter[]> {
    const sourceId = historical ? 'bc-wildfire-historical' : 'bc-wildfire-perimeters';
    const source = getDataSourceById(sourceId);
    if (!source) throw new Error(`${sourceId} source not found`);

    const url = dataFetcher.buildWFSUrl(source.url, { bbox: { minLng, minLat, maxLng, maxLat } });
    const result = await dataFetcher.fetchFromSource<GeoFeatureCollection<BCWildfirePerimeterProperties>>(
      { ...source, url }, 
      { cache: false }
    );
    return this.normalizePerimeters(result.data);
  }

  private normalizePerimeters(data: GeoFeatureCollection<BCWildfirePerimeterProperties>): WildfirePerimeter[] {
    return data.features.filter(f => f.geometry !== null).map(feature => this.normalizePerimeter(feature));
  }

  private normalizePerimeter(feature: GeoFeature<BCWildfirePerimeterProperties>): WildfirePerimeter {
    const props = feature.properties;
    return {
      fireId: props.FIRE_NUMBER,
      fireName: props.FIRE_LABEL || props.INCIDENT_NAME || props.FIRE_NUMBER,
      fireYear: props.FIRE_YEAR,
      startDate: new Date(props.IGNITION_DATE),
      containedDate: props.FIRE_OUT_DATE ? new Date(props.FIRE_OUT_DATE) : undefined,
      areaBurnedHa: props.FIRE_SIZE_HECTARES || props.CURRENT_SIZE || 0,
      fireCentre: this.normalizeFireCentre(props.FIRE_CENTRE),
      fireZone: props.ZONE || 'Unknown',
      cause: this.normalizeFireCause(props.FIRE_CAUSE),
      status: this.normalizeFireStatus(props.FIRE_STATUS),
      geometry: feature.geometry as GeoPolygon,
      structuresLost: undefined,
      estimatedCost: this.estimateFireCost(props.FIRE_SIZE_HECTARES || 0)
    };
  }

  private normalizeHotspots(data: GeoFeatureCollection<CWFISHotspotProperties>): WildfireHotspot[] {
    return data.features.map((feature, index) => {
      const props = feature.properties;
      return {
        id: `hotspot-${index}-${props.datetime}`,
        latitude: props.lat,
        longitude: props.lon,
        confidence: props.conf,
        detectedAt: new Date(props.datetime),
        satellite: props.src,
        brightness: props.brtemp,
        frp: props.frp
      };
    });
  }

  private normalizeFireCentre(raw: string): string {
    if (!raw) return 'Unknown';
    const centreMap: Record<string, string> = {
      'cariboo': 'Cariboo Fire Centre',
      'coastal': 'Coastal Fire Centre',
      'kamloops': 'Kamloops Fire Centre',
      'northwest': 'Northwest Fire Centre',
      'prince george': 'Prince George Fire Centre',
      'southeast': 'Southeast Fire Centre',
      'c': 'Cariboo Fire Centre',
      'v': 'Coastal Fire Centre',
      'k': 'Kamloops Fire Centre',
      'r': 'Northwest Fire Centre',
      'g': 'Prince George Fire Centre',
      'n': 'Southeast Fire Centre'
    };
    return centreMap[raw.toLowerCase().trim()] || raw;
  }

  private normalizeFireCause(raw: string): 'lightning' | 'human' | 'unknown' {
    if (!raw) return 'unknown';
    const lower = raw.toLowerCase();
    if (lower.includes('lightning')) return 'lightning';
    if (lower.includes('human') || lower.includes('person')) return 'human';
    return 'unknown';
  }

  private normalizeFireStatus(raw: string): 'active' | 'contained' | 'out' {
    if (!raw) return 'out';
    const lower = raw.toLowerCase();
    if (lower.includes('out') || lower.includes('extinguished')) return 'out';
    if (lower.includes('contain') || lower.includes('held')) return 'contained';
    return 'active';
  }

  private estimateFireCost(areaHa: number): number {
    if (areaHa < 10) return areaHa * 5000;
    if (areaHa < 100) return areaHa * 3000;
    if (areaHa < 1000) return areaHa * 1500;
    if (areaHa < 10000) return areaHa * 800;
    return areaHa * 500;
  }
}

export class FireWeatherService {
  async getCurrentFWI(): Promise<FireWeatherIndex[]> {
    return BC_FIRE_CENTRES.map(centre => ({
      regionId: centre.id,
      date: new Date(),
      fwi: Math.random() * 30 + 5,
      ffmc: Math.random() * 99,
      dmc: Math.random() * 200,
      dc: Math.random() * 500,
      isi: Math.random() * 20,
      bui: Math.random() * 150,
      dangerRating: this.calculateDangerRating(Math.random() * 30 + 5)
    }));
  }

  private calculateDangerRating(fwi: number): FireWeatherIndex['dangerRating'] {
    if (fwi < 5) return 'low';
    if (fwi < 10) return 'moderate';
    if (fwi < 20) return 'high';
    if (fwi < 30) return 'very_high';
    return 'extreme';
  }
}

export const wildfireIngestion = new WildfireIngestionService();
export const fireWeatherService = new FireWeatherService();

export async function fetchAllWildfireData() {
  const [current, hotspots, centres, zones] = await Promise.all([
    wildfireIngestion.fetchCurrentPerimeters().catch(err => ({ perimeters: [] as WildfirePerimeter[], metadata: null, validation: null, error: err.message })),
    wildfireIngestion.fetchActiveHotspots().catch(err => ({ hotspots: [] as WildfireHotspot[], metadata: null, validation: null, error: err.message })),
    wildfireIngestion.fetchFireCentres().catch(err => ({ centres: null, metadata: null, error: err.message })),
    wildfireIngestion.fetchFireZones().catch(err => ({ zones: null, metadata: null, error: err.message }))
  ]);

  return { currentPerimeters: current, activeHotspots: hotspots, fireCentres: centres, fireZones: zones, fetchedAt: new Date() };
}

export async function fetchRecentHistoricalFires(years: number = 10) {
  const currentYear = new Date().getFullYear();
  return wildfireIngestion.fetchHistoricalPerimeters({ startYear: currentYear - years, endYear: currentYear - 1 });
}
