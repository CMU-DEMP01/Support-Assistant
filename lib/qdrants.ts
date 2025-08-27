// lib/qdrant.ts
import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://127.0.0.1:6333",
  apiKey: process.env.QDRANT_API_KEY, // leave empty if local
});
export const VECTOR_SIZE = 768; // default vector size used when creating collections

export async function initCollection(name = "support_chunks") {
  const collections = await qdrant.getCollections();
  const exists = collections.collections?.some(c => c.name === name);
  if (!exists) {
    await qdrant.createCollection(name, {
      vectors: {
  size: VECTOR_SIZE, // Gemini embeddings size (default)
        distance: "Cosine",
      },
    });
  }
}
