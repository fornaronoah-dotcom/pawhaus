import "server-only";

import { shopifyAdminFetch } from "@/lib/shopify-admin";
import { ShopifyError } from "@/lib/shopify";
import { fetchAdminProducts } from "@/lib/admin-products";
import { fetchCustomers } from "@/lib/admin-customers";
import { getStatusMap } from "@/lib/admin/product-status";
import { DEFAULT_OPT_STATUS } from "@/lib/admin/opt-status";
import { listGiveaways } from "@/lib/admin/giveaways";
import type { OptStatus } from "@/lib/db/schema";
import type { Money } from "@/lib/types";

/** Aggregaties voor het Analytics-dashboard. Hergebruikt bestaande data-lagen. */

export type CoreMetrics = {
  products: { total: number; active: number; draft: number; archived: number; noImage: number; noDescription: number };
  inventory: { units: number; value: Money | null; avgMargin: number | null };
  customers: { total: number; subscribers: number };
  ai: Record<OptStatus, number>;
  giveaways: { total: number; open: number; entries: number };
};

export async function getCoreMetrics(): Promise<CoreMetrics> {
  const [{ items: products }, giveaways] = await Promise.all([
    fetchAdminProducts({ max: 1000 }),
    listGiveaways(),
  ]);

  // Klanten (read_customers hebben we); val terug op 0 bij een fout.
  let customers: { total: number; subscribers: number } = { total: 0, subscribers: 0 };
  try {
    const { items } = await fetchCustomers({ max: 1000 });
    customers = { total: items.length, subscribers: items.filter((c) => c.marketingSubscribed).length };
  } catch {
    /* scope/fout → 0 */
  }

  const statusMap = await getStatusMap(products.map((p) => p.id));
  const ai: Record<OptStatus, number> = {
    niet_gecontroleerd: 0, klaar_voor_ai: 0, ai_voorstel_gemaakt: 0, goedgekeurd: 0, gepubliceerd: 0,
  };

  let units = 0;
  let valueAmount = 0;
  let currency = "EUR";
  let marginSum = 0;
  let marginCount = 0;
  const products_ = { total: products.length, active: 0, draft: 0, archived: 0, noImage: 0, noDescription: 0 };

  for (const p of products) {
    if (p.status === "ACTIVE") products_.active++;
    else if (p.status === "DRAFT") products_.draft++;
    else if (p.status === "ARCHIVED") products_.archived++;
    if (!p.hasImage) products_.noImage++;
    if (!p.hasDescription) products_.noDescription++;
    units += p.totalInventory;
    if (p.unitCost) { valueAmount += Number(p.unitCost.amount) * p.totalInventory; currency = p.unitCost.currencyCode; }
    if (p.marginPct != null) { marginSum += p.marginPct; marginCount++; }
    ai[statusMap.get(p.id) ?? DEFAULT_OPT_STATUS]++;
  }

  return {
    products: products_,
    inventory: {
      units,
      value: valueAmount > 0 ? { amount: valueAmount.toFixed(2), currencyCode: currency } : null,
      avgMargin: marginCount ? Math.round(marginSum / marginCount) : null,
    },
    customers,
    ai,
    giveaways: {
      total: giveaways.length,
      open: giveaways.filter((g) => g.status === "open").length,
      entries: giveaways.reduce((s, g) => s + g.entryCount, 0),
    },
  };
}

/* ------------------------------- Omzet (read_orders) ------------------------------- */

const ORDERS_COUNT_QUERY = /* GraphQL */ `query($q:String!){ ordersCount(query:$q){ count } }`;
const ORDERS_QUERY = /* GraphQL */ `
  query($q:String!,$first:Int!){
    orders(first:$first, query:$q){
      nodes { createdAt totalPriceSet { shopMoney { amount currencyCode } } }
      pageInfo { hasNextPage }
    }
  }
`;

export type OrdersSummary =
  | { scopeMissing: true }
  | {
      scopeMissing: false;
      count30: number;
      revenue30: Money | null;
      revenueToday: Money | null;
      aov: Money | null;
      capped: boolean;
    };

export async function getOrdersSummary(): Promise<OrdersSummary> {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  try {
    const countData = await shopifyAdminFetch<{ ordersCount: { count: number } }>({
      query: ORDERS_COUNT_QUERY,
      variables: { q: `created_at:>=${since}` },
    });
    const data = await shopifyAdminFetch<{
      orders: { nodes: { createdAt: string; totalPriceSet: { shopMoney: Money } }[]; pageInfo: { hasNextPage: boolean } };
    }>({ query: ORDERS_QUERY, variables: { q: `created_at:>=${since}`, first: 250 } });

    let sum30 = 0, sumToday = 0, currency = "EUR";
    for (const o of data.orders.nodes) {
      const amt = Number(o.totalPriceSet.shopMoney.amount);
      currency = o.totalPriceSet.shopMoney.currencyCode;
      sum30 += amt;
      if (new Date(o.createdAt) >= todayStart) sumToday += amt;
    }
    const count30 = countData.ordersCount.count;
    const money = (n: number): Money => ({ amount: n.toFixed(2), currencyCode: currency });

    return {
      scopeMissing: false,
      count30,
      revenue30: data.orders.nodes.length ? money(sum30) : null,
      revenueToday: money(sumToday),
      aov: count30 > 0 && data.orders.nodes.length ? money(sum30 / data.orders.nodes.length) : null,
      capped: data.orders.pageInfo.hasNextPage,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (err instanceof ShopifyError && /access denied|read_orders/i.test(msg)) {
      return { scopeMissing: true };
    }
    throw err;
  }
}
