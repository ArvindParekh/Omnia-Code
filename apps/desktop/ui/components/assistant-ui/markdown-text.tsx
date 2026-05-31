import {
	MarkdownTextPrimitive,
	type CodeHeaderProps,
	unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
	useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import { memo, useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { cn } from "../../lib/utils";

// ─── Code header (language label + copy button) ────────────────────────────────

function CodeHeader({ language, code }: CodeHeaderProps) {
	const [copied, setCopied] = useState(false);

	const onCopy = () => {
		if (!code || copied) return;
		navigator.clipboard.writeText(code).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	return (
		<div className="flex items-center justify-between px-4 py-2 rounded-t-lg border border-b-0 border-white/[8%] bg-white/[3%]">
			<span className="text-[11px] font-mono text-white/35 lowercase">{language ?? "code"}</span>
			<button
				onClick={onCopy}
				className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/55 transition-colors"
			>
				{copied ? <Check size={11} weight="bold" /> : <Copy size={11} weight="regular" />}
				{copied ? "Copied" : "Copy"}
			</button>
		</div>
	);
}

// ─── Inline code ──────────────────────────────────────────────────────────────

function InlineCode({ className, ...props }: React.ComponentPropsWithoutRef<"code">) {
	const isCodeBlock = useIsMarkdownCodeBlock();
	if (isCodeBlock) return <code className={className} {...props} />;
	return (
		<code
			className={cn(
				"rounded-md border border-white/[8%] bg-white/[5%] px-1.5 py-0.5 font-mono text-[0.85em] text-white/70",
				className,
			)}
			{...props}
		/>
	);
}

// ─── Styled markdown components ───────────────────────────────────────────────

const components = memoizeMarkdownComponents({
	CodeHeader,
	code: InlineCode,

	h1: ({ className, ...p }) => (
		<h1
			className={cn("mb-3 mt-5 text-[15px] font-semibold text-white/88 first:mt-0", className)}
			{...p}
		/>
	),
	h2: ({ className, ...p }) => (
		<h2
			className={cn("mb-2 mt-4 text-[14px] font-semibold text-white/85 first:mt-0", className)}
			{...p}
		/>
	),
	h3: ({ className, ...p }) => (
		<h3
			className={cn("mb-1.5 mt-3 text-[13px] font-semibold text-white/82 first:mt-0", className)}
			{...p}
		/>
	),
	p: ({ className, ...p }) => (
		<p
			className={cn("mb-3 text-[13px] leading-[1.65] text-white/75 last:mb-0", className)}
			{...p}
		/>
	),
	ul: ({ className, ...p }) => (
		<ul
			className={cn(
				"mb-3 list-disc pl-5 text-[13px] text-white/75 last:mb-0 [&>li]:mt-1",
				className,
			)}
			{...p}
		/>
	),
	ol: ({ className, ...p }) => (
		<ol
			className={cn(
				"mb-3 list-decimal pl-5 text-[13px] text-white/75 last:mb-0 [&>li]:mt-1",
				className,
			)}
			{...p}
		/>
	),
	li: ({ className, ...p }) => <li className={cn("leading-[1.65]", className)} {...p} />,
	blockquote: ({ className, ...p }) => (
		<blockquote
			className={cn(
				"mb-3 border-l-2 border-white/20 pl-4 text-[13px] text-white/45 italic last:mb-0",
				className,
			)}
			{...p}
		/>
	),
	a: ({ className, ...p }) => (
		<a
			className={cn(
				"text-blue-400/80 underline decoration-blue-400/40 hover:text-blue-400 transition-colors",
				className,
			)}
			{...p}
		/>
	),
	pre: ({ className, ...p }) => (
		<pre
			className={cn(
				"mb-3 overflow-x-auto rounded-b-lg border border-white/[8%] bg-white/[2%] p-4 font-mono text-[12px] last:mb-0",
				className,
			)}
			{...p}
		/>
	),
	table: ({ className, ...p }) => (
		<div className="mb-3 overflow-x-auto last:mb-0">
			<table className={cn("w-full text-[13px] border-collapse", className)} {...p} />
		</div>
	),
	th: ({ className, ...p }) => (
		<th
			className={cn(
				"border border-white/[10%] bg-white/[4%] px-3 py-2 text-left font-medium text-white/70",
				className,
			)}
			{...p}
		/>
	),
	td: ({ className, ...p }) => (
		<td className={cn("border border-white/[8%] px-3 py-2 text-white/65", className)} {...p} />
	),
	hr: ({ className, ...p }) => <hr className={cn("my-4 border-white/[10%]", className)} {...p} />,
	strong: ({ className, ...p }) => (
		<strong className={cn("font-semibold text-white/85", className)} {...p} />
	),
	em: ({ className, ...p }) => <em className={cn("text-white/72", className)} {...p} />,
});

// ─── Export ───────────────────────────────────────────────────────────────────

const MarkdownTextImpl = () => (
	<MarkdownTextPrimitive remarkPlugins={[remarkGfm]} className="aui-md" components={components} />
);

export const MarkdownText = memo(MarkdownTextImpl);
