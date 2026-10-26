import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { customerConfig } from "@/lib/customer/config";

/**
 * OAuth 2.0 (Authorization Code + PKCE) helpers voor de Shopify Customer
 * Account API. Publieke client → geen client secret, wel PKCE.
 */

export function randomToken(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

/** PKCE code_verifier (43–128 tekens, base64url). */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** PKCE code_challenge = base64url( SHA-256( verifier ) ). */
export function codeChallengeFromVerifier(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Bouwt de authorize-URL waarheen de klant geredirect wordt om in te loggen. */
export function buildAuthorizeUrl(params: {
  state: string;
  nonce: string;
  codeChallenge: string;
}): string {
  const url = new URL(customerConfig.authUrl);
  url.searchParams.set("scope", customerConfig.scope);
  url.searchParams.set("client_id", customerConfig.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", customerConfig.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  /** Verloopmoment van het access-token (epoch ms). */
  expiresAt: number;
};

function toTokenSet(json: {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
}): TokenSet {
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? "",
    idToken: json.id_token ?? "",
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}

const TOKEN_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "pawhaus-storefront",
};

/** Wisselt de authorization code (na callback) in voor tokens. */
export async function exchangeCode(
  code: string,
  codeVerifier: string,
): Promise<TokenSet> {
  const res = await fetch(customerConfig.tokenUrl, {
    method: "POST",
    headers: TOKEN_HEADERS,
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: customerConfig.clientId,
      redirect_uri: customerConfig.redirectUri,
      code,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token-uitwisseling faalde (${res.status}): ${await res.text()}`);
  }
  return toTokenSet(await res.json());
}

/** Vernieuwt het access-token met een refresh-token. */
export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const res = await fetch(customerConfig.tokenUrl, {
    method: "POST",
    headers: TOKEN_HEADERS,
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: customerConfig.clientId,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token-refresh faalde (${res.status}): ${await res.text()}`);
  }
  const next = toTokenSet(await res.json());
  // Shopify geeft niet altijd een nieuw refresh-token terug → oude behouden.
  if (!next.refreshToken) next.refreshToken = refreshToken;
  return next;
}

/** Bouwt de logout-URL (wist de Shopify-sessie en redirect terug). */
export function buildLogoutUrl(
  idToken: string,
  postLogoutRedirectUri: string,
): string {
  const url = new URL(customerConfig.logoutUrl);
  url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  return url.toString();
}

/** Haalt het Shopify customer-id (sub) uit het id-token (JWT, niet geverifieerd). */
export function decodeCustomerId(idToken: string): string | null {
  try {
    const payload = idToken.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof json.sub === "string" ? json.sub : null;
  } catch {
    return null;
  }
}
