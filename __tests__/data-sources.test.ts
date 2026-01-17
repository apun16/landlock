import { describe, it, expect } from 'vitest';
import { dataSourceCatalog, getAllDataSources, getDataSourceById, getDataSourcesByCategory, BC_FIRE_CENTRES, BC_MAJOR_MUNICIPALITIES, MAJOR_BC_WILDFIRES } from '@/lib/data/sources';

describe('Data Sources', () => {
  describe('Data Source Catalog', () => {
    it('should have all required categories', () => {
      expect(dataSourceCatalog.wildfire).toBeDefined();
      expect(dataSourceCatalog.zoning).toBeDefined();
      expect(dataSourceCatalog.insurance).toBeDefined();
      expect(dataSourceCatalog.climate).toBeDefined();
      expect(dataSourceCatalog.infrastructure).toBeDefined();
    });

    it('should have wildfire data sources', () => {
      expect(dataSourceCatalog.wildfire.length).toBeGreaterThan(0);
      
      const bcPerimeters = dataSourceCatalog.wildfire.find(s => s.id === 'bc-wildfire-perimeters');
      expect(bcPerimeters).toBeDefined();
      expect(bcPerimeters?.url).toContain('openmaps.gov.bc.ca');
    });

    it('should have zoning data sources', () => {
      expect(dataSourceCatalog.zoning.length).toBeGreaterThan(0);
      
      const vancouverZoning = dataSourceCatalog.zoning.find(s => s.id === 'vancouver-zoning');
      expect(vancouverZoning).toBeDefined();
      expect(vancouverZoning?.url).toContain('opendata.vancouver.ca');
    });
  });

  describe('getAllDataSources', () => {
    it('should return all data sources as flat array', () => {
      const allSources = getAllDataSources();
      expect(allSources.length).toBeGreaterThan(10);
      
      const totalExpected = 
        dataSourceCatalog.wildfire.length +
        dataSourceCatalog.zoning.length +
        dataSourceCatalog.insurance.length +
        dataSourceCatalog.climate.length +
        dataSourceCatalog.infrastructure.length;
      
      expect(allSources.length).toBe(totalExpected);
    });
  });

  describe('getDataSourceById', () => {
    it('should find existing data source', () => {
      const source = getDataSourceById('bc-wildfire-perimeters');
      expect(source).toBeDefined();
      expect(source?.name).toContain('BC Wildfire');
    });

    it('should return undefined for non-existent source', () => {
      const source = getDataSourceById('non-existent-source');
      expect(source).toBeUndefined();
    });
  });

  describe('getDataSourcesByCategory', () => {
    it('should return sources for a category', () => {
      const wildfireSources = getDataSourcesByCategory('wildfire');
      expect(wildfireSources.length).toBe(dataSourceCatalog.wildfire.length);
    });
  });

  describe('Reference Data', () => {
    it('should have all BC fire centres', () => {
      expect(BC_FIRE_CENTRES.length).toBe(6);
      
      const names = BC_FIRE_CENTRES.map(fc => fc.name);
      expect(names).toContain('Cariboo Fire Centre');
      expect(names).toContain('Coastal Fire Centre');
      expect(names).toContain('Kamloops Fire Centre');
      expect(names).toContain('Northwest Fire Centre');
      expect(names).toContain('Prince George Fire Centre');
      expect(names).toContain('Southeast Fire Centre');
    });

    it('should have major BC municipalities', () => {
      expect(BC_MAJOR_MUNICIPALITIES.length).toBe(1);
      
      const kamloops = BC_MAJOR_MUNICIPALITIES.find(m => m.id === 'kamloops');
      expect(kamloops).toBeDefined();
      expect(kamloops?.population).toBeGreaterThan(90000);
      expect(kamloops?.regionalDistrict).toBe('Thompson-Nicola');
    });

    it('should have major historical wildfires', () => {
      expect(MAJOR_BC_WILDFIRES.length).toBeGreaterThan(0);
      
      const donnieCreek = MAJOR_BC_WILDFIRES.find(f => f.name === 'Donnie Creek Complex');
      expect(donnieCreek).toBeDefined();
      expect(donnieCreek?.year).toBe(2023);
      expect(donnieCreek?.areaBurnedHa).toBeGreaterThan(500000);
    });
  });

  describe('Data Source Validity', () => {
    it('should have valid URLs for all sources', () => {
      const allSources = getAllDataSources();
      
      allSources.forEach(source => {
        expect(source.url).toBeDefined();
        expect(source.url.length).toBeGreaterThan(0);
        expect(source.url.startsWith('http')).toBe(true);
      });
    });

    it('should have required fields for all sources', () => {
      const allSources = getAllDataSources();
      
      allSources.forEach(source => {
        expect(source.id).toBeDefined();
        expect(source.name).toBeDefined();
        expect(source.type).toBeDefined();
        expect(source.format).toBeDefined();
        expect(source.updateFrequency).toBeDefined();
        expect(source.license).toBeDefined();
        expect(source.description).toBeDefined();
      });
    });

    it('should have valid update frequencies', () => {
      const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly', 'realtime'];
      const allSources = getAllDataSources();
      
      allSources.forEach(source => {
        expect(validFrequencies).toContain(source.updateFrequency);
      });
    });
  });
});
