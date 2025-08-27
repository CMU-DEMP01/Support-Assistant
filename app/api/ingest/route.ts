import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestFromUrls, ingestPdf } from "@/lib/rag";

const BodySchema = z.object({
  urls: z.array(z.string().url()).optional(),
});

export const runtime = "nodejs"; // needed for pdf-parse

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        console.error("Ingest: uploaded item is not a File", file);
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      try {
        const r = await ingestPdf(file, (file as any).name);
        return NextResponse.json({ ok: true, ...r });
      } catch (e: any) {
        console.error("Ingest: pdf processing failed", e);
        return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
      }
    } else {
      const body = await req.json();
      const { urls } = BodySchema.parse(body);
      if (!urls || urls.length === 0) {
        return NextResponse.json({ error: "Provide urls[] or upload a PDF" }, { status: 400 });
      }
      const r = await ingestFromUrls(urls);
      return NextResponse.json({ ok: true, ...r });
    }
  } catch (e: any) {
    console.error("Ingest route error", e);
    // In dev, include stack for easier debugging
    return NextResponse.json({ error: e?.message || "Ingest failed", stack: e?.stack }, { status: 500 });
  }
}
