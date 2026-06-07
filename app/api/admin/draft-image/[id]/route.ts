import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getDraft } from "@/lib/admin/media-review";

export const runtime = "nodejs";

/** Serveert de binaire draft-afbeelding (alleen voor ingelogde admins). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Niet ingelogd", { status: 401 });

  const { id } = await params;
  const draft = await getDraft(id);
  if (!draft) return new NextResponse("Niet gevonden", { status: 404 });

  const bytes = Buffer.from(draft.dataBase64, "base64");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": draft.mime,
      "Cache-Control": "private, no-store",
    },
  });
}
