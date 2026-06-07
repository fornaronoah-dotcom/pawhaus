import { missingAdminConfig } from "@/lib/shopify-admin";

/**
 * Duidelijke, prominente melding wanneer de Shopify Admin API nog niet is
 * ingesteld. Toont exact welke env-variabele(n) ontbreken.
 */
export function AdminNotConfigured() {
  const missing = missingAdminConfig();

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
      <p className="font-semibold">Shopify Admin API nog niet ingesteld</p>
      <p className="mt-1 text-sm">
        Het beheerpaneel kan nog geen producten ophalen of wijzigen. Vul de
        volgende variabele(n) in <code>.env.local</code> in en herstart de
        dev-server:
      </p>
      <ul className="mt-2 list-inside list-disc text-sm">
        {missing.map((v) => (
          <li key={v}>
            <code>{v}</code>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        Het token begint met <code>shpat_</code> en komt uit een Shopify{" "}
        <strong>custom app</strong> (Settings → Apps → Develop apps → API
        credentials → Admin API access token), met scopes{" "}
        <code>read_products</code> en <code>write_products</code>. Géén OAuth,
        Client ID of Client secret nodig.
      </p>
    </div>
  );
}
