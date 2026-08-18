export interface TokenUsage {
	input_tokens: number;
	output_tokens: number;
	cache_read_input_tokens: number;
	cache_creation_input_tokens: number;
}

export interface ModelUsage extends TokenUsage {
	costUsd: number; // per-model $, from result.modelUsage field
}

export interface CostSummary {
	sessionId: string;
	totalCostUsd: number;
	usage: TokenUsage; // summed
	perModel: Record<string, ModelUsage>; // modelId -> ModelUsage
	perTurn: Record<string, TurnCost>; // turnId -> TurnCost
}

export interface TurnCost {
	turnId: string;
	totalCostUsd: number;
	usage: TokenUsage;
	steps: StepCost[];
}

export interface StepCost {
	requestId: string;
	usage: TokenUsage;
	costUsd: number; // derive from ModelUsage, or keep it 0 until turn result lands
}
