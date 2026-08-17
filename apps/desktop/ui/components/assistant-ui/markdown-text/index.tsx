import {
	MarkdownTextPrimitive,
	unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import { memo, type ComponentPropsWithoutRef } from "react";
import { cn } from "../../../lib/utils";
import { CodeBlock } from "./code-block";
import { CodeHeader } from "./code-header";
import { InlineCode } from "./inline-code";

const components = memoizeMarkdownComponents({
	CodeHeader,
	code: InlineCode,
	pre: CodeBlock,

	h1: ({ className, ...p }: ComponentPropsWithoutRef<"h1">) => (
		<h1
			className={cn(
				"mt-6 mb-3 text-[14px] font-semibold tracking-[-0.011em] text-balance text-white/86 first:mt-0",
				className,
			)}
			{...p}
		/>
	),
	h2: ({ className, ...p }: ComponentPropsWithoutRef<"h2">) => (
		<h2
			className={cn(
				"mt-5 mb-2 text-[13px] font-semibold tracking-[-0.008em] text-balance text-white/84 first:mt-0",
				className,
			)}
			{...p}
		/>
	),
	h3: ({ className, ...p }: ComponentPropsWithoutRef<"h3">) => (
		<h3
			className={cn(
				"mt-4 mb-1.5 text-[12px] font-semibold tracking-[-0.006em] text-balance text-white/80 first:mt-0",
				className,
			)}
			{...p}
		/>
	),
	p: ({ className, ...p }: ComponentPropsWithoutRef<"p">) => (
		<p
			className={cn(
				"mb-3.5 max-w-[68ch] text-[12px] leading-[1.75] text-pretty break-words text-white/72 last:mb-0",
				className,
			)}
			{...p}
		/>
	),
	ul: ({ className, ...p }: ComponentPropsWithoutRef<"ul">) => (
		<ul
			className={cn(
				"mb-3.5 max-w-[68ch] list-disc pl-5 text-[12px] text-white/72 marker:text-white/25 last:mb-0 [&>li]:mt-1.5 [&_ul]:mb-0 [&_ul]:mt-1.5 [&_ol]:mb-0 [&_ol]:mt-1.5",
				className,
			)}
			{...p}
		/>
	),
	ol: ({ className, ...p }: ComponentPropsWithoutRef<"ol">) => (
		<ol
			className={cn(
				"mb-3.5 max-w-[68ch] list-decimal pl-5 text-[12px] text-white/72 marker:text-white/25 marker:tabular-nums last:mb-0 [&>li]:mt-1.5 [&_ul]:mb-0 [&_ul]:mt-1.5 [&_ol]:mb-0 [&_ol]:mt-1.5",
				className,
			)}
			{...p}
		/>
	),
	li: ({ className, ...p }: ComponentPropsWithoutRef<"li">) => (
		<li className={cn("leading-[1.75] break-words", className)} {...p} />
	),
	blockquote: ({ className, ...p }: ComponentPropsWithoutRef<"blockquote">) => (
		<blockquote
			className={cn(
				"mb-3.5 max-w-[68ch] rounded-r border-l-2 border-white/[14%] bg-white/[2.5%] py-2 pr-3 pl-3.5 text-[12px] leading-[1.7] text-white/55 last:mb-0",
				className,
			)}
			{...p}
		/>
	),
	a: ({ className, ...p }: ComponentPropsWithoutRef<"a">) => (
		<a
			className={cn(
				"font-medium text-white/85 underline decoration-white/25 underline-offset-[3px] transition-colors hover:decoration-white/60",
				className,
			)}
			{...p}
		/>
	),
	table: ({ className, ...p }: ComponentPropsWithoutRef<"table">) => (
		<div className="mb-3.5 overflow-x-auto rounded-lg border border-white/[8%] last:mb-0">
			<table className={cn("w-full border-collapse text-[12px]", className)} {...p} />
		</div>
	),
	th: ({ className, ...p }: ComponentPropsWithoutRef<"th">) => (
		<th
			className={cn(
				"border-b border-white/[8%] bg-white/[3%] px-3 py-1.5 text-left font-medium text-white/65",
				className,
			)}
			{...p}
		/>
	),
	td: ({ className, ...p }: ComponentPropsWithoutRef<"td">) => (
		<td
			className={cn(
				"border-b border-white/[5%] px-3 py-1.5 align-top text-white/62 last:border-b-0",
				className,
			)}
			{...p}
		/>
	),
	hr: ({ className, ...p }: ComponentPropsWithoutRef<"hr">) => (
		<hr className={cn("my-6 border-white/[7%]", className)} {...p} />
	),
	strong: ({ className, ...p }: ComponentPropsWithoutRef<"strong">) => (
		<strong className={cn("font-semibold text-white/88", className)} {...p} />
	),
	em: ({ className, ...p }: ComponentPropsWithoutRef<"em">) => (
		<em className={cn("italic text-white/70", className)} {...p} />
	),
});

const MarkdownTextImpl = () => (
	<MarkdownTextPrimitive
		remarkPlugins={[remarkGfm]}
		className="aui-md select-text cursor-text"
		components={components}
	/>
);

export const MarkdownText = memo(MarkdownTextImpl);
