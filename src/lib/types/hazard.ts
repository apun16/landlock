export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'geojson' | 'csv' | 'shapefile' | 'wfs';
  url: string;
  format: string;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'realtime';
  lastFetched?: Date;
  license: string;
  description: string;
}

export interface DataSourceCatalog {
  wildfire: DataSource[];
  zoning: DataSource[];
  insurance: DataSource[];
  climate: DataSource[];
  infrastructure: DataSource[];
}

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface GeoPolygon {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface GeoFeature<T = Record<string, unknown>> {
  type: 'Feature';
  id?: string | number;
  geometry: GeoPolygon | { type: 'Point'; coordinates: [number, number] };
  properties: T;
}

export interface GeoFeatureCollection<T = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoFeature<T>[];
  crs?: {
    type: string;
    properties: { name: string };
  };
}

export interface WildfirePerimeter {
  fireId: string;
  fireName: string;
  fireYear: number;
  startDate: Date;
  containedDate?: Date;
  areaBurnedHa: number;
  fireCentre: string;
  fireZone: string;
  cause: 'lightning' | 'human' | 'unknown';
  status: 'active' | 'contained' | 'out';
  geometry: GeoPolygon;
  structuresLost?: number;
  estimatedCost?: number;
}

export interface WildfireHotspot {
  id: string;
  latitude: number;
  longitude: number;
  confidence: number;
  detectedAt: Date;
  satellite: string;
  brightness: number;
  frp: number;
}

export interface FireWeatherIndex {
  regionId: string;
  date: Date;
  fwi: number;
  ffmc: number;
  dmc: number;
  dc: number;
  isi: number;
  bui: number;
  dangerRating: 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';
}

export interface WildfireStatistics {
  year: number;
  fireCentre: string;
  totalFires: number;
  totalAreaBurnedHa: number;
  averageFireSizeHa: number;
  lightningCaused: number;
  humanCaused: number;
  structuresDestroyed: number;
  estimatedCost: number;
  evacuationOrders: number;
}

export interface ZoningRegion {
  id: string;
  municipality: string;
  regionDistrict: string;
  zoningCode: string;
  zoningCategory: ZoningCategory;
  zoningDescription: string;
  geometry: GeoPolygon;
  areaHa: number;
  developmentStatus: 'developed' | 'underdeveloped' | 'undeveloped';
  allowedUses: string[];
  maxDensity?: number;
  maxHeight?: number;
}

export type ZoningCategory =
  | 'residential_single'
  | 'residential_multi'
  | 'commercial'
  | 'industrial'
  | 'mixed_use'
  | 'agricultural'
  | 'parkland'
  | 'institutional'
  | 'rural'
  | 'undeveloped';

export interface DevelopmentIndicators {
  regionId: string;
  populationDensity: number;
  buildingCoverage: number;
  infrastructureValue: number;
  yearBuiltMedian?: number;
  growthRate5yr: number;
}

export interface InsuranceLossRecord {
  year: number;
  regionId: string;
  eventType: 'wildfire' | 'flood' | 'earthquake' | 'windstorm' | 'hail';
  claimCount: number;
  totalPayout: number;
  averageClaim: number;
  structuresAffected: number;
}

export interface RiskScore {
  regionId: string;
  overallScore: number;
  category: 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';
  components: {
    wildfireExposure: number;
    historicalLoss: number;
    vulnerabilityIndex: number;
    climateProjection: number;
    mitigationFactor: number;
  };
  confidence: number;
  calculatedAt: Date;
  validUntil: Date;
}

export interface RiskRanking {
  regionId: string;
  regionName: string;
  rank: number;
  score: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  changeFromLastPeriod: number;
}

export interface CostProjection {
  regionId: string;
  scenario: 'baseline' | 'moderate_climate' | 'severe_climate' | 'development_growth';
  timeHorizon: number;
  projectedAnnualLoss: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  keyDrivers: string[];
  mitigationSavings?: number;
}

export interface DisasterRecoveryScenario {
  regionId: string;
  scenarioName: string;
  eventMagnitude: 'minor' | 'moderate' | 'major' | 'catastrophic';
  estimatedDamage: number;
  recoveryTimeMonths: number;
  insurancePayoutEstimate: number;
  outOfPocketEstimate: number;
  evacuationCost: number;
  infrastructureRepairCost: number;
}

export interface RiskReport {
  regionId: string;
  regionName: string;
  generatedAt: Date;
  summary: string;
  riskScore: RiskScore;
  rankings: RiskRanking[];
  historicalAnalysis: {
    period: string;
    totalLoss: number;
    majorEvents: WildfirePerimeter[];
    trendDescription: string;
  };
  projections: CostProjection[];
  recoveryScenarios: DisasterRecoveryScenario[];
  recommendations: string[];
  explainability: {
    methodology: string;
    dataSourcesUsed: string[];
    featureImportance: Record<string, number>;
    limitations: string[];
  };
}

export interface AgentConclusion {
  agentId: string;
  agentName: string;
  timestamp: Date;
  regionId: string;
  conclusion: string;
  confidence: number;
  supportingEvidence: string[];
  reasoning: string;
  dataSourcesCited: string[];
}

export interface IngestionJob {
  id: string;
  sourceId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  recordsProcessed: number;
  errors: string[];
}

export interface PipelineState {
  lastRun: Date;
  nextScheduledRun: Date;
  status: 'idle' | 'running' | 'error';
  activeJobs: IngestionJob[];
  recentCompletedJobs: IngestionJob[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dataQualityScore: number;
  missingFields: string[];
  anomalies: string[];
}
