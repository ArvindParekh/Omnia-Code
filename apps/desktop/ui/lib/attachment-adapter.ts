import type { AttachmentAdapter, CompleteAttachment, PendingAttachment } from "@assistant-ui/react";
import type { MessageAttachment } from "@omnia/contracts";

const resolved = new Map<string, MessageAttachment>();

export function takeAttachments(ids: string[]): MessageAttachment[] {
	const attachments: MessageAttachment[] = [];
	for (const id of ids) {
		const attachment = resolved.get(id);
		if (attachment) attachments.push(attachment);
	}
	return attachments;
}

// Accepts any file the user picks. The built-in SimpleTextAttachmentAdapter
// only whitelists a narrow set of text/* MIME types, which silently drops most
// real-world picks (code files like .ts/.py, images, binaries) before they ever
// render as a chip. For an agent GUI that wraps coding CLIs, users attach
// arbitrary files, so we accept everything and let the backend decide what to
// do with the content.
export class AnyFileAttachmentAdapter implements AttachmentAdapter {
	accept = "*";

	async add({ file }: { file: File }): Promise<PendingAttachment> {
		const id = crypto.randomUUID();
		const isImage = file.type.startsWith("image/");

		resolved.set(id, {
			id,
			kind: isImage ? "image" : "file",
			path: window.omnia.getPathForFile(file),
			name: file.name,
			contentType: file.type || "application/octet-stream",
			sizeBytes: file.size,
		});

		return {
			id,
			type: isImage ? "image" : "file",
			name: file.name,
			contentType: file.type || "application/octet-stream",
			file,
			status: { type: "requires-action", reason: "composer-send" },
		};
	}

	async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
		return { ...attachment, status: { type: "complete" }, content: [] };
	}

	async remove(attachment: { id: string }) {
		resolved.delete(attachment.id);
	}
}
