import { DataSource, GeoFeatureCollection, ValidationResult } from '../types/hazard';

interface FetchOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheKey?: string;
  transform?: (data: unknown) => unknown;
}

const DEFAULT_FETCH_OPTIONS: FetchOptions = {
  timeout: 30000,
  retries: 3,
  cache: true
};

const dataCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

export interface FetchMetadata {
  source: string;
  fromCache: boolean;
  fetchedAt: Date;
  recordCount: number;
  attempts?: number;
}

export interface WFSOptions {
  bbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number };
  cqlFilter?: string;
  maxFeatures?: number;
  startIndex?: number;
  sortBy?: string;
}

export class DataFetcher {
  private baseHeaders: HeadersInit = {
    'Accept': 'application/json, application/geo+json',
    'User-Agent': 'LandLock-BC-Risk-Analysis/1.0'
  };

  async fetchFromSource<T = GeoFeatureCollection>(
    source: DataSource,
    options: FetchOptions = {}
  ): Promise<{ data: T; metadata: FetchMetadata }> {
    const opts = { ...DEFAULT_FETCH_OPTIONS, ...options };
    const cacheKey = opts.cacheKey || source.id;

    if (opts.cache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return {
          data: cached,
          metadata: { source: source.id, fromCache: true, fetchedAt: new Date(), recordCount: this.countRecords(cached) }
        };
      }
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < (opts.retries || 1); attempt++) {
      try {
        const data = await this.fetchWithTimeout<T>(source.url, opts.timeout || 30000);
        const transformed = opts.transform ? opts.transform(data) as T : data;

        if (opts.cache) {
          this.setCache(cacheKey, transformed, this.getTTLForFrequency(source.updateFrequency));
        }

        return {
          data: transformed,
          metadata: { source: source.id, fromCache: false, fetchedAt: new Date(), recordCount: this.countRecords(transformed), attempts: attempt + 1 }
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < (opts.retries || 1) - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(`Failed to fetch from ${source.name}: ${lastError?.message}`);
  }

  private async fetchWithTimeout<T>(url: string, timeout: number): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { headers: this.baseHeaders, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json') || contentType.includes('geo+json')) {
        return await response.json() as T;
      }
      return JSON.parse(await response.text()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async fetchMultipleSources<T = GeoFeatureCollection>(
    sources: DataSource[],
    options: FetchOptions = {}
  ): Promise<Map<string, { data: T; metadata: FetchMetadata } | { error: Error }>> {
    const results = new Map<string, { data: T; metadata: FetchMetadata } | { error: Error }>();
    
    await Promise.all(sources.map(async (source) => {
      try {
        const result = await this.fetchFromSource<T>(source, options);
        results.set(source.id, result);
      } catch (error) {
        results.set(source.id, { error: error as Error });
      }
    }));

    return results;
  }

  buildWFSUrl(baseUrl: string, options: WFSOptions = {}): string {
    const url = new URL(baseUrl);
    if (options.bbox) {
      const { minLng, minLat, maxLng, maxLat } = options.bbox;
      url.searchParams.set('bbox', `${minLng},${minLat},${maxLng},${maxLat}`);
    }
    if (options.cqlFilter) url.searchParams.set('CQL_FILTER', options.cqlFilter);
    if (options.maxFeatures) url.searchParams.set('count', options.maxFeatures.toString());
    if (options.startIndex) url.searchParams.set('startIndex', options.startIndex.toString());
    if (options.sortBy) url.searchParams.set('sortBy', options.sortBy);
    return url.toString();
  }

  async fetchWFSPaginated<T extends GeoFeatureCollection>(
    source: DataSource,
    options: WFSOptions & { pageSize?: number } = {}
  ): Promise<T> {
    const pageSize = options.pageSize || 1000;
    let allFeatures: T['features'] = [];
    let startIndex = 0;
    let hasMore = true;

    while (hasMore) {
      const url = this.buildWFSUrl(source.url, { ...options, maxFeatures: pageSize, startIndex });
      const tempSource = { ...source, url };
      const result = await this.fetchFromSource<T>(tempSource, { cache: false });
      
      if (result.data.features && result.data.features.length > 0) {
        if (allFeatures.length + result.data.features.length > 50000) {
          const remaining = 50000 - allFeatures.length;
          allFeatures = [...allFeatures, ...result.data.features.slice(0, remaining)];
          console.warn('Hit 50k feature limit');
          hasMore = false;
        } else {
          allFeatures = [...allFeatures, ...result.data.features];
          startIndex += pageSize;
          hasMore = result.data.features.length === pageSize;
        }
      } else {
        hasMore = false;
      }
    }

    return { type: 'FeatureCollection', features: allFeatures } as T;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = dataCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > cached.ttl) {
      dataCache.delete(key);
      return null;
    }
    return cached.data as T;
  }

  private setCache(key: string, data: unknown, ttl: number): void {
    dataCache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private getTTLForFrequency(frequency: DataSource['updateFrequency']): number {
    const ttlMap: Record<DataSource['updateFrequency'], number> = {
      realtime: 5 * 60 * 1000,
      daily: 60 * 60 * 1000,
      weekly: 24 * 60 * 60 * 1000,
      monthly: 7 * 24 * 60 * 60 * 1000,
      yearly: 30 * 24 * 60 * 60 * 1000
    };
    return ttlMap[frequency];
  }

  clearCache(key?: string): void {
    if (key) dataCache.delete(key);
    else dataCache.clear();
  }

  private countRecords(data: unknown): number {
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object' && data !== null) {
      const fc = data as GeoFeatureCollection;
      if (fc.features) return fc.features.length;
    }
    return 1;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function validateGeoJSON(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];
  const anomalies: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data is null or not an object'], warnings: [], dataQualityScore: 0, missingFields: [], anomalies: [] };
  }

  const fc = data as GeoFeatureCollection;

  if (fc.type !== 'FeatureCollection') {
    errors.push(`Invalid type: expected "FeatureCollection", got "${fc.type}"`);
  }

  if (!Array.isArray(fc.features)) {
    errors.push('Missing or invalid "features" array');
    return { isValid: false, errors, warnings, dataQualityScore: 0, missingFields: ['features'], anomalies };
  }

  let validFeatures = 0;
  let nullGeometries = 0;
  let emptyProperties = 0;

  for (const feature of fc.features) {
    if (!feature.geometry) nullGeometries++;
    if (!feature.properties || Object.keys(feature.properties).length === 0) emptyProperties++;
    if (feature.type === 'Feature' && feature.geometry) validFeatures++;
  }

  if (nullGeometries > 0) warnings.push(`${nullGeometries} features have null geometries`);
  if (emptyProperties > fc.features.length * 0.5) warnings.push(`More than 50% of features have empty properties`);

  const qualityScore = fc.features.length > 0 ? Math.round((validFeatures / fc.features.length) * 100) : 0;

  return { isValid: errors.length === 0, errors, warnings, dataQualityScore: qualityScore, missingFields, anomalies };
}

export const dataFetcher = new DataFetcher();
