import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '@/lib/state/region-state';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('Region Operations', () => {
    it('should create and retrieve a region', () => {
      stateManager.setRegion('test-region', {
        regionId: 'test-region',
        regionName: 'Test Region',
        regionType: 'municipality'
      });

      const region = stateManager.getRegion('test-region');
      expect(region).toBeDefined();
      expect(region?.regionId).toBe('test-region');
      expect(region?.regionName).toBe('Test Region');
    });

    it('should return undefined for non-existent region', () => {
      const region = stateManager.getRegion('non-existent');
      expect(region).toBeUndefined();
    });

    it('should get all regions', () => {
      stateManager.setRegion('region-1', { regionId: 'region-1', regionName: 'Region 1', regionType: 'municipality' });
      stateManager.setRegion('region-2', { regionId: 'region-2', regionName: 'Region 2', regionType: 'fire_centre' });

      const regions = stateManager.getAllRegions();
      expect(regions.length).toBe(2);
    });

    it('should update hazard data', () => {
      stateManager.setRegion('test', { regionId: 'test', regionName: 'Test', regionType: 'municipality' });
      
      const fires = [{ fireId: 'F1', fireName: 'Fire 1', fireYear: 2023, areaBurnedHa: 100, fireCentre: 'Test', fireZone: 'Z1', cause: 'lightning' as const, status: 'out' as const, startDate: new Date(), geometry: { type: 'Polygon' as const, coordinates: [] } }];
      const stats = [{ year: 2023, fireCentre: 'Test', totalFires: 1, totalAreaBurnedHa: 100, averageFireSizeHa: 100, lightningCaused: 1, humanCaused: 0, structuresDestroyed: 0, estimatedCost: 50000, evacuationOrders: 0 }];
      
      stateManager.updateRegionHazardData('test', fires, stats);
      
      const region = stateManager.getRegion('test');
      expect(region?.hazardData.historicalFires.length).toBe(1);
      expect(region?.hazardData.fireStatistics.length).toBe(1);
    });

    it('should update zoning data', () => {
      stateManager.setRegion('test', { regionId: 'test', regionName: 'Test', regionType: 'municipality' });
      
      const zones = [
        { id: 'z1', municipality: 'Test', regionDistrict: 'RD', zoningCode: 'RS-1', zoningCategory: 'residential_single' as const, zoningDescription: 'Single Family', geometry: { type: 'Polygon' as const, coordinates: [] }, areaHa: 10, developmentStatus: 'developed' as const, allowedUses: [] },
        { id: 'z2', municipality: 'Test', regionDistrict: 'RD', zoningCode: 'AG', zoningCategory: 'agricultural' as const, zoningDescription: 'Agricultural', geometry: { type: 'Polygon' as const, coordinates: [] }, areaHa: 50, developmentStatus: 'underdeveloped' as const, allowedUses: [] }
      ];
      
      stateManager.updateRegionZoningData('test', zones);
      
      const region = stateManager.getRegion('test');
      expect(region?.zoningData.zones.length).toBe(2);
      expect(region?.zoningData.developedPercentage).toBe(50);
      expect(region?.zoningData.underdevelopedPercentage).toBe(50);
    });

    it('should update risk score and rankings', () => {
      stateManager.setRegion('region-1', { regionId: 'region-1', regionName: 'High Risk', regionType: 'municipality' });
      stateManager.setRegion('region-2', { regionId: 'region-2', regionName: 'Low Risk', regionType: 'municipality' });

      stateManager.updateRegionRiskScore('region-1', {
        regionId: 'region-1',
        overallScore: 75,
        category: 'high',
        components: { wildfireExposure: 80, historicalLoss: 70, vulnerabilityIndex: 60, climateProjection: 50, mitigationFactor: 20 },
        confidence: 0.8,
        calculatedAt: new Date(),
        validUntil: new Date()
      });

      stateManager.updateRegionRiskScore('region-2', {
        regionId: 'region-2',
        overallScore: 25,
        category: 'low',
        components: { wildfireExposure: 20, historicalLoss: 30, vulnerabilityIndex: 20, climateProjection: 30, mitigationFactor: 40 },
        confidence: 0.7,
        calculatedAt: new Date(),
        validUntil: new Date()
      });

      const rankings = stateManager.getGlobalRankings();
      expect(rankings.length).toBe(2);
      expect(rankings[0].regionId).toBe('region-1');
      expect(rankings[0].rank).toBe(1);
      expect(rankings[1].regionId).toBe('region-2');
      expect(rankings[1].rank).toBe(2);
    });
  });

  describe('Event Operations', () => {
    it('should emit and retrieve events', () => {
      const event = stateManager.emitEvent({
        type: 'data_ingestion_started',
        payload: { test: true }
      });

      expect(event.id).toBeDefined();
      expect(event.type).toBe('data_ingestion_started');
      expect(event.status).toBe('pending');

      const events = stateManager.getRecentEvents(10);
      expect(events.length).toBe(1);
    });

    it('should update event status', () => {
      const event = stateManager.emitEvent({ type: 'risk_scoring_started', payload: {} });
      stateManager.updateEventStatus(event.id, 'completed');

      const events = stateManager.getRecentEvents(10);
      expect(events[0].status).toBe('completed');
    });

    it('should filter events by type', () => {
      stateManager.emitEvent({ type: 'data_ingestion_started', payload: {} });
      stateManager.emitEvent({ type: 'risk_scoring_started', payload: {} });
      stateManager.emitEvent({ type: 'data_ingestion_completed', payload: {} });

      const ingestionEvents = stateManager.getEventsByType('data_ingestion_started');
      expect(ingestionEvents.length).toBe(1);
    });
  });

  describe('Constraint Operations', () => {
    it('should add and retrieve constraints', () => {
      const constraint = stateManager.addConstraint({
        type: 'budget_limit',
        regionId: 'test-region',
        value: 1000000,
        description: 'Annual budget limit',
        source: 'Municipal policy',
        validFrom: new Date()
      });

      expect(constraint.id).toBeDefined();
      
      const constraints = stateManager.getConstraintsForRegion('test-region');
      expect(constraints.length).toBe(1);
    });

    it('should get active constraints', () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-01-01');
      
      stateManager.addConstraint({
        type: 'budget_limit',
        value: 1000000,
        description: 'Active constraint',
        source: 'Test',
        validFrom: pastDate,
        validUntil: futureDate
      });

      stateManager.addConstraint({
        type: 'zoning_restriction',
        value: true,
        description: 'Expired constraint',
        source: 'Test',
        validFrom: pastDate,
        validUntil: pastDate
      });

      const active = stateManager.getActiveConstraints();
      expect(active.length).toBe(1);
    });
  });

  describe('Plan Variant Operations', () => {
    it('should add and retrieve plan variants', () => {
      const variant = stateManager.addPlanVariant({
        name: 'Climate Adaptation',
        description: 'Scenario with climate change mitigation',
        scenario: 'moderate_climate',
        assumptions: { temperatureIncrease: 1.5 },
        projectedOutcomes: { riskScoreChange: -10, costImpact: 500000, timelineYears: 5 }
      });

      expect(variant.id).toBeDefined();
      expect(variant.createdAt).toBeDefined();

      const variants = stateManager.getPlanVariants();
      expect(variants.length).toBe(1);
    });
  });

  describe('Pipeline Status', () => {
    it('should track pipeline running state', () => {
      expect(stateManager.getPipelineStatus().isRunning).toBe(false);
      
      stateManager.setPipelineRunning(true);
      expect(stateManager.getPipelineStatus().isRunning).toBe(true);
      
      stateManager.setPipelineRunning(false);
      expect(stateManager.getPipelineStatus().isRunning).toBe(false);
      expect(stateManager.getPipelineStatus().lastRun).toBeDefined();
    });

    it('should track active jobs', () => {
      stateManager.incrementActiveJobs();
      stateManager.incrementActiveJobs();
      expect(stateManager.getPipelineStatus().activeJobCount).toBe(2);
      
      stateManager.decrementActiveJobs();
      expect(stateManager.getPipelineStatus().activeJobCount).toBe(1);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize state', () => {
      stateManager.setRegion('test', { regionId: 'test', regionName: 'Test', regionType: 'municipality' });
      
      const json = stateManager.serialize();
      expect(typeof json).toBe('string');
      
      const newManager = new StateManager();
      newManager.deserialize(json);
      
      const region = newManager.getRegion('test');
      expect(region?.regionName).toBe('Test');
    });

    it('should reset state', () => {
      stateManager.setRegion('test', { regionId: 'test', regionName: 'Test', regionType: 'municipality' });
      expect(stateManager.getAllRegions().length).toBe(1);
      
      stateManager.reset();
      expect(stateManager.getAllRegions().length).toBe(0);
    });
  });
});
