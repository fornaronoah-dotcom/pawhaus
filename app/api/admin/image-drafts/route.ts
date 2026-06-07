import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createDraft } from "@/lib/admin/media-review";
import { logActivity } from "@/lib/admin/activity";

export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Uploadt een bewerkte afbeelding als DRAFT (concept). Nooit direct live. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const numericId = String(form.get("numericId") ?? "");
  const shopifyProductGid = String(form.get("shopifyProductGid") ?? "");
  const originalMediaId = (form.get("originalMediaId") as string) || null;
  const originalUrl = (form.get("originalUrl") as string) || null;

  if (!(file instanceof File) || !numericId || !shopifyProductGid) {
    return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Alleen JPG, PNG of WebP toegestaan" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Bestand te groot (max 20MB)" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const id = await createDraft({
    shopifyProductGid,
    numericId,
    originalMediaId,
    originalUrl,
    filename: file.name || "upload.jpg",
    mime: file.type,
    dataBase64: buf.toString("base64"),
    createdBy: user.id,
  });

  await logActivity({
    actor: user.id,
    action: "image.draft.upload",
    targetType: "product",
    targetId: numericId,
    message: `Beeld-draft geüpload (${file.name})`,
  });

  return NextResponse.json({ id });
}
