import { BaseAgent, AgentConfig } from './base-agent';
import { RiskScore, RiskReport } from '../types/hazard';

export interface MitigationStrategistInput {
  regionId: string;
  regionName: string;
  riskScore: RiskScore;
  riskReport: RiskReport;
}

export interface MitigationAction {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'prevention' | 'preparedness' | 'mitigation' | 'insurance';
  title: string;
  description: string;
  estimatedCost: number;
  timeframe: string;
  expectedRiskReduction: number;
  stakeholders: string[];
}

export interface MitigationStrategistOutput {
  overallStrategy: string;
  actions: MitigationAction[];
  priorityOrder: string[];
  totalEstimatedCost: number;
  expectedRiskReduction: number;
  implementationTimeline: string;
  keyStakeholders: string[];
}

export const MITIGATION_STRATEGIST_CONFIG: AgentConfig = {
  id: 'mitigation-strategist',
  name: 'Mitigation Strategist',
  role: 'Wildfire Risk Mitigation Specialist',
  goal: 'Develop comprehensive mitigation strategies to reduce wildfire insurance risk and protect communities.',
  backstory: 'Strategic planner with 12+ years in wildfire risk mitigation, combining fire science, urban planning, and insurance expertise to design effective risk reduction programs.',
  model: 'gpt-4',
  temperature: 0.6
};

export class MitigationStrategistAgent extends BaseAgent {
  constructor(config: AgentConfig = MITIGATION_STRATEGIST_CONFIG) {
    super(config);
  }

  async execute(input: MitigationStrategistInput): Promise<MitigationStrategistOutput> {
    const reasoning = `Developing mitigation strategy for ${input.regionName} with risk score ${input.riskScore.overallScore}/100 (${input.riskScore.category}).`;
    
    const actions = await this.generateMitigationActions(input);
    const priorityOrder = actions
      .sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      })
      .map(a => a.title);

    const totalEstimatedCost = actions.reduce((sum, a) => sum + a.estimatedCost, 0);
    const expectedRiskReduction = Math.min(
      30,
      actions.reduce((sum, a) => sum + a.expectedRiskReduction, 0)
    );

    const overallStrategy = await this.generateOverallStrategy(input, actions);

    const output: MitigationStrategistOutput = {
      overallStrategy,
      actions,
      priorityOrder,
      totalEstimatedCost,
      expectedRiskReduction,
      implementationTimeline: this.calculateTimeline(actions),
      keyStakeholders: this.identifyStakeholders(actions)
    };

    this.logMessage(
      reasoning,
      'generate_mitigation_strategy',
      { regionId: input.regionId, riskScore: input.riskScore.overallScore },
      { actionCount: actions.length, expectedReduction: expectedRiskReduction },
      null
    );

    return output;
  }

  private async generateMitigationActions(input: MitigationStrategistInput): Promise<MitigationAction[]> {
    const actions: MitigationAction[] = [];
    const riskScore = input.riskScore.overallScore;

    if (input.riskScore.components.wildfireExposure > 60) {
      actions.push({
        priority: 'critical',
        category: 'prevention',
        title: 'Establish Wildfire Fuel Management Program',
        description: 'Implement controlled burns and vegetation management in high-risk zones to reduce fuel load.',
        estimatedCost: 500000,
        timeframe: '6-12 months',
        expectedRiskReduction: 12,
        stakeholders: ['Municipal Fire Department', 'BC Wildfire Service', 'Property Owners']
      });
    }

    if (input.riskScore.components.vulnerabilityIndex > 50) {
      actions.push({
        priority: 'high',
        category: 'preparedness',
        title: 'Enhance Community FireSmart Program',
        description: 'Expand FireSmart initiatives including home hardening, defensible space creation, and community education.',
        estimatedCost: 250000,
        timeframe: '3-6 months',
        expectedRiskReduction: 8,
        stakeholders: ['Homeowners', 'Insurance Providers', 'FireSmart Canada']
      });
    }

    if (riskScore > 70) {
      actions.push({
        priority: 'critical',
        category: 'insurance',
        title: 'Develop Wildfire Insurance Incentive Program',
        description: 'Create premium discounts for properties meeting FireSmart standards and mitigation requirements.',
        estimatedCost: 100000,
        timeframe: '2-4 months',
        expectedRiskReduction: 5,
        stakeholders: ['Insurance Bureau of Canada', 'Local Insurers', 'Municipal Government']
      });
    }

    if (input.riskScore.components.climateProjection > 40) {
      actions.push({
        priority: 'high',
        category: 'mitigation',
        title: 'Install Early Warning and Detection Systems',
        description: 'Deploy advanced wildfire detection cameras, weather stations, and emergency alert systems.',
        estimatedCost: 350000,
        timeframe: '4-8 months',
        expectedRiskReduction: 7,
        stakeholders: ['Municipal Emergency Services', 'BC Wildfire Service', 'Technology Providers']
      });
    }

    actions.push({
      priority: 'medium',
      category: 'preparedness',
      title: 'Develop Evacuation and Emergency Response Plans',
      description: 'Create detailed evacuation routes, emergency shelters, and communication protocols for wildfire events.',
      estimatedCost: 75000,
      timeframe: '2-3 months',
      expectedRiskReduction: 4,
      stakeholders: ['Emergency Management BC', 'RCMP', 'Local Emergency Services']
    });

    if (this.llm) {
      try {
        const additionalActions = await this.generateLLMActions(input);
        actions.push(...additionalActions);
      } catch (error) {
        console.warn('LLM action generation failed, using rule-based actions only');
      }
    }

    return actions.slice(0, 8);
  }

  private async generateLLMActions(input: MitigationStrategistInput): Promise<MitigationAction[]> {
    const prompt = `Analyze wildfire risk for ${input.regionName}:
- Overall Risk Score: ${input.riskScore.overallScore}/100 (${input.riskScore.category})
- Wildfire Exposure: ${input.riskScore.components.wildfireExposure}/100
- Vulnerability: ${input.riskScore.components.vulnerabilityIndex}/100
- Climate Projection: ${input.riskScore.components.climateProjection}/100

Suggest 2 specific, actionable mitigation strategies unique to this risk profile. For each, provide:
1. Title (brief)
2. Description (1-2 sentences)
3. Priority (critical/high/medium/low)
4. Category (prevention/preparedness/mitigation/insurance)
5. Estimated cost in CAD
6. Timeframe
7. Expected risk reduction (%)

Format as JSON array.`;

    const response = await this.callLLM(
      `You are a wildfire mitigation expert. Provide practical, cost-effective strategies tailored to the risk profile.`,
      prompt
    );

    try {
      const parsed = JSON.parse(response);
      return parsed.slice(0, 2).map((item: any) => ({
        priority: item.priority || 'medium',
        category: item.category || 'mitigation',
        title: item.title,
        description: item.description,
        estimatedCost: item.estimatedCost || 150000,
        timeframe: item.timeframe || '3-6 months',
        expectedRiskReduction: item.expectedRiskReduction || 5,
        stakeholders: item.stakeholders || ['Municipal Government']
      }));
    } catch {
      return [];
    }
  }

  private async generateOverallStrategy(input: MitigationStrategistInput, actions: MitigationAction[]): Promise<string> {
    if (this.llm) {
      try {
        const prompt = `Create a concise overall strategy summary (2-3 sentences) for ${input.regionName} with risk score ${input.riskScore.overallScore}/100. We have ${actions.length} mitigation actions planned. Focus on the strategic approach and expected outcomes.`;
        
        return await this.callLLM(
          'You are a strategic communicator. Write clear, confident summaries.',
          prompt
        );
      } catch (error) {
        console.warn('LLM strategy generation failed');
      }
    }

    return `Comprehensive risk mitigation strategy for ${input.regionName} targeting ${input.riskScore.category} risk level. Implements ${actions.length} coordinated actions across prevention, preparedness, and mitigation to reduce risk by up to ${actions.reduce((sum, a) => sum + a.expectedRiskReduction, 0)}% over the next 12-18 months.`;
  }

  private calculateTimeline(actions: MitigationAction[]): string {
    const hasImmediate = actions.some(a => a.timeframe.includes('2-3'));
    const hasMedium = actions.some(a => a.timeframe.includes('6-12'));
    const hasLong = actions.some(a => a.timeframe.includes('12-24'));

    if (hasLong) return '12-24 months';
    if (hasMedium) return '6-12 months';
    if (hasImmediate) return '2-6 months';
    return '3-6 months';
  }

  private identifyStakeholders(actions: MitigationAction[]): string[] {
    const stakeholders = new Set<string>();
    actions.forEach(a => a.stakeholders.forEach(s => stakeholders.add(s)));
    return Array.from(stakeholders).slice(0, 10);
  }
}
