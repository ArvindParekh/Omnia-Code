import { ChatTeardropText, Moon, PlusCircle, SidebarSimple, Sun } from "@phosphor-icons/react";
import { useEffect } from "react";
import { providerLabel } from "../lib/provider";
import { timeAgo } from "../lib/time";
import type { Session } from "../lib/types";
import {
	CommandDialog,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "./ui/command";

type CommandPaletteProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessions: Session[];
	onSelectSession: (id: string | null) => void;
	onToggleInspector: () => void;
	onToggleTheme: () => void;
	isDark: boolean;
};

export function CommandPalette({
	open,
	onOpenChange,
	sessions,
	onSelectSession,
	onToggleInspector,
	onToggleTheme,
	isDark,
}: CommandPaletteProps) {
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				onOpenChange(!open);
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open, onOpenChange]);

	const run = (action: () => void) => {
		action();
		onOpenChange(false);
	};

	return (
		<CommandDialog open={open} onOpenChange={onOpenChange}>
			<Command>
				<CommandInput placeholder="Search sessions or run a command..." />
				<CommandList>
					<CommandEmpty>No results</CommandEmpty>

					<CommandGroup heading="Actions">
						<CommandItem
							value="new chat create session start"
							onSelect={() => run(() => onSelectSession(null))}
						>
							<PlusCircle size={13} weight="light" />
							New chat
						</CommandItem>
						<CommandItem
							value="toggle inspector panel sidebar activity summary"
							onSelect={() => run(onToggleInspector)}
						>
							<SidebarSimple size={13} weight="light" />
							Toggle inspector
						</CommandItem>
						<CommandItem
							value="switch theme appearance dark light mode"
							onSelect={() => run(onToggleTheme)}
						>
							{isDark ? <Sun size={13} weight="light" /> : <Moon size={13} weight="light" />}
							Switch to {isDark ? "light" : "dark"} mode
						</CommandItem>
					</CommandGroup>

					{sessions.length > 0 && (
						<CommandGroup heading="Sessions">
							{sessions.map((session) => (
								<CommandItem
									key={session.id}
									value={`${session.title} ${session.id}`}
									onSelect={() => run(() => onSelectSession(session.id))}
								>
									<ChatTeardropText size={13} weight="light" />
									<span className="min-w-0 truncate">{session.title}</span>
									<CommandShortcut>
										{providerLabel(session.provider)} · {timeAgo(session.updatedAt)}
									</CommandShortcut>
								</CommandItem>
							))}
						</CommandGroup>
					)}
				</CommandList>
			</Command>
		</CommandDialog>
	);
}
