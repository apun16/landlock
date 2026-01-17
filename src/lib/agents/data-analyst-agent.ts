import { BaseAgent, AgentConfig } from './base-agent';
import { WildfirePerimeter, WildfireStatistics, ZoningRegion } from '../types/hazard';

export interface DataAnalystInput {
  regionId: string;
  regionName: string;
  wildfireData: {
    fires: WildfirePerimeter[];
    statistics: WildfireStatistics[];
  };
  zoningData: {
    zones: ZoningRegion[];
  };
}

export interface DataAnalystOutput {
  dataQuality: {
    overallScore: number;
    wildfireDataQuality: number;
    zoningDataQuality: number;
    completeness: number;
    reliability: number;
  };
  summary: {
    totalFires: number;
    totalZones: number;
    dataSpan: string;
    majorGaps: string[];
  };
  validatedData: DataAnalystInput;
  recommendations: string[];
  readyForAnalysis: boolean;
}

export const DATA_ANALYST_CONFIG: AgentConfig = {
  id: 'data-analyst',
  name: 'Data Analyst',
  role: 'Geospatial Data Quality Specialist',
  goal: 'Validate and assess the quality of wildfire and zoning data to ensure reliable risk analysis.',
  backstory: 'Expert in geospatial data analysis with 10+ years validating wildfire datasets and municipal zoning records for insurance risk modeling.',
  model: 'gpt-4',
  temperature: 0.3
};

export class DataAnalystAgent extends BaseAgent {
  constructor(config: AgentConfig = DATA_ANALYST_CONFIG) {
    super(config);
  }

  async execute(input: DataAnalystInput): Promise<DataAnalystOutput> {
    const reasoning = `Analyzing data quality for ${input.regionName}. Checking ${input.wildfireData.fires.length} fire records and ${input.zoningData.zones.length} zoning zones.`;
    
    const wildfireQuality = this.assessWildfireDataQuality(input.wildfireData);
    const zoningQuality = this.assessZoningDataQuality(input.zoningData);
    const overallScore = (wildfireQuality + zoningQuality) / 2;
    
    const summary = {
      totalFires: input.wildfireData.fires.length,
      totalZones: input.zoningData.zones.length,
      dataSpan: this.calculateDataSpan(input.wildfireData.fires),
      majorGaps: this.identifyGaps(input)
    };

    const recommendations = await this.generateRecommendations(input, overallScore);
    const readyForAnalysis = overallScore >= 70;

    const output: DataAnalystOutput = {
      dataQuality: {
        overallScore,
        wildfireDataQuality: wildfireQuality,
        zoningDataQuality: zoningQuality,
        completeness: this.calculateCompleteness(input),
        reliability: this.calculateReliability(input)
      },
      summary,
      validatedData: input,
      recommendations,
      readyForAnalysis
    };

    this.logMessage(
      reasoning,
      'validate_data',
      { regionId: input.regionId },
      { dataQuality: output.dataQuality, readyForAnalysis },
      'insurance-risk-analyst'
    );

    return output;
  }

  private assessWildfireDataQuality(data: DataAnalystInput['wildfireData']): number {
    if (data.fires.length === 0) return 0;
    
    let score = 50;
    if (data.fires.length > 10) score += 20;
    if (data.statistics.length > 5) score += 15;
    if (data.fires.every(f => f.areaBurnedHa > 0)) score += 15;
    
    return Math.min(100, score);
  }

  private assessZoningDataQuality(data: DataAnalystInput['zoningData']): number {
    if (data.zones.length === 0) return 0;
    
    let score = 50;
    if (data.zones.length > 50) score += 25;
    if (data.zones.every(z => z.areaHa > 0)) score += 15;
    if (data.zones.some(z => z.developmentStatus === 'developed')) score += 10;
    
    return Math.min(100, score);
  }

  private calculateDataSpan(fires: WildfirePerimeter[]): string {
    if (fires.length === 0) return 'No data';
    const years = fires.map(f => f.fireYear);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return `${maxYear - minYear + 1} years (${minYear}-${maxYear})`;
  }

  private identifyGaps(input: DataAnalystInput): string[] {
    const gaps: string[] = [];
    
    if (input.wildfireData.fires.length < 5) {
      gaps.push('Limited wildfire historical data');
    }
    if (input.zoningData.zones.length < 10) {
      gaps.push('Insufficient zoning coverage');
    }
    if (input.wildfireData.statistics.length === 0) {
      gaps.push('Missing fire statistics');
    }
    
    return gaps;
  }

  private calculateCompleteness(input: DataAnalystInput): number {
    const hasFireData = input.wildfireData.fires.length > 0 ? 33 : 0;
    const hasStatistics = input.wildfireData.statistics.length > 0 ? 33 : 0;
    const hasZoning = input.zoningData.zones.length > 0 ? 34 : 0;
    return hasFireData + hasStatistics + hasZoning;
  }

  private calculateReliability(input: DataAnalystInput): number {
    const recentData = input.wildfireData.fires.filter(f => f.fireYear >= 2020).length;
    const totalData = input.wildfireData.fires.length;
    if (totalData === 0) return 0;
    return Math.min(100, (recentData / totalData) * 100 + 30);
  }

  private async generateRecommendations(input: DataAnalystInput, qualityScore: number): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (qualityScore < 70) {
      recommendations.push('Data quality below threshold - consider additional data sources');
    }
    if (input.wildfireData.fires.length < 10) {
      recommendations.push('Expand wildfire historical data to at least 10 years');
    }
    if (input.zoningData.zones.length < 50) {
      recommendations.push('Increase zoning data coverage for better accuracy');
    }
    
    if (this.llm) {
      try {
        const prompt = `Analyze this data for ${input.regionName}:
- ${input.wildfireData.fires.length} wildfire records
- ${input.zoningData.zones.length} zoning zones
- Data quality score: ${qualityScore}/100

Provide 2-3 specific recommendations to improve data quality for insurance risk analysis. Be concise.`;

        const llmRecommendations = await this.callLLM(
          `You are a data quality expert for insurance risk analysis. Provide specific, actionable recommendations.`,
          prompt
        );
        
        recommendations.push(...llmRecommendations.split('\n').filter(r => r.trim().length > 0).slice(0, 3));
      } catch {
        console.warn('LLM call failed, using rule-based recommendations only');
      }
    }
    
    return recommendations.slice(0, 5);
  }
}
