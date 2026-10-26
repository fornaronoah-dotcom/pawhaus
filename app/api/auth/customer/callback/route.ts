import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode } from "@/lib/customer/oauth";
import { setCustomerTokens } from "@/lib/customer/session";

export const runtime = "nodejs";

/** OAuth-callback: verifieert state, wisselt de code in voor tokens, zet sessie. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const savedState = store.get("customer_oauth_state")?.value;
  const verifier = store.get("customer_oauth_verifier")?.value;

  // Tijdelijke OAuth-cookies altijd opruimen.
  store.delete("customer_oauth_state");
  store.delete("customer_oauth_verifier");
  store.delete("customer_oauth_nonce");

  if (!code || !state || !verifier || state !== savedState) {
    return NextResponse.redirect(new URL("/?account=error", request.url));
  }

  try {
    const tokens = await exchangeCode(code, verifier);
    await setCustomerTokens(tokens);
  } catch (err) {
    console.error("[customer] login-callback mislukt:", err);
    return NextResponse.redirect(new URL("/?account=error", request.url));
  }

  // Naar het account; de FavoritesProvider merge't daar lokale favorieten.
  return NextResponse.redirect(new URL("/account", request.url));
}
