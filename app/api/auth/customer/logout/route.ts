import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { customerConfig, isCustomerAccountsConfigured } from "@/lib/customer/config";
import { buildLogoutUrl } from "@/lib/customer/oauth";
import { clearCustomerSession } from "@/lib/customer/session";

export const runtime = "nodejs";

/** Logt de klant uit: wist de cookies en (indien mogelijk) de Shopify-sessie. */
export async function GET(request: Request) {
  const store = await cookies();
  const idToken = store.get("customer_idt")?.value ?? "";

  await clearCustomerSession();

  const home = new URL("/", request.url).toString();
  if (isCustomerAccountsConfigured && customerConfig.logoutUrl && idToken) {
    return NextResponse.redirect(buildLogoutUrl(idToken, home));
  }
  return NextResponse.redirect(home);
}
