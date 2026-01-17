import { describe, it, expect, beforeEach } from 'vitest';
import { CrewOrchestrator } from '@/lib/agents/crew-orchestrator';
import { stateManager } from '@/lib/state/region-state';

describe('Crew Orchestrator - 3-Agent System', () => {
  let orchestrator: CrewOrchestrator;

  beforeEach(() => {
    orchestrator = new CrewOrchestrator();
    stateManager.reset();
  });

  describe('Agent Configuration', () => {
    it('should have 3 agents configured', () => {
      const agents = orchestrator.getAgents();
      
      expect(agents.dataAnalyst).toBeDefined();
      expect(agents.insuranceAnalyst).toBeDefined();
      expect(agents.mitigationStrategist).toBeDefined();
      
      expect(agents.dataAnalyst.id).toBe('data-analyst');
      expect(agents.mitigationStrategist.id).toBe('mitigation-strategist');
    });

    it('should have proper agent roles', () => {
      const agents = orchestrator.getAgents();
      
      expect(agents.dataAnalyst.role).toContain('Data Quality');
      expect(agents.mitigationStrategist.role).toContain('Mitigation');
    });
  });

  describe('Crew Execution', () => {
    it('should fail for non-existent region', async () => {
      await expect(orchestrator.runCrew('non-existent')).rejects.toThrow('Region non-existent not found');
    });

    it('should execute full 3-agent workflow', async () => {
      stateManager.setRegion('kamloops', {
        regionId: 'kamloops',
        regionName: 'Kamloops',
        regionType: 'municipality',
        hazardData: {
          historicalFires: [{
            fireId: 'F1',
            fireName: 'Test Fire',
            fireYear: 2023,
            areaBurnedHa: 1000,
            fireCentre: 'Kamloops',
            fireZone: 'K1',
            cause: 'lightning' as const,
            status: 'out' as const,
            startDate: new Date(),
            geometry: { type: 'Polygon' as const, coordinates: [] }
          }],
          fireStatistics: [{
            year: 2023,
            fireCentre: 'Kamloops',
            totalFires: 5,
            totalAreaBurnedHa: 5000,
            averageFireSizeHa: 1000,
            lightningCaused: 3,
            humanCaused: 2,
            structuresDestroyed: 1,
            estimatedCost: 1000000,
            evacuationOrders: 0
          }],
          lastUpdated: new Date()
        },
        zoningData: {
          zones: [{
            id: 'z1',
            municipality: 'Kamloops',
            regionDistrict: 'Thompson-Nicola',
            zoningCode: 'RS-1',
            zoningCategory: 'residential_single' as const,
            zoningDescription: 'Single Family',
            geometry: { type: 'Polygon' as const, coordinates: [] },
            areaHa: 100,
            developmentStatus: 'developed' as const,
            allowedUses: []
          }],
          developedPercentage: 100,
          underdevelopedPercentage: 0,
          lastUpdated: new Date()
        }
      });

      const result = await orchestrator.runCrew('kamloops');

      expect(result.regionId).toBe('kamloops');
      expect(result.regionName).toBe('Kamloops');
      expect(result.agentCount).toBe(3);
      expect(result.status).toBe('completed');
      
      expect(result.dataQuality).toBeDefined();
      expect(result.dataQuality.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.dataQuality.overallScore).toBeLessThanOrEqual(100);
      
      expect(result.riskScore).toBeDefined();
      expect(result.riskScore.overallScore).toBeGreaterThanOrEqual(0);
      
      expect(result.mitigationStrategy).toBeDefined();
      expect(result.mitigationStrategy.actions.length).toBeGreaterThan(0);
      
      expect(result.communicationLog.length).toBeGreaterThan(0);
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should generate communication log with agent hand-offs', async () => {
      stateManager.setRegion('kamloops', {
        regionId: 'kamloops',
        regionName: 'Kamloops',
        regionType: 'municipality',
        hazardData: { historicalFires: [], fireStatistics: [], lastUpdated: new Date() },
        zoningData: { zones: [], developedPercentage: 0, underdevelopedPercentage: 0, lastUpdated: new Date() }
      });

      const result = await orchestrator.runCrew('kamloops');

      expect(result.communicationLog.length).toBeGreaterThan(0);
      
      const agentIds = result.communicationLog.map(msg => msg.agentId);
      expect(agentIds).toContain('data-analyst');
      expect(agentIds).toContain('insurance-risk-analyst');
      expect(agentIds).toContain('mitigation-strategist');
      
      result.communicationLog.forEach(msg => {
        expect(msg.timestamp).toBeInstanceOf(Date);
        expect(msg.reasoning).toBeDefined();
        expect(msg.action).toBeDefined();
      });
    });

    it('should produce mitigation actions', async () => {
      stateManager.setRegion('kamloops', {
        regionId: 'kamloops',
        regionName: 'Kamloops',
        regionType: 'municipality',
        hazardData: {
          historicalFires: Array(15).fill(null).map((_, i) => ({
            fireId: `F${i}`,
            fireName: `Fire ${i}`,
            fireYear: 2020 + (i % 4),
            areaBurnedHa: 1000 * (i + 1),
            fireCentre: 'Kamloops',
            fireZone: 'K1',
            cause: 'lightning' as const,
            status: 'out' as const,
            startDate: new Date(),
            geometry: { type: 'Polygon' as const, coordinates: [] }
          })),
          fireStatistics: [],
          lastUpdated: new Date()
        },
        zoningData: { zones: [], developedPercentage: 0, underdevelopedPercentage: 0, lastUpdated: new Date() }
      });

      const result = await orchestrator.runCrew('kamloops');

      expect(result.mitigationStrategy.actions.length).toBeGreaterThan(0);
      
      result.mitigationStrategy.actions.forEach(action => {
        expect(action.title).toBeDefined();
        expect(action.description).toBeDefined();
        expect(action.priority).toMatch(/critical|high|medium|low/);
        expect(action.category).toMatch(/prevention|preparedness|mitigation|insurance/);
        expect(action.estimatedCost).toBeGreaterThan(0);
        expect(action.timeframe).toBeDefined();
        expect(action.expectedRiskReduction).toBeGreaterThanOrEqual(0);
        expect(action.stakeholders.length).toBeGreaterThan(0);
      });

      expect(result.mitigationStrategy.totalEstimatedCost).toBeGreaterThan(0);
      expect(result.mitigationStrategy.expectedRiskReduction).toBeGreaterThanOrEqual(0);
    });
  });
});
