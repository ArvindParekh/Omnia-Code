import { useEffect, useRef, useState } from "react";
import { ArrowUp, FolderSimple, Lightning, Bug, GitBranch, Sparkle } from "@phosphor-icons/react";
import type { EffortLevel, Provider } from "../lib/types";
import { useProviderModels } from "../hooks/use-provider-models";
import { usePreferences } from "../hooks/use-preferences";
import { ModelPicker } from "./model-picker";
import { ProviderIcon } from "./provider-icon";
import { providerLabel } from "../lib/provider";
import { workspaceName } from "../lib/workspace";
import { cn } from "../lib/utils";
import { ipcInvoke } from "../hooks/use-ipc";

const SUGGESTIONS = [
	{ icon: Bug, label: "Debug an issue in the codebase" },
	{ icon: GitBranch, label: "Review a pull request" },
	{ icon: Lightning, label: "Refactor a module for better maintainability" },
	{ icon: Sparkle, label: "Write tests for a new feature" },
];

type NewChatProps = {
	onStart: (
		text: string,
		provider: Provider,
		workspacePath: string,
		selection: { modelId: string | null; effort: EffortLevel | null },
	) => void;
	providers: Provider[];
};

export function NewChat({ onStart, providers }: NewChatProps) {
	const [text, setText] = useState("");
	const [provider, setProvider] = useState<Provider>(providers[0] ?? "claude");
	const { preferences } = usePreferences();
	const [workspace, setWorkspace] = useState<string | null>(null);
	const [modelId, setModelId] = useState<string | null>(null);
	const [effort, setEffort] = useState<EffortLevel | null>(null);
	const { models, selectionSupported } = useProviderModels(provider);

	// When the detected provider list resolves and the current selection is no
	// longer in it, reset to the first available provider.
	useEffect(() => {
		if (providers.length > 0 && !providers.includes(provider)) {
			setProvider(providers[0]);
		}
	}, [providers]); // provider intentionally omitted — only reset when the list itself changes

	useEffect(() => {
		setModelId(null);
		setEffort(null);
	}, [provider]);

	// Seed from the most recent workspace once preferences arrive, but never
	// clobber a directory the user has already picked in this session.
	useEffect(() => {
		setWorkspace((current) => current ?? preferences.recentWorkspaces[0] ?? null);
	}, [preferences.recentWorkspaces]);

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const pickWorkspace = async () => {
		const picked = await ipcInvoke("app:pickWorkspace", {});
		if (picked) setWorkspace(picked);
	};

	const handleSubmit = () => {
		const trimmed = text.trim();
		if (!trimmed || !workspace) return;
		onStart(trimmed, provider, workspace, { modelId, effort });
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setText(e.target.value);
		const el = e.target;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
	};

	const workspaces = preferences.recentWorkspaces;

	return (
		<div className="flex-1 border-l border-l-white/10 rounded-l-lg flex flex-col items-center justify-center px-6 overflow-y-auto">
			<div className="w-full max-w-[640px] flex flex-col gap-5">
				{/* Heading */}
				<div className="mb-2 flex flex-col items-center gap-3">
					<ProviderIcon provider={provider} size={30} />
					<h1 className="text-2xl font-medium text-white/85">What should we work on?</h1>
				</div>

				{/* Composer card */}
				<div className="rounded-2xl border border-white/[10%] bg-white/[3%] overflow-hidden focus-within:border-white/[18%] transition-colors">
					{/* Textarea */}
					<div className="px-4 pt-3.5 pb-2">
						<textarea
							ref={textareaRef}
							value={text}
							onChange={handleInput}
							onKeyDown={handleKeyDown}
							placeholder={`Ask ${providerLabel(provider)} anything...`}
							rows={3}
							className="w-full bg-transparent text-[13px] text-white/80 placeholder:text-white/25 resize-none outline-none leading-[1.6] select-text"
						/>
					</div>

					{/* Action bar */}
					<div className="flex items-center gap-2 px-3.5 pb-3 pt-1">
						{/* Provider */}
						{providers.length > 1 ? (
							<div className="flex items-center gap-1">
								{providers.map((p) => (
									<button
										key={p}
										onClick={() => setProvider(p)}
										className={cn(
											"flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
											provider === p
												? "bg-white/[10%] text-white/75"
												: "text-white/30 hover:bg-white/[5%] hover:text-white/50",
										)}
									>
										<ProviderIcon provider={p} size={12} muted={provider !== p} />
										{providerLabel(p)}
									</button>
								))}
							</div>
						) : (
							<div className="flex items-center gap-1.5 px-1 py-1 text-[10px] font-medium text-white/45">
								<ProviderIcon provider={provider} size={12} />
								{providerLabel(provider)}
							</div>
						)}

						{selectionSupported && (
							<ModelPicker
								models={models}
								modelId={modelId}
								effort={effort}
								onModelChange={setModelId}
								onEffortChange={setEffort}
								side="bottom"
							/>
						)}

						{/* Workspace picker */}
						<button
							type="button"
							onClick={pickWorkspace}
							title={workspace ?? "Choose a folder for this chat"}
							className="ml-auto flex items-center gap-1.5 text-white/30 hover:text-white/50 transition-colors"
						>
							<FolderSimple size={13} weight="light" />
							<span className="text-[10px]">
								{workspace ? workspaceName(workspace) : "Choose folder"}
							</span>
						</button>

						{/* Send button */}
						<button
							onClick={handleSubmit}
							disabled={!text.trim() || !workspace}
							className="ml-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center
								disabled:opacity-20 disabled:cursor-not-allowed
								hover:opacity-85 transition-all shrink-0"
						>
							<ArrowUp size={14} weight="bold" className="text-primary-foreground" />
						</button>
					</div>
				</div>

				{/* Workspace selector pills */}
				{workspaces.length > 1 && (
					<div className="flex items-center gap-2 flex-wrap px-1">
						<span className="text-[10px] text-white/25">Project:</span>
						{workspaces.map((ws) => (
							<button
								key={ws}
								onClick={() => setWorkspace(ws)}
								className={cn(
									"flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] transition-colors border",
									workspace === ws
										? "border-white/[14%] bg-white/[5%] text-white/65"
										: "border-white/[7%] text-white/30 hover:text-white/50 hover:bg-white/[3%]",
								)}
							>
								<FolderSimple size={11} weight="light" />
								{workspaceName(ws)}
							</button>
						))}
					</div>
				)}

				{/* Suggestions */}
				<div className="flex flex-col gap-px">
					{SUGGESTIONS.map(({ icon: Icon, label }, index) => (
						<button
							key={label}
							onClick={() => {
								setText(label);
								textareaRef.current?.focus();
							}}
							className={cn(
								"flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/35",
								index !== SUGGESTIONS.length - 1 ? "border-b" : "",
								"hover:text-white/60 hover:bg-white/[3%] transition-colors text-left w-full group",
							)}
						>
							<Icon
								size={14}
								weight="light"
								className="text-white/22 shrink-0 group-hover:text-white/40 transition-colors"
							/>
							<span className="text-[12px]">{label}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
