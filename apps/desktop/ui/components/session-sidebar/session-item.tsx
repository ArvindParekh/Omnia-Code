import { DotsThree, PencilSimple, Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { providerLabel } from "../../lib/provider";
import { ProviderIcon } from "../provider-icon";
import { timeAgo } from "../../lib/time";
import type { Session } from "../../lib/types";
import { cn } from "../../lib/utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

function StatusDot({ status }: { status: Session["status"] }) {
	if (status === "running") {
		return <span className="w-[5px] h-[5px] rounded-full bg-white/35 shrink-0 status-running" />;
	}
	if (status === "error") {
		return <span className="w-[5px] h-[5px] rounded-full bg-red-400/55 shrink-0" />;
	}
	return <span className="w-[5px] h-[5px] rounded-full bg-transparent shrink-0" />;
}

function RenameInput({
	initialValue,
	onCommit,
	onCancel,
}: {
	initialValue: string;
	onCommit: (title: string) => void;
	onCancel: () => void;
}) {
	const [value, setValue] = useState(initialValue);
	const inputRef = useRef<HTMLInputElement>(null);
	const committed = useRef(false);

	useEffect(() => {
		inputRef.current?.select();
	}, []);

	const commit = () => {
		if (committed.current) return;
		committed.current = true;

		const next = value.trim();
		if (next && next !== initialValue) onCommit(next);
		else onCancel();
	};

	return (
		<input
			ref={inputRef}
			value={value}
			onChange={(event) => setValue(event.target.value)}
			onBlur={commit}
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					commit();
				} else if (event.key === "Escape") {
					event.preventDefault();
					committed.current = true;
					onCancel();
				}
			}}
			className="w-full bg-white/[6%] rounded-sm px-1.5 py-0.5 text-[12px] font-medium text-white/85 outline-none border border-white/[12%] select-text"
		/>
	);
}

export function SessionItem({
	session,
	isActive,
	onClick,
	onRename,
	onDelete,
	indented,
}: {
	session: Session;
	isActive: boolean;
	onClick: () => void;
	onRename: (title: string) => void;
	onDelete: () => void;
	indented: boolean;
}) {
	const [renaming, setRenaming] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const label = providerLabel(session.provider);

	if (renaming) {
		return (
			<div className="px-2.5 py-0.5 my-0.5">
				<RenameInput
					initialValue={session.title}
					onCommit={(title) => {
						setRenaming(false);
						onRename(title);
					}}
					onCancel={() => setRenaming(false)}
				/>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"relative rounded-sm my-0.5 transition-colors group",
				isActive ? "bg-white/[7%]" : "hover:bg-white/[4%]",
			)}
		>
			<button
				type="button"
				onClick={onClick}
				className={cn("w-full text-left px-2.5 py-0.5", indented && "text-[11px]")}
			>
				<div className="flex items-center gap-1.5 min-w-0">
					<StatusDot status={session.status} />
					<span
						title={session.title}
						className={cn(
							"truncate min-w-0 leading-[1.4] transition-colors font-medium",
							indented ? "text-[11px]" : "text-[12px]",
							isActive ? "text-white/85" : "text-white/50 group-hover:text-white/70",
						)}
					>
						{session.title}
					</span>
					<span
						className={cn(
							"ml-auto text-[9px] text-white/18 shrink-0 tabular-nums transition-opacity",
							"group-hover:opacity-0",
							menuOpen && "opacity-0",
						)}
					>
						{timeAgo(session.updatedAt)}
					</span>
				</div>
				{!indented && (
					<div className="flex items-center gap-1 mt-0.5 pl-[13px]">
						<ProviderIcon provider={session.provider} size={10} />
						<span className="text-[10px] text-white/22 truncate">{label}</span>
					</div>
				)}
			</button>

			<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						aria-label="Session options"
						className={cn(
							"absolute right-1.5 top-1 p-0.5 rounded transition-opacity",
							"text-white/30 hover:text-white/70 hover:bg-white/[8%]",
							menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
						)}
					>
						<DotsThree size={14} weight="bold" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-[150px]">
					<DropdownMenuItem onSelect={() => setRenaming(true)}>
						<PencilSimple size={12} weight="light" />
						Rename
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem variant="destructive" onSelect={() => setConfirmingDelete(true)}>
						<Trash size={12} weight="light" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete chat?</AlertDialogTitle>
						<AlertDialogDescription>
							<span className="text-white/70">{session.title}</span> and its full history will be
							permanently deleted. This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={onDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
