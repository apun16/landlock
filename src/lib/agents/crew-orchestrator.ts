import { DataAnalystAgent, DataAnalystInput, DataAnalystOutput } from './data-analyst-agent';
import { InsuranceRiskAnalystAgent } from './insurance-risk-analyst';
import { MitigationStrategistAgent, MitigationStrategistInput, MitigationStrategistOutput } from './mitigation-strategist-agent';
import { AgentMessage } from './base-agent';
import { stateManager } from '../state/region-state';

export interface CrewState {
  regionId: string;
  regionName: string;
  currentAgent: string | null;
  dataAnalysis: DataAnalystOutput | null;
  riskAnalysis: { riskScore: any; report: any; conclusions: any[] } | null;
  mitigationStrategy: MitigationStrategistOutput | null;
  communicationLog: AgentMessage[];
  startTime: Date;
  endTime: Date | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error: string | null;
}

export interface CrewResult {
  regionId: string;
  regionName: string;
  dataQuality: DataAnalystOutput['dataQuality'];
  riskScore: any;
  riskReport: any;
  mitigationStrategy: MitigationStrategistOutput;
  communicationLog: AgentMessage[];
  executionTimeMs: number;
  agentCount: number;
  status: string;
}

export class CrewOrchestrator {
  private dataAnalyst: DataAnalystAgent;
  private insuranceAnalyst: InsuranceRiskAnalystAgent;
  private mitigationStrategist: MitigationStrategistAgent;

  constructor() {
    this.dataAnalyst = new DataAnalystAgent();
    this.insuranceAnalyst = new InsuranceRiskAnalystAgent();
    this.mitigationStrategist = new MitigationStrategistAgent();
  }

  async runCrew(regionId: string): Promise<CrewResult> {
    const state: CrewState = {
      regionId,
      regionName: '',
      currentAgent: null,
      dataAnalysis: null,
      riskAnalysis: null,
      mitigationStrategy: null,
      communicationLog: [],
      startTime: new Date(),
      endTime: null,
      status: 'running',
      error: null
    };

    try {
      const region = stateManager.getRegion(regionId);
      if (!region) {
        throw new Error(`Region ${regionId} not found. Run data ingestion first.`);
      }

      state.regionName = region.regionName;

      console.log(`\n🚀 Starting 3-Agent Crew for ${region.regionName}`);
      console.log('═'.repeat(60));

      state.currentAgent = 'data-analyst';
      console.log(`\n📊 Agent 1: Data Analyst`);
      const dataAnalystInput: DataAnalystInput = {
        regionId: region.regionId,
        regionName: region.regionName,
        wildfireData: {
          fires: region.hazardData.historicalFires,
          statistics: region.hazardData.fireStatistics
        },
        zoningData: {
          zones: region.zoningData.zones
        }
      };

      state.dataAnalysis = await this.dataAnalyst.execute(dataAnalystInput);
      state.communicationLog.push(...this.dataAnalyst.getMessageHistory());
      
      console.log(`   ✓ Data quality: ${state.dataAnalysis.dataQuality.overallScore}/100`);
      console.log(`   ✓ Ready for analysis: ${state.dataAnalysis.readyForAnalysis ? 'Yes' : 'No'}`);
      console.log(`   ↓ Passing to Insurance Risk Analyst`);

      if (!state.dataAnalysis.readyForAnalysis) {
        console.warn(`   ⚠️  Data quality below threshold, proceeding with caution`);
      }

      state.currentAgent = 'insurance-risk-analyst';
      console.log(`\n🔥 Agent 2: Insurance Risk Analyst`);
      state.riskAnalysis = await this.insuranceAnalyst.analyzeRegion(regionId);
      state.communicationLog.push(...this.insuranceAnalyst.getMessageHistory());
      
      console.log(`   ✓ Risk score: ${state.riskAnalysis.riskScore.overallScore}/100 (${state.riskAnalysis.riskScore.category})`);
      console.log(`   ✓ Report generated with ${state.riskAnalysis.report.recommendations.length} recommendations`);
      console.log(`   ↓ Passing to Mitigation Strategist`);

      state.currentAgent = 'mitigation-strategist';
      console.log(`\n🛡️  Agent 3: Mitigation Strategist`);
      const mitigationInput: MitigationStrategistInput = {
        regionId: region.regionId,
        regionName: region.regionName,
        riskScore: state.riskAnalysis.riskScore,
        riskReport: state.riskAnalysis.report
      };

      state.mitigationStrategy = await this.mitigationStrategist.execute(mitigationInput);
      state.communicationLog.push(...this.mitigationStrategist.getMessageHistory());
      
      console.log(`   ✓ Strategy: ${state.mitigationStrategy.actions.length} mitigation actions`);
      console.log(`   ✓ Expected risk reduction: ${state.mitigationStrategy.expectedRiskReduction}%`);
      console.log(`   ✓ Total cost: $${state.mitigationStrategy.totalEstimatedCost.toLocaleString()}`);

      state.endTime = new Date();
      state.status = 'completed';
      state.currentAgent = null;

      console.log('\n═'.repeat(60));
      console.log(`✅ Crew completed in ${state.endTime.getTime() - state.startTime.getTime()}ms`);
      console.log(`📝 Communication log: ${state.communicationLog.length} messages\n`);

      stateManager.emitEvent({
        type: 'crew_execution_completed',
        payload: {
          regionId,
          executionTimeMs: state.endTime.getTime() - state.startTime.getTime(),
          agentCount: 3
        }
      });

      return {
        regionId: state.regionId,
        regionName: state.regionName,
        dataQuality: state.dataAnalysis!.dataQuality,
        riskScore: state.riskAnalysis!.riskScore,
        riskReport: state.riskAnalysis!.report,
        mitigationStrategy: state.mitigationStrategy!,
        communicationLog: state.communicationLog,
        executionTimeMs: state.endTime.getTime() - state.startTime.getTime(),
        agentCount: 3,
        status: 'completed'
      };

    } catch (error) {
      state.status = 'failed';
      state.error = error instanceof Error ? error.message : 'Unknown error';
      state.endTime = new Date();
      
      console.error(`\n❌ Crew execution failed: ${state.error}\n`);
      
      throw error;
    }
  }

  getAgents() {
    return {
      dataAnalyst: this.dataAnalyst.getConfig(),
      insuranceAnalyst: this.insuranceAnalyst.getConfig ? this.insuranceAnalyst.getConfig() : null,
      mitigationStrategist: this.mitigationStrategist.getConfig()
    };
  }
}

export const crewOrchestrator = new CrewOrchestrator();
