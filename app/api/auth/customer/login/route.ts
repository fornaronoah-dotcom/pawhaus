import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isCustomerAccountsConfigured } from "@/lib/customer/config";
import {
  buildAuthorizeUrl,
  codeChallengeFromVerifier,
  generateCodeVerifier,
  randomToken,
} from "@/lib/customer/oauth";

export const runtime = "nodejs";

const TEMP_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 600, // 10 min — alleen tijdens de login-redirect nodig
};

/** Start de OAuth-login: genereert PKCE + state en redirect naar Shopify. */
export async function GET(request: Request) {
  if (!isCustomerAccountsConfigured) {
    return NextResponse.redirect(new URL("/?account=unavailable", request.url));
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = codeChallengeFromVerifier(codeVerifier);
  const state = randomToken();
  const nonce = randomToken();

  const store = await cookies();
  store.set("customer_oauth_state", state, TEMP_COOKIE_OPTS);
  store.set("customer_oauth_verifier", codeVerifier, TEMP_COOKIE_OPTS);
  store.set("customer_oauth_nonce", nonce, TEMP_COOKIE_OPTS);

  return NextResponse.redirect(
    buildAuthorizeUrl({ state, nonce, codeChallenge }),
  );
}
