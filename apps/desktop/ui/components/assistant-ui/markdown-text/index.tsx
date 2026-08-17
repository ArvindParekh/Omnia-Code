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
			className={cn("mb-3 mt-5 text-[14px] font-semibold text-white/88 first:mt-0", className)}
			{...p}
		/>
	),
	h2: ({ className, ...p }: ComponentPropsWithoutRef<"h2">) => (
		<h2
			className={cn("mb-2 mt-4 text-[13px] font-semibold text-white/85 first:mt-0", className)}
			{...p}
		/>
	),
	h3: ({ className, ...p }: ComponentPropsWithoutRef<"h3">) => (
		<h3
			className={cn("mb-1.5 mt-3 text-[12px] font-semibold text-white/82 first:mt-0", className)}
			{...p}
		/>
	),
	p: ({ className, ...p }: ComponentPropsWithoutRef<"p">) => (
		<p
			className={cn("mb-3 text-[12px] leading-[1.65] text-white/75 last:mb-0", className)}
			{...p}
		/>
	),
	ul: ({ className, ...p }: ComponentPropsWithoutRef<"ul">) => (
		<ul
			className={cn(
				"mb-3 list-disc pl-5 text-[12px] text-white/75 last:mb-0 [&>li]:mt-1",
				className,
			)}
			{...p}
		/>
	),
	ol: ({ className, ...p }: ComponentPropsWithoutRef<"ol">) => (
		<ol
			className={cn(
				"mb-3 list-decimal pl-5 text-[12px] text-white/75 last:mb-0 [&>li]:mt-1",
				className,
			)}
			{...p}
		/>
	),
	li: ({ className, ...p }: ComponentPropsWithoutRef<"li">) => (
		<li className={cn("leading-[1.65]", className)} {...p} />
	),
	blockquote: ({ className, ...p }: ComponentPropsWithoutRef<"blockquote">) => (
		<blockquote
			className={cn(
				"mb-3 border-l-2 border-white/20 pl-4 text-[12px] text-white/45 italic last:mb-0",
				className,
			)}
			{...p}
		/>
	),
	a: ({ className, ...p }: ComponentPropsWithoutRef<"a">) => (
		<a
			className={cn(
				"text-blue-400/80 underline decoration-blue-400/40 hover:text-blue-400 transition-colors",
				className,
			)}
			{...p}
		/>
	),
	table: ({ className, ...p }: ComponentPropsWithoutRef<"table">) => (
		<div className="mb-3 overflow-x-auto last:mb-0">
			<table className={cn("w-full text-[12px] border-collapse", className)} {...p} />
		</div>
	),
	th: ({ className, ...p }: ComponentPropsWithoutRef<"th">) => (
		<th
			className={cn(
				"border border-white/[10%] bg-white/[4%] px-3 py-2 text-left font-medium text-white/70",
				className,
			)}
			{...p}
		/>
	),
	td: ({ className, ...p }: ComponentPropsWithoutRef<"td">) => (
		<td className={cn("border border-white/[8%] px-3 py-2 text-white/65", className)} {...p} />
	),
	hr: ({ className, ...p }: ComponentPropsWithoutRef<"hr">) => (
		<hr className={cn("my-4 border-white/[10%]", className)} {...p} />
	),
	strong: ({ className, ...p }: ComponentPropsWithoutRef<"strong">) => (
		<strong className={cn("font-semibold text-white/85", className)} {...p} />
	),
	em: ({ className, ...p }: ComponentPropsWithoutRef<"em">) => (
		<em className={cn("text-white/72", className)} {...p} />
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
