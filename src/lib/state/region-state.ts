import {
  RiskScore,
  RiskRanking,
  RiskReport,
  CostProjection,
  DisasterRecoveryScenario,
  AgentConclusion,
  WildfirePerimeter,
  WildfireStatistics,
  ZoningRegion,
  ValidationResult
} from '../types/hazard';

export interface RegionState {
  regionId: string;
  regionName: string;
  regionType: 'municipality' | 'fire_centre' | 'fire_zone' | 'regional_district';
  hazardData: {
    historicalFires: WildfirePerimeter[];
    fireStatistics: WildfireStatistics[];
    currentFWI?: number;
    dangerRating?: string;
    lastUpdated: Date;
  };
  zoningData: {
    zones: ZoningRegion[];
    developedPercentage: number;
    underdevelopedPercentage: number;
    lastUpdated: Date;
  };
  riskScore: RiskScore | null;
  riskRanking: RiskRanking | null;
  reports: RiskReport[];
  costProjections: CostProjection[];
  recoveryScenarios: DisasterRecoveryScenario[];
  agentConclusions: AgentConclusion[];
  lastAnalyzed: Date | null;
  dataQuality: ValidationResult | null;
}

export interface PipelineEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  regionId?: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export type EventType =
  | 'data_ingestion_started'
  | 'data_ingestion_completed'
  | 'risk_scoring_started'
  | 'risk_scoring_completed'
  | 'report_generation_started'
  | 'report_generation_completed'
  | 'agent_execution_started'
  | 'agent_execution_completed'
  | 'validation_completed'
  | 'state_updated';

export interface Constraint {
  id: string;
  type: ConstraintType;
  regionId?: string;
  value: number | string | boolean;
  description: string;
  source: string;
  validFrom: Date;
  validUntil?: Date;
}

export type ConstraintType =
  | 'budget_limit'
  | 'zoning_restriction'
  | 'development_moratorium'
  | 'insurance_threshold'
  | 'evacuation_capacity'
  | 'infrastructure_limit';

export interface PlanVariant {
  id: string;
  name: string;
  description: string;
  scenario: 'baseline' | 'moderate_climate' | 'severe_climate' | 'development_growth' | 'custom';
  assumptions: Record<string, unknown>;
  projectedOutcomes: {
    riskScoreChange: number;
    costImpact: number;
    timelineYears: number;
  };
  createdAt: Date;
}

export interface SharedState {
  regions: Map<string, RegionState>;
  events: PipelineEvent[];
  constraints: Constraint[];
  planVariants: PlanVariant[];
  globalRiskRankings: RiskRanking[];
  pipelineStatus: {
    isRunning: boolean;
    lastRun: Date | null;
    nextScheduledRun: Date | null;
    activeJobCount: number;
  };
  version: number;
  lastModified: Date;
}

export class StateManager {
  private state: SharedState;
  private subscribers: Map<string, (state: SharedState) => void>;
  private eventHistory: PipelineEvent[] = [];
  private maxEventHistory = 1000;

  constructor() {
    this.state = this.initializeState();
    this.subscribers = new Map();
  }

  private initializeState(): SharedState {
    return {
      regions: new Map(),
      events: [],
      constraints: [],
      planVariants: [],
      globalRiskRankings: [],
      pipelineStatus: { isRunning: false, lastRun: null, nextScheduledRun: null, activeJobCount: 0 },
      version: 1,
      lastModified: new Date()
    };
  }

  getRegion(regionId: string): RegionState | undefined {
    return this.state.regions.get(regionId);
  }

  getAllRegions(): RegionState[] {
    return Array.from(this.state.regions.values());
  }

  setRegion(regionId: string, regionState: Partial<RegionState>): void {
    const existing = this.state.regions.get(regionId);
    const updated: RegionState = existing ? { ...existing, ...regionState } : this.createDefaultRegionState(regionId, regionState);
    
    this.state.regions.set(regionId, updated);
    this.state.version++;
    this.state.lastModified = new Date();
    this.emitEvent({ type: 'state_updated', regionId, payload: { updated: Object.keys(regionState) } });
    this.notifySubscribers();
  }

  updateRegionHazardData(regionId: string, fires: WildfirePerimeter[], statistics: WildfireStatistics[]): void {
    const region = this.getRegion(regionId) || this.createDefaultRegionState(regionId);
    region.hazardData = {
      historicalFires: fires,
      fireStatistics: statistics,
      currentFWI: region.hazardData?.currentFWI,
      dangerRating: region.hazardData?.dangerRating,
      lastUpdated: new Date()
    };
    this.setRegion(regionId, region);
  }

  updateRegionZoningData(regionId: string, zones: ZoningRegion[]): void {
    const region = this.getRegion(regionId) || this.createDefaultRegionState(regionId);
    const developed = zones.filter(z => z.developmentStatus === 'developed').length;
    const underdeveloped = zones.filter(z => z.developmentStatus === 'underdeveloped').length;
    const total = zones.length || 1;
    
    region.zoningData = {
      zones,
      developedPercentage: (developed / total) * 100,
      underdevelopedPercentage: (underdeveloped / total) * 100,
      lastUpdated: new Date()
    };
    this.setRegion(regionId, region);
  }

  updateRegionRiskScore(regionId: string, score: RiskScore): void {
    const region = this.getRegion(regionId);
    if (!region) return;
    region.riskScore = score;
    region.lastAnalyzed = new Date();
    this.setRegion(regionId, region);
    this.updateGlobalRankings();
  }

  addAgentConclusion(regionId: string, conclusion: AgentConclusion): void {
    const region = this.getRegion(regionId);
    if (!region) return;
    region.agentConclusions = [...region.agentConclusions, conclusion];
    this.setRegion(regionId, region);
  }

  addReport(regionId: string, report: RiskReport): void {
    const region = this.getRegion(regionId);
    if (!region) return;
    region.reports = [...region.reports, report];
    this.setRegion(regionId, region);
  }

  private createDefaultRegionState(regionId: string, partial?: Partial<RegionState>): RegionState {
    return {
      regionId,
      regionName: partial?.regionName || regionId,
      regionType: partial?.regionType || 'municipality',
      hazardData: { historicalFires: [], fireStatistics: [], lastUpdated: new Date() },
      zoningData: { zones: [], developedPercentage: 0, underdevelopedPercentage: 0, lastUpdated: new Date() },
      riskScore: null,
      riskRanking: null,
      reports: [],
      costProjections: [],
      recoveryScenarios: [],
      agentConclusions: [],
      lastAnalyzed: null,
      dataQuality: null,
      ...partial
    };
  }

  emitEvent(event: Omit<PipelineEvent, 'id' | 'timestamp' | 'status'>): PipelineEvent {
    const fullEvent: PipelineEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'pending',
      ...event
    };
    
    this.state.events.push(fullEvent);
    this.eventHistory.push(fullEvent);
    
    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory = this.eventHistory.slice(-this.maxEventHistory);
    }
    
    return fullEvent;
  }

  updateEventStatus(eventId: string, status: PipelineEvent['status'], error?: string): void {
    const event = this.state.events.find(e => e.id === eventId);
    if (event) {
      event.status = status;
      if (error) event.error = error;
    }
  }

  getRecentEvents(count: number = 50): PipelineEvent[] {
    return this.state.events.slice(-count);
  }

  getEventsByType(type: EventType): PipelineEvent[] {
    return this.state.events.filter(e => e.type === type);
  }

  addConstraint(constraint: Omit<Constraint, 'id'>): Constraint {
    const fullConstraint: Constraint = { id: `con-${Date.now()}`, ...constraint };
    this.state.constraints.push(fullConstraint);
    return fullConstraint;
  }

  removeConstraint(constraintId: string): void {
    this.state.constraints = this.state.constraints.filter(c => c.id !== constraintId);
  }

  getConstraintsForRegion(regionId: string): Constraint[] {
    return this.state.constraints.filter(c => c.regionId === regionId || c.regionId === null);
  }

  getActiveConstraints(): Constraint[] {
    const now = new Date();
    return this.state.constraints.filter(c => c.validFrom <= now && (!c.validUntil || c.validUntil > now));
  }

  addPlanVariant(variant: Omit<PlanVariant, 'id' | 'createdAt'>): PlanVariant {
    const fullVariant: PlanVariant = { id: `var-${Date.now()}`, createdAt: new Date(), ...variant };
    this.state.planVariants.push(fullVariant);
    return fullVariant;
  }

  getPlanVariants(): PlanVariant[] {
    return this.state.planVariants;
  }

  comparePlanVariants(variantIds: string[]): PlanVariant[] {
    return this.state.planVariants.filter(v => variantIds.includes(v.id));
  }

  private updateGlobalRankings(): void {
    const regionsWithScores = this.getAllRegions()
      .filter(r => r.riskScore !== null)
      .sort((a, b) => (b.riskScore?.overallScore || 0) - (a.riskScore?.overallScore || 0));
    
    this.state.globalRiskRankings = regionsWithScores.map((region, index) => ({
      regionId: region.regionId,
      regionName: region.regionName,
      rank: index + 1,
      score: region.riskScore?.overallScore || 0,
      trend: 'stable' as const,
      changeFromLastPeriod: 0
    }));
  }

  getGlobalRankings(): RiskRanking[] {
    return this.state.globalRiskRankings;
  }

  getTopRiskRegions(count: number = 10): RiskRanking[] {
    return this.state.globalRiskRankings.slice(0, count);
  }

  setPipelineRunning(isRunning: boolean): void {
    this.state.pipelineStatus.isRunning = isRunning;
    if (!isRunning) this.state.pipelineStatus.lastRun = new Date();
  }

  setNextScheduledRun(date: Date): void {
    this.state.pipelineStatus.nextScheduledRun = date;
  }

  incrementActiveJobs(): void {
    this.state.pipelineStatus.activeJobCount++;
  }

  decrementActiveJobs(): void {
    this.state.pipelineStatus.activeJobCount = Math.max(0, this.state.pipelineStatus.activeJobCount - 1);
  }

  getPipelineStatus(): SharedState['pipelineStatus'] {
    return { ...this.state.pipelineStatus };
  }

  subscribe(id: string, callback: (state: SharedState) => void): () => void {
    this.subscribers.set(id, callback);
    return () => this.subscribers.delete(id);
  }

  private notifySubscribers(): void {
    const stateCopy = this.getSnapshot();
    this.subscribers.forEach(callback => callback(stateCopy));
  }

  getSnapshot(): SharedState {
    return {
      ...this.state,
      regions: new Map(this.state.regions),
      events: [...this.state.events],
      constraints: [...this.state.constraints],
      planVariants: [...this.state.planVariants],
      globalRiskRankings: [...this.state.globalRiskRankings]
    };
  }

  serialize(): string {
    return JSON.stringify({ ...this.state, regions: Array.from(this.state.regions.entries()) });
  }

  deserialize(json: string): void {
    const parsed = JSON.parse(json);
    this.state = { ...parsed, regions: new Map(parsed.regions) };
  }

  reset(): void {
    this.state = this.initializeState();
    this.notifySubscribers();
  }
}

export const stateManager = new StateManager();

export function createStateSubscription(callback: (state: SharedState) => void): () => void {
  const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return stateManager.subscribe(id, callback);
}
