import type { CommandEnvelopeFor, CommandType } from "@omnia/contracts";

export type CommandHandler<T extends CommandType> = (
	envelope: CommandEnvelopeFor<T>,
) => Promise<void> | void;

export type Middleware<T extends CommandType> = (
	envelope: CommandEnvelopeFor<T>,
	next: () => Promise<void>,
) => Promise<void>;

export class CommandRouter {
	private handlers = new Map<CommandType, CommandHandler<CommandType>>();
	private middlewares: Middleware<CommandType>[] = [];

	use(middleware: Middleware<CommandType>): this {
		this.middlewares.push(middleware);
		return this;
	}

	on<T extends CommandType>(type: T, handler: CommandHandler<T>): this {
		if (this.handlers.has(type)) {
			throw new Error(`Handler for command type "${type}" is already registered`);
		}

		this.handlers.set(type, handler as CommandHandler<CommandType>);
		return this;
	}

	async dispatch(envelope: CommandEnvelopeFor<CommandType>): Promise<void> {
		const handler = this.handlers.get(envelope.type);
		if (!handler) {
			throw new Error(`No handler for command type "${envelope.type}"`);
		}

		// build middleware chain (similar to Koa's compose)
		const chain = this.middlewares.reduceRight<() => Promise<void>>(
			(next, mw) => () => mw(envelope, next),
			() => Promise.resolve(handler(envelope)),
		);

		await chain();
	}

	// for dubugging purposes
	registeredTypes(): CommandType[] {
		return [...this.handlers.keys()];
	}
}
