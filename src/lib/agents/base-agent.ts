import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  model?: string;
  temperature?: number;
}

export interface AgentMessage {
  agentId: string;
  agentName: string;
  timestamp: Date;
  reasoning: string;
  action: string;
  input: any;
  output: any;
  nextAgent: string | null;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected llm: ChatOpenAI | null = null;
  protected messageHistory: AgentMessage[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
    
    if (process.env.OPENAI_API_KEY) {
      this.llm = new ChatOpenAI({
        modelName: config.model || 'gpt-4',
        temperature: config.temperature || 0.7,
        openAIApiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  protected async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.llm) {
      throw new Error('LLM not configured. Set OPENAI_API_KEY environment variable.');
    }

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ];

    const response = await this.llm.invoke(messages);
    return response.content as string;
  }

  protected logMessage(reasoning: string, action: string, input: any, output: any, nextAgent: string | null): AgentMessage {
    const message: AgentMessage = {
      agentId: this.config.id,
      agentName: this.config.name,
      timestamp: new Date(),
      reasoning,
      action,
      input,
      output,
      nextAgent
    };
    this.messageHistory.push(message);
    return message;
  }

  getMessageHistory(): AgentMessage[] {
    return this.messageHistory;
  }

  getConfig(): AgentConfig {
    return this.config;
  }

  abstract execute(input: any): Promise<any>;
}
