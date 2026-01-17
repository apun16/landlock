import { RiskScore, RiskReport, CostProjection, DisasterRecoveryScenario, AgentConclusion, WildfirePerimeter, WildfireStatistics, ZoningRegion } from '../types/hazard';
import { stateManager } from '../state/region-state';
import { AgentMessage } from './base-agent';

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  verbose: boolean;
  allowDelegation: boolean;
  tools: string[];
}

export const INSURANCE_RISK_ANALYST_CONFIG: AgentConfig = {
  id: 'insurance-risk-analyst',
  name: 'Insurance Risk Analyst',
  role: 'Senior Insurance Risk Assessment Specialist',
  goal: 'Analyze and quantify insurance risks for BC regions based on wildfire exposure, historical losses, and development patterns.',
  backstory: `Senior insurance risk analyst with 15+ years in property and casualty insurance, specializing in natural catastrophe risk assessment and wildfire risk modeling.`,
  verbose: true,
  allowDelegation: false,
  tools: ['wildfire_data_retrieval', 'zoning_analysis', 'historical_loss_analysis', 'risk_scoring', 'cost_projection', 'report_generation']
};

export interface AgentTask {
  id: string;
  description: string;
  expectedOutput: string;
  context?: string[];
}

export const INSURANCE_RISK_ANALYST_TASKS: AgentTask[] = [
  { id: 'assess-wildfire-exposure', description: 'Analyze wildfire exposure by examining historical fire perimeters, frequency, and burned area.', expectedOutput: 'Wildfire exposure assessment with score and key risk factors.' },
  { id: 'analyze-historical-losses', description: 'Review historical insurance losses and suppression costs.', expectedOutput: 'Loss history summary with trends and major events.' },
  { id: 'evaluate-vulnerability', description: 'Assess regional vulnerability based on development patterns and infrastructure.', expectedOutput: 'Vulnerability assessment with exposure value and risk areas.' },
  { id: 'calculate-risk-score', description: 'Compute comprehensive insurance risk score combining all factors.', expectedOutput: 'Final risk score with component breakdown.' },
  { id: 'project-future-costs', description: 'Model future loss projections under different scenarios.', expectedOutput: 'Cost projections for multiple scenarios.' },
  { id: 'generate-risk-report', description: 'Compile all analyses into a comprehensive risk report.', expectedOutput: 'Complete risk report with recommendations.' }
];

interface ExposureAnalysis {
  totalFires: number;
  totalAreaBurnedHa: number;
  averageFireSizeHa: number;
  recentFires5yr: number;
  majorFires: WildfirePerimeter[];
  lightningCausedPercent: number;
  exposureScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface LossAnalysis {
  totalSuppresionCost: number;
  averageAnnualCost: number;
  totalStructuresDestroyed: number;
  peakLossYear: number;
  peakLossAmount: number;
  lossScore: number;
  volatility: 'low' | 'moderate' | 'high';
}

interface VulnerabilityAnalysis {
  totalZones: number;
  developedPercent: number;
  residentialPercent: number;
  estimatedExposureValue: number;
  populationExposure: number;
  vulnerabilityScore: number;
  highRiskZones: string[];
}

export class InsuranceRiskAnalystAgent {
  private config: AgentConfig;
  private currentTask: AgentTask | null = null;
  private conclusions: AgentConclusion[] = [];
  private messageHistory: AgentMessage[] = [];

  constructor(config: AgentConfig = INSURANCE_RISK_ANALYST_CONFIG) {
    this.config = config;
  }

  getConfig(): AgentConfig {
    return this.config;
  }

  getMessageHistory(): AgentMessage[] {
    return this.messageHistory;
  }

  async analyzeRegion(regionId: string): Promise<{ riskScore: RiskScore; report: RiskReport; conclusions: AgentConclusion[] }> {
    this.conclusions = [];
    this.messageHistory = [];
    
    const region = stateManager.getRegion(regionId);
    if (!region) throw new Error(`Region ${regionId} not found`);

    this.messageHistory.push({
      agentId: this.config.id,
      agentName: this.config.name,
      timestamp: new Date(),
      reasoning: `Analyzing insurance risk for ${region.regionName} with ${region.hazardData.historicalFires.length} fire records`,
      action: 'analyze_region',
      input: { regionId },
      output: null,
      nextAgent: 'mitigation-strategist'
    });

    const exposureAnalysis = await this.assessWildfireExposure(region.hazardData.historicalFires);
    const lossAnalysis = await this.analyzeHistoricalLosses(region.hazardData.fireStatistics);
    const vulnerabilityAnalysis = await this.evaluateVulnerability(region.zoningData.zones);
    
    const riskScore = await this.calculateRiskScore(regionId, exposureAnalysis, lossAnalysis, vulnerabilityAnalysis);
    const projections = await this.projectFutureCosts(regionId, riskScore, lossAnalysis);
    const report = await this.generateRiskReport(region, riskScore, projections);

    stateManager.updateRegionRiskScore(regionId, riskScore);
    stateManager.addReport(regionId, report);
    this.conclusions.forEach(c => stateManager.addAgentConclusion(regionId, c));

    return { riskScore, report, conclusions: this.conclusions };
  }

  private async assessWildfireExposure(fires: WildfirePerimeter[]): Promise<ExposureAnalysis> {
    this.setCurrentTask(INSURANCE_RISK_ANALYST_TASKS[0]);

    const analysis: ExposureAnalysis = {
      totalFires: fires.length,
      totalAreaBurnedHa: 0,
      averageFireSizeHa: 0,
      recentFires5yr: 0,
      majorFires: [],
      lightningCausedPercent: 0,
      exposureScore: 0,
      trend: 'stable'
    };

    if (fires.length === 0) {
      analysis.exposureScore = 10;
      this.addConclusion('No historical wildfire perimeters found. Low exposure score assigned.', 0.6, ['Wildfire perimeter analysis']);
      return analysis;
    }

    const currentYear = new Date().getFullYear();
    analysis.totalAreaBurnedHa = fires.reduce((sum, f) => sum + f.areaBurnedHa, 0);
    analysis.averageFireSizeHa = analysis.totalAreaBurnedHa / fires.length;
    analysis.recentFires5yr = fires.filter(f => f.fireYear >= currentYear - 5).length;
    analysis.majorFires = fires.filter(f => f.areaBurnedHa > 1000);
    analysis.lightningCausedPercent = Math.round((fires.filter(f => f.cause === 'lightning').length / fires.length) * 100);

    const areaScore = Math.min(40, (analysis.totalAreaBurnedHa / 50000) * 40);
    const frequencyScore = Math.min(30, (analysis.recentFires5yr / 10) * 30);
    const majorEventScore = Math.min(30, (analysis.majorFires.length / 5) * 30);

    analysis.exposureScore = Math.round(areaScore + frequencyScore + majorEventScore);

    const oldFires = fires.filter(f => f.fireYear < currentYear - 5).length;
    const recentRatio = analysis.recentFires5yr / Math.max(1, oldFires);
    if (recentRatio > 1.3) analysis.trend = 'increasing';
    else if (recentRatio < 0.7) analysis.trend = 'decreasing';

    this.addConclusion(
      `Wildfire exposure: ${fires.length} fires, ${analysis.totalAreaBurnedHa.toLocaleString()} ha burned. Score: ${analysis.exposureScore}/100. ${analysis.lightningCausedPercent}% lightning-caused. Trend: ${analysis.trend}.`,
      0.85,
      ['Historical fire perimeters', 'BC Wildfire Service']
    );

    return analysis;
  }

  private async analyzeHistoricalLosses(statistics: WildfireStatistics[]): Promise<LossAnalysis> {
    this.setCurrentTask(INSURANCE_RISK_ANALYST_TASKS[1]);

    const analysis: LossAnalysis = {
      totalSuppresionCost: 0,
      averageAnnualCost: 0,
      totalStructuresDestroyed: 0,
      peakLossYear: 0,
      peakLossAmount: 0,
      lossScore: 0,
      volatility: 'low'
    };

    if (statistics.length === 0) {
      analysis.lossScore = 15;
      this.addConclusion('Limited historical loss data. Baseline score assigned.', 0.5, ['Loss data analysis']);
      return analysis;
    }

    analysis.totalSuppresionCost = statistics.reduce((sum, s) => sum + s.estimatedCost, 0);
    analysis.averageAnnualCost = analysis.totalSuppresionCost / statistics.length;
    analysis.totalStructuresDestroyed = statistics.reduce((sum, s) => sum + s.structuresDestroyed, 0);

    const maxLoss = statistics.reduce((max, s) => s.estimatedCost > max.estimatedCost ? s : max, statistics[0]);
    analysis.peakLossYear = maxLoss.year;
    analysis.peakLossAmount = maxLoss.estimatedCost;

    const costScore = Math.min(50, (analysis.averageAnnualCost / 10000000) * 50);
    const structureScore = Math.min(30, (analysis.totalStructuresDestroyed / 100) * 30);
    const concentrationScore = Math.min(20, (analysis.peakLossAmount / analysis.totalSuppresionCost) * 40);

    analysis.lossScore = Math.round(costScore + structureScore + concentrationScore);

    const costs = statistics.map(s => s.estimatedCost);
    const stdDev = this.calculateStdDev(costs);
    const coeffVar = stdDev / analysis.averageAnnualCost;
    if (coeffVar > 1.5) analysis.volatility = 'high';
    else if (coeffVar > 0.7) analysis.volatility = 'moderate';

    this.addConclusion(
      `Historical losses: $${(analysis.totalSuppresionCost / 1000000).toFixed(1)}M over ${statistics.length} years. Avg: $${(analysis.averageAnnualCost / 1000000).toFixed(2)}M/yr. ${analysis.totalStructuresDestroyed} structures lost. Volatility: ${analysis.volatility}.`,
      0.8,
      ['BC Wildfire Service statistics']
    );

    return analysis;
  }

  private async evaluateVulnerability(zones: ZoningRegion[]): Promise<VulnerabilityAnalysis> {
    this.setCurrentTask(INSURANCE_RISK_ANALYST_TASKS[2]);

    const analysis: VulnerabilityAnalysis = {
      totalZones: zones.length,
      developedPercent: 0,
      residentialPercent: 0,
      estimatedExposureValue: 0,
      populationExposure: 0,
      vulnerabilityScore: 0,
      highRiskZones: []
    };

    if (zones.length === 0) {
      analysis.vulnerabilityScore = 20;
      this.addConclusion('No detailed zoning data. Baseline vulnerability assigned.', 0.5, ['Regional assessment']);
      return analysis;
    }

    const developed = zones.filter(z => z.developmentStatus === 'developed');
    const residential = zones.filter(z => z.zoningCategory === 'residential_single' || z.zoningCategory === 'residential_multi');

    analysis.developedPercent = Math.round((developed.length / zones.length) * 100);
    analysis.residentialPercent = Math.round((residential.length / zones.length) * 100);

    const valuePerHa: Record<string, number> = {
      residential_single: 15000000, residential_multi: 50000000, commercial: 80000000,
      industrial: 25000000, mixed_use: 60000000, agricultural: 500000, parkland: 1000000,
      institutional: 40000000, rural: 200000, undeveloped: 100000
    };

    analysis.estimatedExposureValue = zones.reduce((sum, z) => sum + (z.areaHa * (valuePerHa[z.zoningCategory] || 100000)), 0);
    analysis.highRiskZones = zones.filter(z => z.developmentStatus === 'developed').slice(0, 10).map(z => z.id);

    const developmentScore = Math.min(40, (analysis.developedPercent / 100) * 40);
    const valueScore = Math.min(40, (analysis.estimatedExposureValue / 10000000000) * 40);
    const concentrationScore = Math.min(20, (analysis.residentialPercent / 50) * 20);

    analysis.vulnerabilityScore = Math.round(developmentScore + valueScore + concentrationScore);

    this.addConclusion(
      `Vulnerability: ${analysis.developedPercent}% developed, ${analysis.residentialPercent}% residential. Exposure: $${(analysis.estimatedExposureValue / 1000000000).toFixed(2)}B. Score: ${analysis.vulnerabilityScore}/100.`,
      0.75,
      ['Municipal zoning data']
    );

    return analysis;
  }

  private async calculateRiskScore(regionId: string, exposure: ExposureAnalysis, loss: LossAnalysis, vulnerability: VulnerabilityAnalysis): Promise<RiskScore> {
    this.setCurrentTask(INSURANCE_RISK_ANALYST_TASKS[3]);

    const weights = { exposure: 0.35, loss: 0.30, vulnerability: 0.25, climate: 0.10 };
    const climateScore = 60;

    const weightedScore = 
      exposure.exposureScore * weights.exposure +
      loss.lossScore * weights.loss +
      vulnerability.vulnerabilityScore * weights.vulnerability +
      climateScore * weights.climate;

    const overallScore = Math.round(Math.max(0, Math.min(100, weightedScore)));
    const confidence = this.calculateConfidence(exposure, loss, vulnerability);

    const riskScore: RiskScore = {
      regionId,
      overallScore,
      category: this.scoreToCategory(overallScore),
      components: {
        wildfireExposure: exposure.exposureScore,
        historicalLoss: loss.lossScore,
        vulnerabilityIndex: vulnerability.vulnerabilityScore,
        climateProjection: climateScore,
        mitigationFactor: 20
      },
      confidence,
      calculatedAt: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    };

    this.addConclusion(
      `Risk score: ${overallScore}/100 (${riskScore.category.replace('_', ' ')}). Components: Exposure ${exposure.exposureScore}, Loss ${loss.lossScore}, Vulnerability ${vulnerability.vulnerabilityScore}. Confidence: ${(confidence * 100).toFixed(0)}%.`,
      confidence,
      ['All analysis components']
    );

    return riskScore;
  }

  private async projectFutureCosts(regionId: string, riskScore: RiskScore, lossAnalysis: LossAnalysis): Promise<CostProjection[]> {
    this.setCurrentTask(INSURANCE_RISK_ANALYST_TASKS[4]);

    const baseAnnualLoss = lossAnalysis.averageAnnualCost || 1000000;
    const riskMultiplier = 1 + (riskScore.overallScore / 100);

    const projections: CostProjection[] = [
      { regionId, scenario: 'baseline', timeHorizon: 10, projectedAnnualLoss: Math.round(baseAnnualLoss * riskMultiplier), confidenceInterval: { lower: Math.round(baseAnnualLoss * riskMultiplier * 0.6), upper: Math.round(baseAnnualLoss * riskMultiplier * 1.5) }, keyDrivers: ['Historical patterns'], mitigationSavings: Math.round(baseAnnualLoss * 0.15) },
      { regionId, scenario: 'moderate_climate', timeHorizon: 10, projectedAnnualLoss: Math.round(baseAnnualLoss * riskMultiplier * 1.35), confidenceInterval: { lower: Math.round(baseAnnualLoss * riskMultiplier * 0.9), upper: Math.round(baseAnnualLoss * riskMultiplier * 2.0) }, keyDrivers: ['Climate warming +1.5°C'], mitigationSavings: Math.round(baseAnnualLoss * 0.2) },
      { regionId, scenario: 'severe_climate', timeHorizon: 10, projectedAnnualLoss: Math.round(baseAnnualLoss * riskMultiplier * 1.9), confidenceInterval: { lower: Math.round(baseAnnualLoss * riskMultiplier * 1.3), upper: Math.round(baseAnnualLoss * riskMultiplier * 3.0) }, keyDrivers: ['Climate warming +2.5°C'], mitigationSavings: Math.round(baseAnnualLoss * 0.25) },
      { regionId, scenario: 'development_growth', timeHorizon: 10, projectedAnnualLoss: Math.round(baseAnnualLoss * riskMultiplier * 1.5), confidenceInterval: { lower: Math.round(baseAnnualLoss * riskMultiplier * 1.1), upper: Math.round(baseAnnualLoss * riskMultiplier * 2.2) }, keyDrivers: ['Population growth', 'WUI expansion'], mitigationSavings: Math.round(baseAnnualLoss * 0.3) }
    ];

    const worstCase = projections[2];
    this.addConclusion(
      `Cost projections: Baseline $${(projections[0].projectedAnnualLoss / 1000000).toFixed(2)}M/yr. Severe climate: $${(worstCase.projectedAnnualLoss / 1000000).toFixed(2)}M/yr. Mitigation savings up to $${(worstCase.mitigationSavings! / 1000000).toFixed(2)}M/yr.`,
      0.7,
      ['Climate projections', 'Development scenarios']
    );

    return projections;
  }

  private async generateRiskReport(region: ReturnType<typeof stateManager.getRegion>, riskScore: RiskScore, projections: CostProjection[]): Promise<RiskReport> {
    this.setCurrentTask(INSURANCE_RISK_ANALYST_TASKS[5]);
    if (!region) throw new Error('Region not found');

    const recoveryScenarios = this.generateRecoveryScenarios(region, riskScore);
    const recommendations = this.generateRecommendations(riskScore);

    const report: RiskReport = {
      regionId: region.regionId,
      regionName: region.regionName,
      generatedAt: new Date(),
      summary: `${region.regionName}: ${riskScore.category.replace('_', ' ')} risk (${riskScore.overallScore}/100). Key factors: wildfire exposure (${riskScore.components.wildfireExposure}%), historical losses (${riskScore.components.historicalLoss}%).`,
      riskScore,
      rankings: stateManager.getGlobalRankings().filter(r => r.regionId === region.regionId),
      historicalAnalysis: {
        period: '10-year analysis',
        totalLoss: region.hazardData.fireStatistics.reduce((sum, s) => sum + s.estimatedCost, 0),
        majorEvents: region.hazardData.historicalFires.filter(f => f.areaBurnedHa > 1000),
        trendDescription: this.describeTrend(region.hazardData.fireStatistics)
      },
      projections,
      recoveryScenarios,
      recommendations,
      explainability: {
        methodology: 'Weighted multi-factor risk scoring (exposure 35%, loss 30%, vulnerability 25%, climate 10%).',
        dataSourcesUsed: ['BC Wildfire Service', 'CWFIS', 'BC Geographic Warehouse', 'Municipal Open Data'],
        featureImportance: { wildfireExposure: 0.35, historicalLoss: 0.30, vulnerabilityIndex: 0.25, climateProjection: 0.10 },
        limitations: ['Historical data may not reflect future conditions', 'Climate projections have uncertainty', 'Insurance data is aggregated']
      }
    };

    this.addConclusion(
      `Risk report generated for ${region.regionName}. Category: ${riskScore.category.replace('_', ' ')}. ${recommendations.length} recommendations provided.`,
      0.85,
      ['All analysis components']
    );

    return report;
  }

  private setCurrentTask(task: AgentTask): void {
    this.currentTask = task;
    stateManager.emitEvent({ type: 'agent_execution_started', payload: { agentId: this.config.id, taskId: task.id } });
  }

  private addConclusion(conclusion: string, confidence: number, dataSourcesCited: string[]): void {
    this.conclusions.push({
      agentId: this.config.id,
      agentName: this.config.name,
      timestamp: new Date(),
      regionId: '',
      conclusion,
      confidence,
      supportingEvidence: dataSourcesCited,
      reasoning: this.currentTask?.description || '',
      dataSourcesCited
    });
  }

  private scoreToCategory(score: number): RiskScore['category'] {
    if (score < 20) return 'low';
    if (score < 40) return 'moderate';
    if (score < 60) return 'high';
    if (score < 80) return 'very_high';
    return 'extreme';
  }

  private calculateConfidence(exposure: ExposureAnalysis, loss: LossAnalysis, vulnerability: VulnerabilityAnalysis): number {
    let confidence = 0.5;
    if (exposure.totalFires > 10) confidence += 0.15;
    if (loss.totalSuppresionCost > 0) confidence += 0.15;
    if (vulnerability.totalZones > 50) confidence += 0.1;
    if (exposure.recentFires5yr > 0) confidence += 0.1;
    return Math.min(0.95, confidence);
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((sum, v) => sum + v, 0) / values.length);
  }

  private describeTrend(statistics: WildfireStatistics[]): string {
    if (statistics.length < 2) return 'Insufficient data for trend analysis';
    const sorted = [...statistics].sort((a, b) => a.year - b.year);
    const half = Math.floor(sorted.length / 2);
    const firstAvg = sorted.slice(0, half).reduce((sum, s) => sum + s.totalAreaBurnedHa, 0) / half;
    const secondAvg = sorted.slice(half).reduce((sum, s) => sum + s.totalAreaBurnedHa, 0) / (sorted.length - half);
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (change > 20) return `Increasing trend (+${change.toFixed(0)}%)`;
    if (change < -20) return `Decreasing trend (${change.toFixed(0)}%)`;
    return 'Stable with year-to-year variation';
  }

  private generateRecoveryScenarios(region: NonNullable<ReturnType<typeof stateManager.getRegion>>, riskScore: RiskScore): DisasterRecoveryScenario[] {
    const baseValue = region.zoningData.zones.reduce((sum, z) => sum + z.areaHa * 1000000, 0) || 100000000;
    const riskMult = 1 + (riskScore.overallScore / 200);

    return [
      { regionId: region.regionId, scenarioName: 'Minor (100-500 ha)', eventMagnitude: 'minor', estimatedDamage: Math.round(baseValue * 0.005 * riskMult), recoveryTimeMonths: 6, insurancePayoutEstimate: Math.round(baseValue * 0.004 * riskMult), outOfPocketEstimate: Math.round(baseValue * 0.001 * riskMult), evacuationCost: 250000, infrastructureRepairCost: Math.round(baseValue * 0.002) },
      { regionId: region.regionId, scenarioName: 'Moderate (500-5k ha)', eventMagnitude: 'moderate', estimatedDamage: Math.round(baseValue * 0.03 * riskMult), recoveryTimeMonths: 18, insurancePayoutEstimate: Math.round(baseValue * 0.022 * riskMult), outOfPocketEstimate: Math.round(baseValue * 0.008 * riskMult), evacuationCost: 2500000, infrastructureRepairCost: Math.round(baseValue * 0.01) },
      { regionId: region.regionId, scenarioName: 'Major (5k-50k ha)', eventMagnitude: 'major', estimatedDamage: Math.round(baseValue * 0.12 * riskMult), recoveryTimeMonths: 36, insurancePayoutEstimate: Math.round(baseValue * 0.085 * riskMult), outOfPocketEstimate: Math.round(baseValue * 0.035 * riskMult), evacuationCost: 15000000, infrastructureRepairCost: Math.round(baseValue * 0.05) },
      { regionId: region.regionId, scenarioName: 'Catastrophic (>50k ha)', eventMagnitude: 'catastrophic', estimatedDamage: Math.round(baseValue * 0.35 * riskMult), recoveryTimeMonths: 60, insurancePayoutEstimate: Math.round(baseValue * 0.22 * riskMult), outOfPocketEstimate: Math.round(baseValue * 0.13 * riskMult), evacuationCost: 50000000, infrastructureRepairCost: Math.round(baseValue * 0.15) }
    ];
  }

  private generateRecommendations(riskScore: RiskScore): string[] {
    const recs: string[] = [];
    
    if (riskScore.components.wildfireExposure > 60) {
      recs.push('Implement FireSmart landscaping standards within 100m of structures');
      recs.push('Increase fuel management and create firebreaks around developed areas');
      recs.push('Upgrade building codes to require fire-resistant materials');
    }
    if (riskScore.components.historicalLoss > 50) {
      recs.push('Conduct detailed loss analysis to identify risk concentration');
      recs.push('Review portfolio limits and consider catastrophe reinsurance');
    }
    if (riskScore.components.vulnerabilityIndex > 60) {
      recs.push('Assess and improve emergency evacuation routes');
      recs.push('Implement development restrictions in highest-risk zones');
    }
    
    recs.push('Monitor daily Fire Weather Index during fire season');
    recs.push('Maintain 10m defensible space around structures');
    recs.push('Develop community wildfire response plans');
    
    return recs.slice(0, 10);
  }
}

export const insuranceRiskAnalyst = new InsuranceRiskAnalystAgent();

export async function analyzeRegionRisk(regionId: string) {
  return insuranceRiskAnalyst.analyzeRegion(regionId);
}
