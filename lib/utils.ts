// lib/utils.ts
// Small helper utilities for chunking text

export function chunkText(text: string, maxLen = 800) {
	const parts: string[] = [];
	let i = 0;
	while (i < text.length) {
		const slice = text.slice(i, i + maxLen);
		parts.push(slice.trim());
		i += maxLen;
	}
	return parts.filter(Boolean);
}

export function idFromSource(source: string, idx: number) {
	return `${encodeURIComponent(source)}-${idx}`;
}
