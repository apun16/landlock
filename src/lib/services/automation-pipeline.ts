import { stateManager } from '../state/region-state';
import { wildfireIngestion, fetchRecentHistoricalFires } from './wildfire-ingestion';
import { zoningIngestion } from './zoning-ingestion';
import { BC_FIRE_CENTRES, BC_MAJOR_MUNICIPALITIES } from '../data/sources';
import { WildfirePerimeter, WildfireStatistics, ZoningRegion, ValidationResult, IngestionJob } from '../types/hazard';

export interface PipelineConfig {
  wildfireRefreshInterval: number;
  zoningRefreshInterval: number;
  riskScoringInterval: number;
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
  parallelJobs: number;
  minDataQualityScore: number;
  maxStaleDataHours: number;
  targetRegions: string[];
  includeHistorical: boolean;
  historicalYears: number;
}

const DEFAULT_CONFIG: PipelineConfig = {
  wildfireRefreshInterval: 6 * 60 * 60 * 1000,
  zoningRefreshInterval: 7 * 24 * 60 * 60 * 1000,
  riskScoringInterval: 24 * 60 * 60 * 1000,
  maxRetries: 3,
  retryDelayMs: 5000,
  batchSize: 10,
  parallelJobs: 3,
  minDataQualityScore: 70,
  maxStaleDataHours: 48,
  targetRegions: BC_MAJOR_MUNICIPALITIES.map(m => m.id),
  includeHistorical: true,
  historicalYears: 10
};

export type PipelineStage = 'initialization' | 'wildfire_ingestion' | 'zoning_ingestion' | 'data_validation' | 'risk_scoring' | 'report_generation' | 'state_sync' | 'cleanup';

export interface StageResult {
  stage: PipelineStage;
  success: boolean;
  duration: number;
  recordsProcessed: number;
  errors: string[];
  warnings: string[];
}

export interface PipelineSummary {
  stagesCompleted: number;
  totalStages: number;
  totalRecordsProcessed: number;
  errorCount: number;
  warningCount: number;
  regionsAnalyzed: number;
  topRiskRegions: string[];
}

export interface PipelineStatus {
  isRunning: boolean;
  activeJobs: IngestionJob[];
  scheduledTasks: string[];
  lastStageResults: StageResult[];
  pipelineStatus: ReturnType<typeof stateManager.getPipelineStatus>;
}

export class AutomationPipeline {
  private config: PipelineConfig;
  private isRunning: boolean = false;
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();
  private activeJobs: Map<string, IngestionJob> = new Map();
  private stageResults: StageResult[] = [];

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async runFullPipeline(): Promise<{ success: boolean; stages: StageResult[]; totalDuration: number; summary: PipelineSummary }> {
    if (this.isRunning) throw new Error('Pipeline is already running');

    const startTime = Date.now();
    this.isRunning = true;
    this.stageResults = [];
    stateManager.setPipelineRunning(true);

    const pipelineEvent = stateManager.emitEvent({ type: 'data_ingestion_started', payload: { config: this.config } });

    try {
      await this.runStage('initialization', async () => ({ recordsProcessed: 0, errors: [], warnings: [] }));

      const wildfireResult = await this.runStage('wildfire_ingestion', async () => await this.ingestWildfireData());
      const zoningResult = await this.runStage('zoning_ingestion', async () => await this.ingestZoningData());
      
      await this.runStage('data_validation', async () => await this.validateAllData());

      if (wildfireResult.success && zoningResult.success) {
        await this.runStage('risk_scoring', async () => await this.runRiskScoring());
      }

      await this.runStage('report_generation', async () => await this.generateReports());
      await this.runStage('state_sync', async () => await this.syncState());
      await this.runStage('cleanup', async () => await this.cleanup());

      stateManager.updateEventStatus(pipelineEvent.id, 'completed');
    } catch (error) {
      stateManager.updateEventStatus(pipelineEvent.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isRunning = false;
      stateManager.setPipelineRunning(false);
    }

    return {
      success: this.stageResults.every(r => r.success),
      stages: this.stageResults,
      totalDuration: Date.now() - startTime,
      summary: this.generatePipelineSummary()
    };
  }

  private async runStage(
    stage: PipelineStage,
    executor: () => Promise<{ recordsProcessed: number; errors: string[]; warnings: string[] }>
  ): Promise<StageResult> {
    const startTime = Date.now();
    let result: StageResult;

    try {
      const { recordsProcessed, errors, warnings } = await executor();
      result = { stage, success: errors.length === 0, duration: Date.now() - startTime, recordsProcessed, errors, warnings };
    } catch (error) {
      result = { stage, success: false, duration: Date.now() - startTime, recordsProcessed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'], warnings: [] };
    }

    this.stageResults.push(result);
    return result;
  }

  private async ingestWildfireData(): Promise<{ recordsProcessed: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let recordsProcessed = 0;

    stateManager.emitEvent({ type: 'data_ingestion_started', payload: { dataType: 'wildfire' } });

    try {
      const currentResult = await wildfireIngestion.fetchCurrentPerimeters();
      recordsProcessed += currentResult.perimeters.length;
      if (currentResult.validation && !currentResult.validation.isValid) {
        warnings.push(`Current perimeters: ${currentResult.validation.errors.join(', ')}`);
      }
      this.updateFireCentreStates(currentResult.perimeters);
    } catch (error) {
      errors.push(`Current perimeters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (this.config.includeHistorical) {
      try {
        const historicalResult = await fetchRecentHistoricalFires(this.config.historicalYears);
        recordsProcessed += historicalResult.perimeters.length;
        if (historicalResult.validation && !historicalResult.validation.isValid) {
          warnings.push(`Historical perimeters: ${historicalResult.validation.errors.join(', ')}`);
        }
        const statistics = wildfireIngestion.calculateStatistics(historicalResult.perimeters);
        this.updateFireCentreStatistics(statistics);
      } catch (error) {
        errors.push(`Historical perimeters: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    try {
      const hotspotsResult = await wildfireIngestion.fetchActiveHotspots();
      recordsProcessed += hotspotsResult.hotspots.length;
    } catch (error) {
      warnings.push(`Active hotspots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    stateManager.emitEvent({ type: 'data_ingestion_completed', payload: { dataType: 'wildfire', recordsProcessed } });
    return { recordsProcessed, errors, warnings };
  }

  private async ingestZoningData(): Promise<{ recordsProcessed: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let recordsProcessed = 0;

    stateManager.emitEvent({ type: 'data_ingestion_started', payload: { dataType: 'zoning' } });

    try {
      const [munisResult, districtsResult] = await Promise.all([
        zoningIngestion.fetchMunicipalities(),
        zoningIngestion.fetchRegionalDistricts()
      ]);
      if (munisResult.municipalities) recordsProcessed += munisResult.municipalities.features.length;
      if (districtsResult.districts) recordsProcessed += districtsResult.districts.features.length;
    } catch (error) {
      errors.push(`Provincial boundaries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    for (const regionId of this.config.targetRegions) {
      try {
        const zoningResult = await zoningIngestion.fetchMunicipalityZoning(regionId);
        if (zoningResult) {
          recordsProcessed += zoningResult.zones.length;
          stateManager.updateRegionZoningData(regionId, zoningResult.zones);
        }
      } catch (error) {
        warnings.push(`Zoning for ${regionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    stateManager.emitEvent({ type: 'data_ingestion_completed', payload: { dataType: 'zoning', recordsProcessed } });
    return { recordsProcessed, errors, warnings };
  }

  private async validateAllData(): Promise<{ recordsProcessed: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validRegions = 0;

    const regions = stateManager.getAllRegions();

    for (const region of regions) {
      const validation = this.validateRegionData(region.regionId);
      if (validation.isValid) {
        validRegions++;
      } else if (validation.dataQualityScore < this.config.minDataQualityScore) {
        warnings.push(`${region.regionName}: Low data quality (${validation.dataQualityScore}%)`);
      }
      stateManager.setRegion(region.regionId, { dataQuality: validation });
    }

    stateManager.emitEvent({ type: 'validation_completed', payload: { totalRegions: regions.length, validRegions } });
    return { recordsProcessed: regions.length, errors, warnings };
  }

  private validateRegionData(regionId: string): ValidationResult {
    const region = stateManager.getRegion(regionId);
    if (!region) {
      return { isValid: false, errors: ['Region not found'], warnings: [], dataQualityScore: 0, missingFields: ['region'], anomalies: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    let score = 100;

    if (!region.hazardData.historicalFires.length) {
      missingFields.push('historicalFires');
      score -= 20;
    }

    const hazardAge = Date.now() - region.hazardData.lastUpdated.getTime();
    const maxStaleMs = this.config.maxStaleDataHours * 60 * 60 * 1000;
    if (hazardAge > maxStaleMs) {
      warnings.push('Hazard data is stale');
      score -= 10;
    }

    if (!region.zoningData.zones.length) {
      missingFields.push('zones');
      score -= 20;
    }

    return { isValid: errors.length === 0 && score >= this.config.minDataQualityScore, errors, warnings, dataQualityScore: Math.max(0, score), missingFields, anomalies: [] };
  }

  private async runRiskScoring(): Promise<{ recordsProcessed: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let scored = 0;

    stateManager.emitEvent({ type: 'risk_scoring_started', payload: {} });

    for (const region of stateManager.getAllRegions()) {
      if (!region.dataQuality?.isValid) {
        warnings.push(`Skipping ${region.regionName}: Invalid data`);
        continue;
      }

      try {
        const score = this.calculateRiskScore(region.regionId);
        stateManager.updateRegionRiskScore(region.regionId, score);
        scored++;
      } catch (error) {
        errors.push(`${region.regionName}: ${error instanceof Error ? error.message : 'Scoring failed'}`);
      }
    }

    stateManager.emitEvent({ type: 'risk_scoring_completed', payload: { regionsScored: scored } });
    return { recordsProcessed: scored, errors, warnings };
  }

  private calculateRiskScore(regionId: string) {
    const region = stateManager.getRegion(regionId);
    if (!region) throw new Error('Region not found');

    const weights = { exposure: 0.35, loss: 0.30, vulnerability: 0.25, climate: 0.10 };

    const wildfireExposure = this.calculateWildfireExposure(region.hazardData.historicalFires);
    const historicalLoss = this.calculateHistoricalLoss(region.hazardData.fireStatistics);
    const vulnerabilityIndex = this.calculateVulnerability(region.zoningData.zones);
    const climateScore = 60;

    const weightedScore = 
      wildfireExposure * weights.exposure * 100 +
      historicalLoss * weights.loss * 100 +
      vulnerabilityIndex * weights.vulnerability * 100 +
      climateScore * weights.climate;

    const overallScore = Math.round(Math.max(0, Math.min(100, weightedScore)));

    return {
      regionId,
      overallScore,
      category: this.scoreToCategory(overallScore),
      components: {
        wildfireExposure: Math.round(wildfireExposure * 100),
        historicalLoss: Math.round(historicalLoss * 100),
        vulnerabilityIndex: Math.round(vulnerabilityIndex * 100),
        climateProjection: climateScore,
        mitigationFactor: 20
      },
      confidence: 0.75,
      calculatedAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  }

  private calculateWildfireExposure(fires: WildfirePerimeter[]): number {
    if (!fires.length) return 0.1;
    const totalArea = fires.reduce((sum, f) => sum + f.areaBurnedHa, 0);
    const recentFires = fires.filter(f => f.fireYear >= new Date().getFullYear() - 5).length;
    return (Math.min(1, totalArea / 100000) * 0.6 + Math.min(1, recentFires / 20) * 0.4);
  }

  private calculateHistoricalLoss(statistics: WildfireStatistics[]): number {
    if (!statistics.length) return 0.1;
    const totalCost = statistics.reduce((sum, s) => sum + s.estimatedCost, 0);
    const totalStructures = statistics.reduce((sum, s) => sum + s.structuresDestroyed, 0);
    return (Math.min(1, totalCost / 500000000) * 0.7 + Math.min(1, totalStructures / 500) * 0.3);
  }

  private calculateVulnerability(zones: ZoningRegion[]): number {
    if (!zones.length) return 0.5;
    const developed = zones.filter(z => z.developmentStatus === 'developed').length;
    return (developed / zones.length) * 0.8;
  }

  private scoreToCategory(score: number): 'low' | 'moderate' | 'high' | 'very_high' | 'extreme' {
    if (score < 20) return 'low';
    if (score < 40) return 'moderate';
    if (score < 60) return 'high';
    if (score < 80) return 'very_high';
    return 'extreme';
  }

  private async generateReports(): Promise<{ recordsProcessed: number; errors: string[]; warnings: string[] }> {
    const warnings: string[] = [];
    let generated = 0;

    stateManager.emitEvent({ type: 'report_generation_started', payload: {} });

    for (const region of stateManager.getAllRegions().filter(r => r.riskScore)) {
      try {
        const report = this.generateRegionReport(region.regionId);
        stateManager.addReport(region.regionId, report);
        generated++;
      } catch {
        warnings.push(`Report for ${region.regionName} failed`);
      }
    }

    stateManager.emitEvent({ type: 'report_generation_completed', payload: { reportsGenerated: generated } });
    return { recordsProcessed: generated, errors: [], warnings };
  }

  private generateRegionReport(regionId: string) {
    const region = stateManager.getRegion(regionId);
    if (!region || !region.riskScore) throw new Error('Region or score not found');

    return {
      regionId,
      regionName: region.regionName,
      generatedAt: new Date(),
      summary: `${region.regionName} has a ${region.riskScore.category.replace('_', ' ')} risk level with score ${region.riskScore.overallScore}/100.`,
      riskScore: region.riskScore,
      rankings: stateManager.getGlobalRankings().filter(r => r.regionId === regionId),
      historicalAnalysis: {
        period: `${new Date().getFullYear() - this.config.historicalYears}-${new Date().getFullYear()}`,
        totalLoss: region.hazardData.fireStatistics.reduce((sum, s) => sum + s.estimatedCost, 0),
        majorEvents: region.hazardData.historicalFires.filter(f => f.areaBurnedHa > 1000),
        trendDescription: 'Based on historical patterns'
      },
      projections: this.generateCostProjections(region),
      recoveryScenarios: this.generateRecoveryScenarios(region),
      recommendations: this.generateRecommendations(region),
      explainability: {
        methodology: 'Weighted multi-factor risk scoring',
        dataSourcesUsed: ['BC Wildfire Service', 'CWFIS', 'BC Geographic Warehouse', 'Municipal Open Data'],
        featureImportance: { wildfireExposure: 0.35, historicalLoss: 0.30, vulnerabilityIndex: 0.25, climateProjection: 0.10 },
        limitations: ['Historical data may not reflect future conditions', 'Climate projections have uncertainty']
      }
    };
  }

  private generateCostProjections(region: ReturnType<typeof stateManager.getRegion>) {
    if (!region) return [];
    const baseAnnualLoss = region.hazardData.fireStatistics.length > 0
      ? region.hazardData.fireStatistics.reduce((sum, s) => sum + s.estimatedCost, 0) / region.hazardData.fireStatistics.length
      : 1000000;

    return [
      { regionId: region.regionId, scenario: 'baseline' as const, timeHorizon: 10, projectedAnnualLoss: baseAnnualLoss, confidenceInterval: { lower: baseAnnualLoss * 0.7, upper: baseAnnualLoss * 1.5 }, keyDrivers: ['Historical patterns'] },
      { regionId: region.regionId, scenario: 'moderate_climate' as const, timeHorizon: 10, projectedAnnualLoss: baseAnnualLoss * 1.3, confidenceInterval: { lower: baseAnnualLoss, upper: baseAnnualLoss * 2 }, keyDrivers: ['Climate warming'] },
      { regionId: region.regionId, scenario: 'severe_climate' as const, timeHorizon: 10, projectedAnnualLoss: baseAnnualLoss * 1.8, confidenceInterval: { lower: baseAnnualLoss * 1.2, upper: baseAnnualLoss * 3 }, keyDrivers: ['Extreme weather'] }
    ];
  }

  private generateRecoveryScenarios(region: ReturnType<typeof stateManager.getRegion>) {
    if (!region) return [];
    const infrastructureValue = region.zoningData.zones.reduce((sum, z) => sum + (z.areaHa * 1000000), 0);

    return [
      { regionId: region.regionId, scenarioName: 'Minor Event', eventMagnitude: 'minor' as const, estimatedDamage: infrastructureValue * 0.01, recoveryTimeMonths: 6, insurancePayoutEstimate: infrastructureValue * 0.008, outOfPocketEstimate: infrastructureValue * 0.002, evacuationCost: 500000, infrastructureRepairCost: infrastructureValue * 0.005 },
      { regionId: region.regionId, scenarioName: 'Major Event', eventMagnitude: 'major' as const, estimatedDamage: infrastructureValue * 0.1, recoveryTimeMonths: 24, insurancePayoutEstimate: infrastructureValue * 0.07, outOfPocketEstimate: infrastructureValue * 0.03, evacuationCost: 5000000, infrastructureRepairCost: infrastructureValue * 0.05 }
    ];
  }

  private generateRecommendations(region: ReturnType<typeof stateManager.getRegion>): string[] {
    if (!region?.riskScore) return [];
    const recommendations: string[] = [];
    
    if (region.riskScore.components.wildfireExposure > 50) {
      recommendations.push('Implement FireSmart landscaping standards');
      recommendations.push('Increase fuel management activities');
    }
    if (region.riskScore.components.vulnerabilityIndex > 60) {
      recommendations.push('Improve emergency evacuation routes');
      recommendations.push('Consider development restrictions in high-risk zones');
    }
    if (region.riskScore.overallScore > 60) {
      recommendations.push('Review insurance coverage and policy limits');
      recommendations.push('Establish community emergency programs');
    }
    
    return recommendations;
  }

  private async syncState(): Promise<{ recordsProcessed: number; errors: string[]; warnings: string[] }> {
    const snapshot = stateManager.getSnapshot();
    return { recordsProcessed: snapshot.regions.size, errors: [], warnings: [] };
  }

  private async cleanup(): Promise<{ recordsProcessed: number; errors: string[]; warnings: string[] }> {
    return { recordsProcessed: 0, errors: [], warnings: [] };
  }

  private updateFireCentreStates(perimeters: WildfirePerimeter[]): void {
    for (const centre of BC_FIRE_CENTRES) {
      const centreFires = perimeters.filter(p => p.fireCentre.toLowerCase().includes(centre.name.toLowerCase().split(' ')[0]));
      stateManager.setRegion(centre.id, {
        regionId: centre.id,
        regionName: centre.name,
        regionType: 'fire_centre',
        hazardData: { historicalFires: centreFires, fireStatistics: [], lastUpdated: new Date() }
      });
    }
  }

  private updateFireCentreStatistics(statistics: WildfireStatistics[]): void {
    for (const centre of BC_FIRE_CENTRES) {
      const centreStats = statistics.filter(s => s.fireCentre.toLowerCase().includes(centre.name.toLowerCase().split(' ')[0]));
      const existing = stateManager.getRegion(centre.id);
      if (existing) {
        existing.hazardData.fireStatistics = centreStats;
        stateManager.setRegion(centre.id, existing);
      }
    }
  }

  private generatePipelineSummary(): PipelineSummary {
    return {
      stagesCompleted: this.stageResults.filter(r => r.success).length,
      totalStages: this.stageResults.length,
      totalRecordsProcessed: this.stageResults.reduce((sum, r) => sum + r.recordsProcessed, 0),
      errorCount: this.stageResults.flatMap(r => r.errors).length,
      warningCount: this.stageResults.flatMap(r => r.warnings).length,
      regionsAnalyzed: stateManager.getAllRegions().length,
      topRiskRegions: stateManager.getTopRiskRegions(5).map(r => r.regionName)
    };
  }

  startScheduledExecution(): void {
    this.scheduleTask('wildfire', this.config.wildfireRefreshInterval, async () => {
      await this.runStage('wildfire_ingestion', () => this.ingestWildfireData());
    });
    this.scheduleTask('zoning', this.config.zoningRefreshInterval, async () => {
      await this.runStage('zoning_ingestion', () => this.ingestZoningData());
    });
    this.scheduleTask('scoring', this.config.riskScoringInterval, async () => {
      await this.runStage('risk_scoring', () => this.runRiskScoring());
    });

    stateManager.setNextScheduledRun(new Date(Date.now() + Math.min(
      this.config.wildfireRefreshInterval,
      this.config.zoningRefreshInterval,
      this.config.riskScoringInterval
    )));
  }

  stopScheduledExecution(): void {
    this.scheduledTasks.forEach((timeout) => clearTimeout(timeout));
    this.scheduledTasks.clear();
  }

  private scheduleTask(taskId: string, intervalMs: number, executor: () => Promise<void>): void {
    const runTask = async () => {
      try { await executor(); } catch (error) { console.error(`Task ${taskId} failed:`, error); }
      this.scheduledTasks.set(taskId, setTimeout(runTask, intervalMs));
    };
    this.scheduledTasks.set(taskId, setTimeout(runTask, intervalMs));
  }

  getStatus(): PipelineStatus {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.activeJobs.values()),
      scheduledTasks: Array.from(this.scheduledTasks.keys()),
      lastStageResults: this.stageResults,
      pipelineStatus: stateManager.getPipelineStatus()
    };
  }
}

export const automationPipeline = new AutomationPipeline();
