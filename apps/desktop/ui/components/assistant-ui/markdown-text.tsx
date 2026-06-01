import {
	MarkdownTextPrimitive,
	type CodeHeaderProps,
	unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
	useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import {
	Children,
	isValidElement,
	memo,
	useState,
	type ComponentPropsWithoutRef,
	type ReactNode,
} from "react";
import ShikiHighlighter from "react-shiki";
import { Copy, Check } from "@phosphor-icons/react";
import { cn } from "../../lib/utils";
import { copyText } from "../../lib/clipboard";

// ─── Code header (language label + copy button) ────────────────────────────────

function CodeHeader({ language, code }: CodeHeaderProps) {
	const [copied, setCopied] = useState(false);

	const onCopy = async () => {
		if (!code || copied) return;
		if (await copyText(code)) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
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

// ─── Syntax-highlighted code block ────────────────────────────────────────────

// Flatten a markdown code node's children down to its raw text. react-markdown
// passes the fenced code as a nested <code> element whose children are text.
function extractCodeText(node: ReactNode): string {
	if (typeof node === "string") return node;
	if (Array.isArray(node)) return node.map(extractCodeText).join("");
	if (isValidElement(node)) {
		return extractCodeText((node.props as { children?: ReactNode }).children);
	}
	return "";
}

// Overrides the `pre` element. react-markdown nests the code inside a <code>
// child; we read the language + raw text straight off that child's props and
// hand them to shiki rather than rendering the child (the `code` override only
// handles inline code). The bordered container is styled here so it joins the
// CodeHeader above it; shiki's own background is forced transparent in App.css.
function CodeBlock({ children }: ComponentPropsWithoutRef<"pre">) {
	const child = Children.toArray(children)[0];
	let language = "text";
	let code = "";
	if (isValidElement(child)) {
		const props = child.props as {
			className?: string;
			children?: ReactNode;
			lang?: string;
			meta?: string;
		};
		const cls = String(props.className ?? "");
		// Attempt multiple places for language info
		const checks = [
			cls,
			String(props.lang ?? ""),
			String(props.meta ?? ""),
			String((props as any)["data-language"] ?? ""),
		].join(" ");

		let detected: string | undefined = undefined;
		const m = /(?:language|lang)[-:=\s]*([^\s;,:]+)/i.exec(checks);
		if (m) detected = m[1];
		if (!detected) {
			const token = checks.split(/\s+/).find((t) => /^(?:language|lang)[-:=]?/i.test(t));
			if (token) detected = token.replace(/^(?:language|lang)[-:=]?/i, "");
		}

		const aliasMap: Record<string, string> = {
			ts: "typescript",
			tsx: "tsx",
			js: "javascript",
			jsx: "jsx",
			py: "python",
			sh: "bash",
			bash: "bash",
			ps1: "powershell",
		};

		if (detected) {
			const key = detected.toLowerCase().replace(/[^a-z0-9\-]/g, "");
			language = aliasMap[key] ?? key;
		} else {
			// fall back to heuristics
			const sample = extractCodeText(props.children);
			if (/\b(import|export|interface|type|readonly|from|=>|const|let|function)\b/.test(sample)) {
				language = "typescript";
			} else if (/\b(def |import |print\()/.test(sample)) {
				language = "python";
			} else {
				language = "text";
			}
		}
		code = extractCodeText(props.children).replace(/\n$/, "");
	} else {
		code = extractCodeText(children).replace(/\n$/, "");
	}

	return (
		<div className="mb-3 last:mb-0">
			<ShikiHighlighter
				language={language}
				theme={{ light: "github-light", dark: "github-dark-dimmed" }}
				defaultColor="dark"
				addDefaultStyles={true}
				showLanguage={false}
				className="overflow-x-auto rounded-b-lg border border-t-0 border-white/[8%] p-4 text-[12px] leading-relaxed"
			>
				{code || " "}
			</ShikiHighlighter>
		</div>
	);
}

// ─── Inline code ──────────────────────────────────────────────────────────────

function InlineCode({ className, ...props }: ComponentPropsWithoutRef<"code">) {
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
	pre: CodeBlock,
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
	<MarkdownTextPrimitive
		remarkPlugins={[remarkGfm]}
		className="aui-md select-text cursor-text"
		components={components}
	/>
);

export const MarkdownText = memo(MarkdownTextImpl);
