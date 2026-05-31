import type { Provider, ProviderAvailability } from "@omnia/contracts";
import type { ProviderAdapter } from "./types";

export class ProviderRegistry {
	private adapters: Map<Provider, ProviderAdapter> = new Map();

	register(adapter: ProviderAdapter): this {
		this.adapters.set(adapter.provider, adapter);
		return this;
	}

	get(provider: Provider): ProviderAdapter {
		const adapter = this.adapters.get(provider);
		if (!adapter) throw new Error(`Provider ${provider} not found`);
		return adapter;
	}

	has(provider: Provider): boolean {
		return this.adapters.has(provider);
	}

	async detectAll(): Promise<ProviderAvailability[]> {
		return Promise.all([...this.adapters.values()].map((a) => a.detect()));
	}

	async detectAvailable(): Promise<ProviderAvailability[]> {
		const results = await this.detectAll();
		return results.filter((r) => r.status === "available");
	}
}
