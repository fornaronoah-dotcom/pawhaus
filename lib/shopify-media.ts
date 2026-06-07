import "server-only";

import { shopifyAdminFetch } from "@/lib/shopify-admin";
import { ShopifyError } from "@/lib/shopify";
import {
  ADMIN_STAGED_UPLOADS_MUTATION,
  ADMIN_PRODUCT_CREATE_MEDIA_MUTATION,
} from "@/lib/admin-queries";
import { productGid } from "@/lib/admin-products";

/**
 * Uploadt een afbeelding (bytes) naar Shopify en koppelt ze aan een product.
 * Officiële weg: stagedUploadsCreate → multipart upload → productCreateMedia.
 * Wordt ENKEL aangeroepen bij expliciete goedkeuring (nooit automatisch).
 */
export async function uploadImageToShopify(
  numericId: string,
  bytes: Buffer,
  filename: string,
  mime: string,
  alt: string,
): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  // 1. Staged target aanvragen.
  const staged = await shopifyAdminFetch<{
    stagedUploadsCreate: {
      stagedTargets: {
        url: string;
        resourceUrl: string;
        parameters: { name: string; value: string }[];
      }[];
      userErrors: { field: string[] | null; message: string }[];
    };
  }>({
    query: ADMIN_STAGED_UPLOADS_MUTATION,
    variables: {
      input: [
        {
          filename,
          mimeType: mime,
          resource: "PRODUCT_IMAGE",
          httpMethod: "POST",
        },
      ],
    },
  });

  if (staged.stagedUploadsCreate.userErrors.length) {
    return {
      ok: false,
      error: staged.stagedUploadsCreate.userErrors.map((e) => e.message).join("; "),
    };
  }
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  if (!target) return { ok: false, error: "Geen staged upload-target ontvangen." };

  // 2. Bytes uploaden naar het staged target (parameters eerst, file als laatste).
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append(
    "file",
    new Blob([new Uint8Array(bytes)], { type: mime }),
    filename,
  );

  let uploadRes: Response;
  try {
    uploadRes = await fetch(target.url, { method: "POST", body: form });
  } catch (err) {
    throw new ShopifyError("Upload naar Shopify-opslag mislukt.", err);
  }
  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => "");
    return {
      ok: false,
      error: `Upload naar opslag gaf status ${uploadRes.status}. ${text.slice(0, 200)}`,
    };
  }

  // 3. Media aan het product koppelen.
  const created = await shopifyAdminFetch<{
    productCreateMedia: {
      media: { id?: string }[];
      mediaUserErrors: { field: string[] | null; message: string }[];
    };
  }>({
    query: ADMIN_PRODUCT_CREATE_MEDIA_MUTATION,
    variables: {
      productId: productGid(numericId),
      media: [
        {
          originalSource: target.resourceUrl,
          mediaContentType: "IMAGE",
          alt,
        },
      ],
    },
  });

  if (created.productCreateMedia.mediaUserErrors.length) {
    return {
      ok: false,
      error: created.productCreateMedia.mediaUserErrors
        .map((e) => e.message)
        .join("; "),
    };
  }
  const mediaId = created.productCreateMedia.media[0]?.id;
  if (!mediaId) {
    return { ok: false, error: "Shopify gaf geen media-id terug." };
  }
  return { ok: true, mediaId };
}
