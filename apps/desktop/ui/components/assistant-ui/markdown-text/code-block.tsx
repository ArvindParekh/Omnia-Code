import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ShikiHighlighter from "react-shiki";

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

const ALIAS_MAP: Record<string, string> = {
	ts: "typescript",
	tsx: "tsx",
	js: "javascript",
	jsx: "jsx",
	py: "python",
	sh: "bash",
	bash: "bash",
	ps1: "powershell",
};

// Overrides the `pre` element. react-markdown nests the code inside a <code>
// child; we read the language + raw text straight off that child's props and
// hand them to shiki rather than rendering the child (the `code` override only
// handles inline code). The bordered container is styled here so it joins the
// CodeHeader above it; shiki's own background is forced transparent in App.css.
export function CodeBlock({ children }: ComponentPropsWithoutRef<"pre">) {
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
		const checks = [
			cls,
			String(props.lang ?? ""),
			String(props.meta ?? ""),
			String((props as Record<string, unknown>)["data-language"] ?? ""),
		].join(" ");

		let detected: string | undefined;
		const m = /(?:language|lang)[-:=\s]*([^\s;,:]+)/i.exec(checks);
		if (m) detected = m[1];
		if (!detected) {
			const token = checks.split(/\s+/).find((t) => /^(?:language|lang)[-:=]?/i.test(t));
			if (token) detected = token.replace(/^(?:language|lang)[-:=]?/i, "");
		}

		if (detected) {
			const key = detected.toLowerCase().replace(/[^a-z0-9-]/g, "");
			language = ALIAS_MAP[key] ?? key;
		} else {
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
				className="overflow-x-auto rounded-b-lg border border-t-0 border-white/[8%] p-4 text-[11px] leading-relaxed"
			>
				{code || " "}
			</ShikiHighlighter>
		</div>
	);
}
