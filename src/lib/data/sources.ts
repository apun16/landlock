import { DataSource, DataSourceCatalog } from '../types/hazard';

const wildfireSources: DataSource[] = [
  {
    id: 'cwfis-fire-perimeters',
    name: 'CWFIS Fire Perimeters (NBAC)',
    type: 'geojson',
    url: 'https://cwfis.cfs.nrcan.gc.ca/downloads/nbac/nbac_poly_bc_YYYY.zip',
    format: 'shapefile/geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - Canada',
    description: 'National Burned Area Composite polygons for BC wildfires'
  },
  {
    id: 'cwfis-hotspots',
    name: 'CWFIS Active Fire Hotspots',
    type: 'api',
    url: 'https://cwfis.cfs.nrcan.gc.ca/geoserver/public/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=public:activefires_current&outputFormat=application/json&CQL_FILTER=prov=%27BC%27',
    format: 'geojson',
    updateFrequency: 'daily',
    license: 'Open Government Licence - Canada',
    description: 'Real-time satellite-detected fire hotspots in BC'
  },
  {
    id: 'bc-wildfire-perimeters',
    name: 'BC Wildfire Fire Perimeters - Current',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'daily',
    license: 'Open Government Licence - British Columbia',
    description: 'Current season fire perimeters from BC Wildfire Service'
  },
  {
    id: 'bc-wildfire-historical',
    name: 'BC Historical Fire Perimeters',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LAND_AND_NATURAL_RESOURCE.PROT_HISTORICAL_FIRE_POLYS_SP/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_HISTORICAL_FIRE_POLYS_SP&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'Historical fire perimeters dating back to 1917'
  },
  {
    id: 'bc-fire-centres',
    name: 'BC Fire Centres',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.DRP_MOF_FIRE_CENTRES_SP/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_LEGAL_ADMIN_BOUNDARIES.DRP_MOF_FIRE_CENTRES_SP&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'BC Fire Centre administrative boundaries'
  },
  {
    id: 'bc-fire-zones',
    name: 'BC Fire Zones',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.DRP_MOF_FIRE_ZONES_SP/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_LEGAL_ADMIN_BOUNDARIES.DRP_MOF_FIRE_ZONES_SP&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'BC Fire Zone administrative boundaries'
  },
  {
    id: 'bc-fire-weather-stations',
    name: 'BC Fire Weather Stations',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LAND_AND_NATURAL_RESOURCE.PROT_WEATHER_STATIONS_SP/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_WEATHER_STATIONS_SP&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'daily',
    license: 'Open Government Licence - British Columbia',
    description: 'Fire weather monitoring stations across BC'
  }
];

const zoningSources: DataSource[] = [
  {
    id: 'vancouver-zoning',
    name: 'City of Vancouver Zoning Districts',
    type: 'api',
    url: 'https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/zoning-districts-and-labels/exports/geojson',
    format: 'geojson',
    updateFrequency: 'monthly',
    license: 'Open Government Licence - Vancouver',
    description: 'Zoning district polygons and labels for Vancouver'
  },
  {
    id: 'bc-municipalities',
    name: 'BC Municipalities',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'Municipal boundaries across BC'
  },
  {
    id: 'bc-regional-districts',
    name: 'BC Regional Districts',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_REGIONAL_DISTRICTS_SP/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_REGIONAL_DISTRICTS_SP&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'Regional district boundaries across BC'
  },
  {
    id: 'bc-land-cover',
    name: 'BC Land Cover Classification',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_BASEMAPPING.BTM_PRESENT_LAND_USE_V1_SVW/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_BASEMAPPING.BTM_PRESENT_LAND_USE_V1_SVW&outputFormat=application/json&count=5000',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'Present land use/land cover classification'
  },
  {
    id: 'bc-parcels',
    name: 'BC Parcel Fabric',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW&outputFormat=application/json&count=1000',
    format: 'geojson',
    updateFrequency: 'monthly',
    license: 'Open Government Licence - British Columbia',
    description: 'Cadastral parcel polygons'
  },
  {
    id: 'surrey-zoning',
    name: 'City of Surrey Zoning',
    type: 'api',
    url: 'https://cosmos.surrey.ca/geo_ref/Images/OpenData/Zoning/Zoning.geojson',
    format: 'geojson',
    updateFrequency: 'monthly',
    license: 'Open Government Licence - Surrey',
    description: 'Zoning polygons for City of Surrey'
  },
  {
    id: 'burnaby-zoning',
    name: 'City of Burnaby Zoning',
    type: 'api',
    url: 'https://data.burnaby.ca/datasets/burnaby::zoning.geojson',
    format: 'geojson',
    updateFrequency: 'monthly',
    license: 'Open Government Licence - Burnaby',
    description: 'Zoning polygons for City of Burnaby'
  }
];

const insuranceSources: DataSource[] = [
  {
    id: 'ibc-catastrophic-losses',
    name: 'IBC Catastrophic Loss Database',
    type: 'csv',
    url: 'http://www.ibc.ca/ns/resources/media-centre/cat-loss-data',
    format: 'csv',
    updateFrequency: 'yearly',
    license: 'Public',
    description: 'Insurance Bureau of Canada catastrophic loss events'
  },
  {
    id: 'bc-wildfire-costs',
    name: 'BC Wildfire Cost Statistics',
    type: 'api',
    url: 'https://www2.gov.bc.ca/gov/content/safety/wildfire-status/about-bcws/wildfire-statistics/wildfire-averages',
    format: 'html/table',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'Annual wildfire suppression costs and statistics'
  },
  {
    id: 'bc-property-assessment',
    name: 'BC Assessment Property Data',
    type: 'api',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_HUMAN_CULTURAL_ECONOMIC.BCA_FOLIO_GNRL_PROPERTY_VALUES_SV/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.BCA_FOLIO_GNRL_PROPERTY_VALUES_SV&outputFormat=application/json&count=1000',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'Property assessment values for exposure calculation'
  }
];

const climateSources: DataSource[] = [
  {
    id: 'cwfis-fwi',
    name: 'CWFIS Fire Weather Index',
    type: 'api',
    url: 'https://cwfis.cfs.nrcan.gc.ca/geoserver/public/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=public:fwi_current&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'daily',
    license: 'Open Government Licence - Canada',
    description: 'Current Fire Weather Index values across Canada'
  },
  {
    id: 'eccc-climate-normals',
    name: 'ECCC Climate Normals',
    type: 'api',
    url: 'https://climate.weather.gc.ca/climate_normals/',
    format: 'csv',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - Canada',
    description: 'Climate normals for temperature, precipitation'
  },
  {
    id: 'pcic-climate-projections',
    name: 'PCIC Climate Projections',
    type: 'api',
    url: 'https://data.pacificclimate.org/portal/bc_prism/api/',
    format: 'netcdf/geojson',
    updateFrequency: 'yearly',
    license: 'Creative Commons',
    description: 'Pacific Climate Impacts Consortium future projections'
  },
  {
    id: 'bc-drought-monitor',
    name: 'BC Drought Information Portal',
    type: 'api',
    url: 'https://governmentofbc.maps.arcgis.com/apps/MapSeries/index.html?appid=838d533d8062411c820eef50b08f7ebc',
    format: 'arcgis',
    updateFrequency: 'weekly',
    license: 'Open Government Licence - British Columbia',
    description: 'Current drought conditions and stream levels'
  }
];

const infrastructureSources: DataSource[] = [
  {
    id: 'bc-hospitals',
    name: 'BC Health Authority Facilities',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_IMAGERY_AND_BASE_MAPS.GSR_HOSPITALS_SVW/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_IMAGERY_AND_BASE_MAPS.GSR_HOSPITALS_SVW&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'Hospital and health facility locations'
  },
  {
    id: 'bc-schools',
    name: 'BC Schools',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_IMAGERY_AND_BASE_MAPS.GSR_SCHOOLS_K_TO_12_SVW/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_IMAGERY_AND_BASE_MAPS.GSR_SCHOOLS_K_TO_12_SVW&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'K-12 school locations'
  },
  {
    id: 'bc-fire-stations',
    name: 'BC Fire Stations',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_IMAGERY_AND_BASE_MAPS.GSR_FIRE_STATIONS_SVW/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_IMAGERY_AND_BASE_MAPS.GSR_FIRE_STATIONS_SVW&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'Fire station locations'
  },
  {
    id: 'bc-transmission-lines',
    name: 'BC Hydro Transmission Lines',
    type: 'wfs',
    url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_IMAGERY_AND_BASE_MAPS.GSR_TRANSMISSION_LINES_SVW/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_IMAGERY_AND_BASE_MAPS.GSR_TRANSMISSION_LINES_SVW&outputFormat=application/json',
    format: 'geojson',
    updateFrequency: 'yearly',
    license: 'Open Government Licence - British Columbia',
    description: 'Major power transmission infrastructure'
  },
  {
    id: 'statcan-census-subdivisions',
    name: 'Statistics Canada Census Subdivisions',
    type: 'geojson',
    url: 'https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/files-fichiers/lcsd000b21a_e.zip',
    format: 'shapefile',
    updateFrequency: 'yearly',
    license: 'Statistics Canada Open Licence',
    description: 'Census subdivision boundaries with population data'
  }
];

export const dataSourceCatalog: DataSourceCatalog = {
  wildfire: wildfireSources,
  zoning: zoningSources,
  insurance: insuranceSources,
  climate: climateSources,
  infrastructure: infrastructureSources
};

export function getAllDataSources(): DataSource[] {
  return [
    ...dataSourceCatalog.wildfire,
    ...dataSourceCatalog.zoning,
    ...dataSourceCatalog.insurance,
    ...dataSourceCatalog.climate,
    ...dataSourceCatalog.infrastructure
  ];
}

export function getDataSourceById(id: string): DataSource | undefined {
  return getAllDataSources().find(source => source.id === id);
}

export function getDataSourcesByCategory(category: keyof DataSourceCatalog): DataSource[] {
  return dataSourceCatalog[category];
}

export const BC_FIRE_CENTRES = [
  { id: 'cariboo', name: 'Cariboo Fire Centre', code: 'C' },
  { id: 'coastal', name: 'Coastal Fire Centre', code: 'V' },
  { id: 'kamloops', name: 'Kamloops Fire Centre', code: 'K' },
  { id: 'northwest', name: 'Northwest Fire Centre', code: 'R' },
  { id: 'prince-george', name: 'Prince George Fire Centre', code: 'G' },
  { id: 'southeast', name: 'Southeast Fire Centre', code: 'N' }
] as const;

export const BC_MAJOR_MUNICIPALITIES = [
  { id: 'vancouver', name: 'Vancouver', population: 662248, regionalDistrict: 'Metro Vancouver' },
  { id: 'surrey', name: 'Surrey', population: 568322, regionalDistrict: 'Metro Vancouver' },
  { id: 'burnaby', name: 'Burnaby', population: 249125, regionalDistrict: 'Metro Vancouver' },
  { id: 'richmond', name: 'Richmond', population: 209937, regionalDistrict: 'Metro Vancouver' },
  { id: 'victoria', name: 'Victoria', population: 91867, regionalDistrict: 'Capital' },
  { id: 'kelowna', name: 'Kelowna', population: 144576, regionalDistrict: 'Central Okanagan' },
  { id: 'kamloops', name: 'Kamloops', population: 97902, regionalDistrict: 'Thompson-Nicola' },
  { id: 'nanaimo', name: 'Nanaimo', population: 99863, regionalDistrict: 'Nanaimo' },
  { id: 'prince-george', name: 'Prince George', population: 76708, regionalDistrict: 'Fraser-Fort George' },
  { id: 'chilliwack', name: 'Chilliwack', population: 93203, regionalDistrict: 'Fraser Valley' }
] as const;

export const MAJOR_BC_WILDFIRES = [
  { year: 2023, name: 'Donnie Creek Complex', areaBurnedHa: 586240, cause: 'lightning', fireCentre: 'Prince George' },
  { year: 2021, name: 'Lytton Creek Fire', areaBurnedHa: 83412, cause: 'unknown', fireCentre: 'Kamloops', note: 'Destroyed town of Lytton' },
  { year: 2018, name: 'Shovel Lake Fire', areaBurnedHa: 92000, cause: 'lightning', fireCentre: 'Prince George' },
  { year: 2017, name: 'Elephant Hill Fire', areaBurnedHa: 191865, cause: 'human', fireCentre: 'Kamloops' },
  { year: 2003, name: 'Okanagan Mountain Park Fire', areaBurnedHa: 25600, cause: 'lightning', fireCentre: 'Kamloops', note: 'Destroyed 239 homes in Kelowna' }
] as const;
