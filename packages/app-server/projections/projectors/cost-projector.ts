import type {
    AllEvents,
    CostSummary,
    EventType,
    ModelUsage,
    TokenUsage,
    TurnCost,
} from "@omnia/contracts";
import type { Projector } from "./types";

export class CostProjector implements Projector<Map<string, CostSummary>> {
    state: Map<string, CostSummary> = new Map();

    apply(event: AllEvents<EventType>): void {
        switch (event.type) {
            case "cost.metered": {
                const summary = this.summaryFor(event.payload.sessionId);
                const turn = this.turnFor(summary, event.payload.turnId);

                if (event.payload.scope === "step") {
                    // usage accures live, but no cost yet
                    this.addUsage(turn.usage, event.payload.usage);
                    this.addUsage(summary.usage, event.payload.usage);
                    if (event.payload.requestId) {
                        turn.steps.push({
                            requestId: event.payload.requestId,
                            usage: { ...event.payload.usage },
                            costUsd: 0,
                        });
                    }
                } else {
                    // when scope = "turn"
                    turn.totalCostUsd = event.payload.totalCostUsd ?? 0;
                    summary.totalCostUsd += turn.totalCostUsd;
                    if (event.payload.modelUsage)
                        this.mergeModelUsage(summary.perModel, event.payload.modelUsage);
                    this.distributeCostByTokens(turn);
                }
            }
        }
    }

    private mergeModelUsage(into: Record<string, ModelUsage>, from: Record<string, ModelUsage>) {
        for (const [modelId, usage] of Object.entries(from)) {
            into[modelId] = {
                input_tokens: (into[modelId]?.input_tokens ?? 0) + usage.input_tokens,
                output_tokens: (into[modelId]?.output_tokens ?? 0) + usage.output_tokens,
                cache_read_input_tokens:
                    (into[modelId]?.cache_read_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0),
                cache_creation_input_tokens:
                    (into[modelId]?.cache_creation_input_tokens ?? 0) +
                    (usage.cache_creation_input_tokens ?? 0),
                costUsd: (into[modelId]?.costUsd ?? 0) + (usage.costUsd ?? 0),
            };
        }
    }

    private addUsage(into: TokenUsage, from: TokenUsage): void {
        into.input_tokens += from.input_tokens;
        into.output_tokens += from.output_tokens;
        into.cache_read_input_tokens += from.cache_read_input_tokens;
        into.cache_creation_input_tokens += from.cache_creation_input_tokens;
    }

    private summaryFor(sessionId: string): CostSummary {
        let summary = this.state.get(sessionId);
        if (!summary) {
            summary = {
                sessionId,
                usage: this.zeroUsage(),
                totalCostUsd: 0,
                perModel: {},
                perTurn: {},
            };
            this.state.set(sessionId, summary);
        }
        return summary;
    }

    private turnFor(summary: CostSummary, turnId: string): TurnCost {
        let turn = summary.perTurn[turnId];
        if (!turn) {
            turn = {
                turnId,
                totalCostUsd: 0,
                usage: this.zeroUsage(),
                steps: [],
            };
            summary.perTurn[turnId] = turn;
        }
        return turn;
    }

    // The SDK only reports the turn total, never per-step $. Estimate each step's
    // share with a price-weighted token score approximating Claude's relative rates
    // (output > cache-creation > input > cache-read). Not exact across mixed models,
    // but far better than raw token share. Last step absorbs the rounding remainder
    // so the steps sum exactly to turn.totalCostUsd.
    private distributeCostByTokens(turn: TurnCost): void {
        if (turn.steps.length === 0 || turn.totalCostUsd <= 0) return;

        const weightOf = (u: TokenUsage): number =>
            u.input_tokens * 1 +
            u.cache_creation_input_tokens * 1.25 +
            u.cache_read_input_tokens * 0.1 +
            u.output_tokens * 5;

        const weights = turn.steps.map((step) => weightOf(step.usage));
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        if (total <= 0) return;

        let allocated = 0;
        turn.steps.forEach((step, index) => {
            if (index === turn.steps.length - 1) {
                step.costUsd = turn.totalCostUsd - allocated;
            } else {
                step.costUsd = (turn.totalCostUsd * weights[index]!) / total;
                allocated += step.costUsd;
            }
        });
    }

    private zeroUsage(): TokenUsage {
        return {
            input_tokens: 0,
            output_tokens: 0,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
        };
    }

    replayAll(events: AllEvents<EventType>[]): void {
        this.state.clear();
        for (const event of events) {
            this.apply(event);
        }
    }
}
