import "server-only";

import { customerConfig } from "@/lib/customer/config";
import { getValidAccessToken } from "@/lib/customer/session";

/**
 * GraphQL-fetch tegen de Shopify Customer Account API.
 * Het access-token gaat ráuw in de Authorization-header (géén "Bearer"-prefix),
 * zoals de Customer Account API vereist.
 */
export async function customerAccountFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error("Niet ingelogd of Customer Account API niet geconfigureerd.");
  }

  const res = await fetch(customerConfig.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      "User-Agent": "pawhaus-storefront",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Customer Account API-fout (${res.status}): ${await res.text()}`,
    );
  }

  const json = (await res.json()) as { data?: T; errors?: unknown[] };
  if (json.errors?.length) {
    throw new Error(`Customer Account API-fout: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}
