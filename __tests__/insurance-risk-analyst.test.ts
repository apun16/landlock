import { describe, it, expect, beforeEach } from 'vitest';
import { InsuranceRiskAnalystAgent, INSURANCE_RISK_ANALYST_CONFIG, INSURANCE_RISK_ANALYST_TASKS } from '@/lib/agents/insurance-risk-analyst';
import { stateManager } from '@/lib/state/region-state';

describe('Insurance Risk Analyst Agent', () => {
  let agent: InsuranceRiskAnalystAgent;

  beforeEach(() => {
    agent = new InsuranceRiskAnalystAgent();
    stateManager.reset();
  });

  describe('Agent Configuration', () => {
    it('should have valid configuration', () => {
      expect(INSURANCE_RISK_ANALYST_CONFIG.id).toBe('insurance-risk-analyst');
      expect(INSURANCE_RISK_ANALYST_CONFIG.name).toBe('Insurance Risk Analyst');
      expect(INSURANCE_RISK_ANALYST_CONFIG.role).toBeDefined();
      expect(INSURANCE_RISK_ANALYST_CONFIG.goal).toBeDefined();
      expect(INSURANCE_RISK_ANALYST_CONFIG.backstory).toBeDefined();
      expect(INSURANCE_RISK_ANALYST_CONFIG.tools.length).toBeGreaterThan(0);
    });

    it('should have all required tasks', () => {
      expect(INSURANCE_RISK_ANALYST_TASKS.length).toBe(6);
      
      const taskIds = INSURANCE_RISK_ANALYST_TASKS.map(t => t.id);
      expect(taskIds).toContain('assess-wildfire-exposure');
      expect(taskIds).toContain('analyze-historical-losses');
      expect(taskIds).toContain('evaluate-vulnerability');
      expect(taskIds).toContain('calculate-risk-score');
      expect(taskIds).toContain('project-future-costs');
      expect(taskIds).toContain('generate-risk-report');
    });
  });

  describe('Region Analysis', () => {
    it('should throw error for non-existent region', async () => {
      await expect(agent.analyzeRegion('non-existent')).rejects.toThrow('Region non-existent not found');
    });

    it('should analyze region with minimal data', async () => {
      stateManager.setRegion('test-region', {
        regionId: 'test-region',
        regionName: 'Test Region',
        regionType: 'municipality',
        hazardData: { historicalFires: [], fireStatistics: [], lastUpdated: new Date() },
        zoningData: { zones: [], developedPercentage: 0, underdevelopedPercentage: 0, lastUpdated: new Date() }
      });

      const result = await agent.analyzeRegion('test-region');

      expect(result.riskScore).toBeDefined();
      expect(result.riskScore.regionId).toBe('test-region');
      expect(result.riskScore.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore.overallScore).toBeLessThanOrEqual(100);
      expect(result.riskScore.category).toBeDefined();
      expect(result.report).toBeDefined();
      expect(result.conclusions.length).toBeGreaterThan(0);
    });

    it('should analyze region with fire data', async () => {
      const fires = [
        { fireId: 'F1', fireName: 'Fire 1', fireYear: 2023, areaBurnedHa: 5000, fireCentre: 'Test', fireZone: 'Z1', cause: 'lightning' as const, status: 'out' as const, startDate: new Date(), geometry: { type: 'Polygon' as const, coordinates: [] } },
        { fireId: 'F2', fireName: 'Fire 2', fireYear: 2022, areaBurnedHa: 3000, fireCentre: 'Test', fireZone: 'Z1', cause: 'human' as const, status: 'out' as const, startDate: new Date(), geometry: { type: 'Polygon' as const, coordinates: [] } }
      ];

      const stats = [
        { year: 2023, fireCentre: 'Test', totalFires: 10, totalAreaBurnedHa: 8000, averageFireSizeHa: 800, lightningCaused: 6, humanCaused: 4, structuresDestroyed: 5, estimatedCost: 5000000, evacuationOrders: 2 }
      ];

      stateManager.setRegion('fire-region', {
        regionId: 'fire-region',
        regionName: 'High Fire Region',
        regionType: 'fire_centre',
        hazardData: { historicalFires: fires, fireStatistics: stats, lastUpdated: new Date() },
        zoningData: { zones: [], developedPercentage: 0, underdevelopedPercentage: 0, lastUpdated: new Date() }
      });

      const result = await agent.analyzeRegion('fire-region');

      expect(result.riskScore.components.wildfireExposure).toBeGreaterThan(10);
      expect(result.riskScore.components.historicalLoss).toBeGreaterThan(10);
    });

    it('should analyze region with zoning data', async () => {
      const zones = [
        { id: 'z1', municipality: 'Test', regionDistrict: 'RD', zoningCode: 'RS-1', zoningCategory: 'residential_single' as const, zoningDescription: 'Single Family', geometry: { type: 'Polygon' as const, coordinates: [] }, areaHa: 100, developmentStatus: 'developed' as const, allowedUses: [] },
        { id: 'z2', municipality: 'Test', regionDistrict: 'RD', zoningCode: 'RM-3', zoningCategory: 'residential_multi' as const, zoningDescription: 'Multi Family', geometry: { type: 'Polygon' as const, coordinates: [] }, areaHa: 50, developmentStatus: 'developed' as const, allowedUses: [] }
      ];

      stateManager.setRegion('urban-region', {
        regionId: 'urban-region',
        regionName: 'Urban Region',
        regionType: 'municipality',
        hazardData: { historicalFires: [], fireStatistics: [], lastUpdated: new Date() },
        zoningData: { zones, developedPercentage: 100, underdevelopedPercentage: 0, lastUpdated: new Date() }
      });

      const result = await agent.analyzeRegion('urban-region');

      expect(result.riskScore.components.vulnerabilityIndex).toBeGreaterThan(10);
    });

    it('should generate cost projections', async () => {
      stateManager.setRegion('test', {
        regionId: 'test',
        regionName: 'Test',
        regionType: 'municipality',
        hazardData: { historicalFires: [], fireStatistics: [{ year: 2023, fireCentre: 'Test', totalFires: 5, totalAreaBurnedHa: 1000, averageFireSizeHa: 200, lightningCaused: 3, humanCaused: 2, structuresDestroyed: 2, estimatedCost: 2000000, evacuationOrders: 1 }], lastUpdated: new Date() },
        zoningData: { zones: [], developedPercentage: 0, underdevelopedPercentage: 0, lastUpdated: new Date() }
      });

      const result = await agent.analyzeRegion('test');

      expect(result.report.projections.length).toBeGreaterThan(0);
      expect(result.report.projections.find(p => p.scenario === 'baseline')).toBeDefined();
      expect(result.report.projections.find(p => p.scenario === 'severe_climate')).toBeDefined();
    });

    it('should generate recovery scenarios', async () => {
      const zones = [{ id: 'z1', municipality: 'Test', regionDistrict: 'RD', zoningCode: 'RS-1', zoningCategory: 'residential_single' as const, zoningDescription: 'Test', geometry: { type: 'Polygon' as const, coordinates: [] }, areaHa: 500, developmentStatus: 'developed' as const, allowedUses: [] }];

      stateManager.setRegion('test', {
        regionId: 'test',
        regionName: 'Test',
        regionType: 'municipality',
        hazardData: { historicalFires: [], fireStatistics: [], lastUpdated: new Date() },
        zoningData: { zones, developedPercentage: 100, underdevelopedPercentage: 0, lastUpdated: new Date() }
      });

      const result = await agent.analyzeRegion('test');

      expect(result.report.recoveryScenarios.length).toBe(4);
      expect(result.report.recoveryScenarios.map(s => s.eventMagnitude)).toContain('minor');
      expect(result.report.recoveryScenarios.map(s => s.eventMagnitude)).toContain('catastrophic');
    });

    it('should generate recommendations', async () => {
      stateManager.setRegion('test', {
        regionId: 'test',
        regionName: 'Test',
        regionType: 'municipality',
        hazardData: { historicalFires: [], fireStatistics: [], lastUpdated: new Date() },
        zoningData: { zones: [], developedPercentage: 0, underdevelopedPercentage: 0, lastUpdated: new Date() }
      });

      const result = await agent.analyzeRegion('test');

      expect(result.report.recommendations.length).toBeGreaterThan(0);
    });

    it('should include explainability data', async () => {
      stateManager.setRegion('test', {
        regionId: 'test',
        regionName: 'Test',
        regionType: 'municipality',
        hazardData: { historicalFires: [], fireStatistics: [], lastUpdated: new Date() },
        zoningData: { zones: [], developedPercentage: 0, underdevelopedPercentage: 0, lastUpdated: new Date() }
      });

      const result = await agent.analyzeRegion('test');

      expect(result.report.explainability).toBeDefined();
      expect(result.report.explainability.methodology).toBeDefined();
      expect(result.report.explainability.dataSourcesUsed.length).toBeGreaterThan(0);
      expect(result.report.explainability.featureImportance).toBeDefined();
      expect(result.report.explainability.limitations.length).toBeGreaterThan(0);
    });

    it('should update state with results', async () => {
      stateManager.setRegion('test', {
        regionId: 'test',
        regionName: 'Test',
        regionType: 'municipality',
        hazardData: { historicalFires: [], fireStatistics: [], lastUpdated: new Date() },
        zoningData: { zones: [], developedPercentage: 0, underdevelopedPercentage: 0, lastUpdated: new Date() }
      });

      await agent.analyzeRegion('test');

      const region = stateManager.getRegion('test');
      expect(region?.riskScore).toBeDefined();
      expect(region?.reports.length).toBeGreaterThan(0);
      expect(region?.agentConclusions.length).toBeGreaterThan(0);
    });
  });
});
