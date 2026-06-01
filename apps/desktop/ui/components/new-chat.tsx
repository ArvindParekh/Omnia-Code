import { useRef, useState } from "react";
import { ArrowUp, FolderSimple, Lightning, Bug, GitBranch, Sparkle } from "@phosphor-icons/react";
import type { MockSession, Provider } from "../lib/types";
import { providerLabel } from "../lib/provider";
import { cn } from "../lib/utils";

const PROVIDERS: Provider[] = ["claude", "gemini", "codex", "opencode", "fake"];

const SUGGESTIONS = [
	{ icon: Bug, label: "Debug an issue in the codebase" },
	{ icon: GitBranch, label: "Review a pull request" },
	{ icon: Lightning, label: "Refactor a module for better maintainability" },
	{ icon: Sparkle, label: "Write tests for a new feature" },
];

type NewChatProps = {
	onStart: (text: string, provider: Provider, workspacePath: string) => void;
	recentSessions: MockSession[];
};

export function NewChat({ onStart, recentSessions }: NewChatProps) {
	const [text, setText] = useState("");
	const [provider, setProvider] = useState<Provider>("claude");
	const [workspace, setWorkspace] = useState("~/projects/webapp");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSubmit = () => {
		const trimmed = text.trim();
		if (!trimmed) return;
		onStart(trimmed, provider, workspace);
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

	const workspaces = Array.from(new Set(recentSessions.map((s) => s.workspacePath)));

	return (
		<div className="flex-1 border-l border-l-white/10 rounded-l-lg flex flex-col items-center justify-center px-6 overflow-y-auto">
			<div className="w-full max-w-[640px] flex flex-col gap-5">
				{/* Heading */}
				<div className="text-center mb-2">
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
							className="w-full bg-transparent text-[14px] text-white/80 placeholder:text-white/25 resize-none outline-none leading-[1.6] select-text"
						/>
					</div>

					{/* Action bar */}
					<div className="flex items-center gap-2 px-3.5 pb-3 pt-1">
						{/* Provider picker */}
						<div className="flex items-center gap-1">
							{PROVIDERS.map((p) => (
								<button
									key={p}
									onClick={() => setProvider(p)}
									className={cn(
										"px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors",
										provider === p
											? "bg-white/[10%] text-white/75"
											: "text-white/30 hover:text-white/50 hover:bg-white/[5%]",
									)}
								>
									{providerLabel(p)}
								</button>
							))}
						</div>

						{/* Workspace picker */}
						<div className="ml-auto flex items-center gap-1.5 text-white/30 hover:text-white/50 transition-colors cursor-pointer">
							<FolderSimple size={13} weight="light" />
							<span className="text-[11px]">{workspace.replace(/^.*\//, "")}</span>
						</div>

						{/* Send button */}
						<button
							onClick={handleSubmit}
							disabled={!text.trim()}
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
						<span className="text-[11px] text-white/25">Project:</span>
						{workspaces.map((ws) => (
							<button
								key={ws}
								onClick={() => setWorkspace(ws)}
								className={cn(
									"flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-colors border",
									workspace === ws
										? "border-white/[14%] bg-white/[5%] text-white/65"
										: "border-white/[7%] text-white/30 hover:text-white/50 hover:bg-white/[3%]",
								)}
							>
								<FolderSimple size={11} weight="light" />
								{ws.replace(/^.*\//, "")}
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
							<span className="text-[13px]">{label}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
