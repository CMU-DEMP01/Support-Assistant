// lib/rag.ts
import { genAI } from "./gemini";
import { chunkText, idFromSource } from "./utils";
import { qdrant, initCollection, VECTOR_SIZE } from "./qdrants";
import { randomUUID } from "crypto";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const COLLECTION = "support_chunks";

async function embedOne(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const res = await model.embedContent({ content: { parts: [{ text }] } } as any);
  // @ts-ignore
  const values = res.embedding?.values ?? [];
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Embedding failed: got empty vector");
  }
  return values;
}

// 🚀 Add chunks into Qdrant
export async function addChunks(chunks: { id: string; text: string; source: string }[]) {
  await initCollection(COLLECTION);

  const points = await Promise.all(
    chunks.map(async c => ({
      // Qdrant requires numeric IDs or UUID strings. Generate UUIDs and store original id in payload.
      id: randomUUID(),
      vector: await embedOne(c.text),
      payload: {
        text: c.text,
        source: c.source,
        original_id: c.id,
      },
    }))
  );

  // Validate vectors before sending to Qdrant
  const invalid = points.filter(p => !Array.isArray(p.vector) || p.vector.length === 0 || p.vector.some(v => typeof v !== 'number' || !isFinite(v)));
  if (invalid.length > 0) {
    const ids = invalid.map(i => i.id).slice(0, 10);
    throw new Error(`Invalid or empty embeddings for points: ${ids.join(', ')}${invalid.length > 10 ? ' (and more)' : ''}`);
  }

  // Check expected vector size against configured VECTOR_SIZE constant
  if (VECTOR_SIZE && points.some(p => p.vector.length !== VECTOR_SIZE)) {
    const mismatches = points.filter(p => p.vector.length !== VECTOR_SIZE).map(p => ({ id: p.id, len: p.vector.length }));
    throw new Error(`Vector size mismatch. Expected ${VECTOR_SIZE}. Examples: ${JSON.stringify(mismatches.slice(0,5))}`);
  }

  // Debug example: log one point shape
  console.log("🔍 Example point before upsert:", { id: points[0]?.id, original_id: points[0]?.payload?.original_id, vectorLen: points[0]?.vector?.length });

  try {
    await qdrant.upsert(COLLECTION, { points });
    return { added: points.length };
  } catch (err: any) {
    const resp = err?.response || err;
    const detail = resp?.data ? (`status ${resp.status}: ${JSON.stringify(resp.data).slice(0,200)}`) : String(resp);
    throw new Error(`qdrant upsert failed: ${detail}`);
  }
}

// 🚀 Retrieve
export async function retrieve(query: string, k = 5) {
  await initCollection(COLLECTION);
  const vector = await embedOne(query);

  const results = await qdrant.search(COLLECTION, {
    vector,
    limit: k,
    with_payload: true,
  });

  return results.map((r: any) => ({
    id: r.id,
    text: r.payload?.text as string,
    source: r.payload?.source as string,
    score: r.score,
  }));
}

// 🚀 Ingest from URLs
export async function ingestFromUrls(urls: string[]) {
  const chunks: { id: string; text: string; source: string }[] = [];

  for (const url of urls) {
    const res = await fetch(url);
    const text = await res.text();
    const parts = chunkText(text);

    parts.forEach((p, i) => {
      chunks.push({ id: `${url}-${i}`, text: p, source: url });
    });
  }

  return addChunks(chunks);
}

// 🚀 Ingest from PDF
export async function ingestPdf(file: any, filename?: string) {
  let buffer: Buffer;
  if (typeof file.arrayBuffer === "function") {
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
  } else if (Buffer.isBuffer(file)) {
    buffer = file;
  } else if (file && file.path) {
    const fs = await import("fs/promises");
    const dataBuf = await fs.readFile(file.path);
    buffer = Buffer.from(dataBuf);
  } else {
    throw new Error("Unsupported file type for PDF ingest");
  }

  let data: any;
  try {
    data = await pdfParse(buffer as any);
  } catch (err: any) {
    throw new Error(
      `pdf-parse failed for ${filename || "uploaded.pdf"}: ${err?.message || String(err)}`
    );
  }

  const parts = chunkText(data.text);
  const chunks = parts.map((p, i) => ({
    id: idFromSource(filename || "uploaded.pdf", i),
    text: p,
    source: filename || "uploaded.pdf",
  }));

  return addChunks(chunks);
}
