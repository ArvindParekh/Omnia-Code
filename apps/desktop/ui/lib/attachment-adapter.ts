import type { AttachmentAdapter, CompleteAttachment, PendingAttachment } from "@assistant-ui/react";

// Accepts any file the user picks. The built-in SimpleTextAttachmentAdapter
// only whitelists a narrow set of text/* MIME types, which silently drops most
// real-world picks (code files like .ts/.py, images, binaries) before they ever
// render as a chip. For an agent GUI that wraps coding CLIs, users attach
// arbitrary files, so we accept everything and let the backend decide what to
// do with the content.
//
// Send is a no-op passthrough for now: the message pipeline isn't wired to a
// real model yet, so we just mark the attachment complete with empty content.
export class AnyFileAttachmentAdapter implements AttachmentAdapter {
	accept = "*";

	async add({ file }: { file: File }): Promise<PendingAttachment> {
		return {
			id: crypto.randomUUID(),
			type: file.type.startsWith("image/") ? "image" : "file",
			name: file.name,
			contentType: file.type || "application/octet-stream",
			file,
			status: { type: "requires-action", reason: "composer-send" },
		};
	}

	async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
		return { ...attachment, status: { type: "complete" }, content: [] };
	}

	async remove() {}
}
