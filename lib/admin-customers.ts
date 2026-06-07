import "server-only";

import { shopifyAdminFetch } from "@/lib/shopify-admin";
import { ShopifyError } from "@/lib/shopify";
import {
  CUSTOMERS_QUERY,
  CUSTOMER_DETAIL_QUERY,
} from "@/lib/admin-customer-queries";
import { numericIdFromGid } from "@/lib/admin-products";
import type { Money } from "@/lib/types";

/** Klanten via de Shopify Admin API. Shopify blijft bron van waarheid. */

export type AdminCustomer = {
  id: string;
  numericId: string;
  name: string;
  email: string | null;
  marketingSubscribed: boolean;
  orders: number;
  spent: Money | null;
  state: string;
  tags: string[];
  createdAt: string;
};

export class CustomerScopeError extends Error {
  constructor() {
    super("De Shopify-app mist de scope read_customers.");
    this.name = "CustomerScopeError";
  }
}

function isAccessDenied(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /access denied|read_customers|write_customers|protected customer/i.test(msg);
}

type RawCustomer = {
  id: string;
  displayName: string;
  defaultEmailAddress: { emailAddress: string | null; marketingState: string } | null;
  numberOfOrders: string | number;
  amountSpent: Money | null;
  createdAt: string;
  state: string;
  tags: string[];
};

const PAGE_SIZE = 250;
const DEFAULT_MAX = 1000;

export async function fetchCustomers(opts?: {
  query?: string;
  max?: number;
}): Promise<{ items: AdminCustomer[]; hasMore: boolean }> {
  const max = opts?.max ?? DEFAULT_MAX;
  const items: AdminCustomer[] = [];
  let after: string | null = null;
  let hasMore = false;

  try {
    while (items.length < max) {
      const data: {
        customers: {
          edges: { node: RawCustomer }[];
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        };
      } = await shopifyAdminFetch({
        query: CUSTOMERS_QUERY,
        variables: {
          first: Math.min(PAGE_SIZE, max - items.length),
          after,
          query: opts?.query ?? undefined,
        },
      });

      for (const { node } of data.customers.edges) {
        items.push({
          id: node.id,
          numericId: numericIdFromGid(node.id),
          name: node.displayName || "(geen naam)",
          email: node.defaultEmailAddress?.emailAddress ?? null,
          marketingSubscribed: node.defaultEmailAddress?.marketingState === "SUBSCRIBED",
          orders: Number(node.numberOfOrders) || 0,
          spent: node.amountSpent ?? null,
          state: node.state,
          tags: node.tags ?? [],
          createdAt: node.createdAt,
        });
      }

      if (data.customers.pageInfo.hasNextPage) {
        after = data.customers.pageInfo.endCursor;
        if (items.length >= max) {
          hasMore = true;
          break;
        }
      } else break;
    }
  } catch (err) {
    if (err instanceof ShopifyError && isAccessDenied(err)) {
      throw new CustomerScopeError();
    }
    throw err;
  }

  return { items, hasMore };
}

/* ------------------------------- Klant 360 ----------------------------- */

export type CustomerOrder = {
  id: string;
  name: string;
  createdAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  total: Money;
  discountCodes: string[];
};

export type AdminCustomerDetail = {
  id: string;
  numericId: string;
  name: string;
  email: string | null;
  phone: string | null;
  marketingSubscribed: boolean;
  state: string;
  createdAt: string;
  note: string | null;
  tags: string[];
  city: string | null;
  country: string | null;
  orders: number;
  spent: Money | null;
  aov: Money | null;
  lastOrderAt: string | null;
  usedDiscounts: string[];
  orderList: CustomerOrder[];
};

function customerGid(numericId: string): string {
  return `gid://shopify/Customer/${numericId}`;
}

export async function getCustomerDetail(
  numericId: string,
): Promise<AdminCustomerDetail | null> {
  type Raw = {
    id: string;
    displayName: string;
    defaultEmailAddress: { emailAddress: string | null; marketingState: string } | null;
    defaultPhoneNumber: { phoneNumber: string | null } | null;
    numberOfOrders: string | number;
    amountSpent: Money | null;
    createdAt: string;
    state: string;
    note: string | null;
    tags: string[];
    defaultAddress: { city: string | null; country: string | null } | null;
    lastOrder: { createdAt: string } | null;
    orders: {
      nodes: {
        id: string;
        name: string;
        createdAt: string;
        displayFinancialStatus: string | null;
        displayFulfillmentStatus: string | null;
        totalPriceSet: { shopMoney: Money };
        discountCodes: string[];
      }[];
    };
  };

  const data = await shopifyAdminFetch<{ customer: Raw | null }>({
    query: CUSTOMER_DETAIL_QUERY,
    variables: { id: customerGid(numericId) },
  });

  const c = data.customer;
  if (!c) return null;

  const orders = Number(c.numberOfOrders) || 0;
  const spent = c.amountSpent ?? null;
  const aov =
    spent && orders > 0
      ? { amount: (Number(spent.amount) / orders).toFixed(2), currencyCode: spent.currencyCode }
      : null;

  const orderList: CustomerOrder[] = c.orders.nodes.map((o) => ({
    id: o.id,
    name: o.name,
    createdAt: o.createdAt,
    financialStatus: o.displayFinancialStatus ?? "—",
    fulfillmentStatus: o.displayFulfillmentStatus ?? "—",
    total: o.totalPriceSet.shopMoney,
    discountCodes: o.discountCodes ?? [],
  }));

  const usedDiscounts = [...new Set(orderList.flatMap((o) => o.discountCodes))];

  return {
    id: c.id,
    numericId,
    name: c.displayName || "(geen naam)",
    email: c.defaultEmailAddress?.emailAddress ?? null,
    phone: c.defaultPhoneNumber?.phoneNumber ?? null,
    marketingSubscribed: c.defaultEmailAddress?.marketingState === "SUBSCRIBED",
    state: c.state,
    createdAt: c.createdAt,
    note: c.note,
    tags: c.tags ?? [],
    city: c.defaultAddress?.city ?? null,
    country: c.defaultAddress?.country ?? null,
    orders,
    spent,
    aov,
    lastOrderAt: c.lastOrder?.createdAt ?? null,
    usedDiscounts,
    orderList,
  };
}
