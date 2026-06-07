"use server";

import { cookies } from "next/headers";
import {
  ADD_CART_LINES_MUTATION,
  CREATE_CART_MUTATION,
  GET_CART_QUERY,
  REMOVE_CART_LINES_MUTATION,
  UPDATE_CART_LINES_MUTATION,
} from "@/lib/queries";
import { isShopifyConfigured, shopifyFetch, ShopifyError } from "@/lib/shopify";
import { MOCK_PRODUCTS } from "@/lib/mock";
import type { Cart, CartLine, Money } from "@/lib/types";

/**
 * Winkelmand-logica via Server Actions.
 * - Met Shopify gekoppeld: echte Storefront Cart API (cartId in httpOnly cookie).
 * - Zonder Shopify (demo-modus): mock-cart in een cookie, opgebouwd uit MOCK_PRODUCTS,
 *   zodat de volledige cart-flow werkt. Checkout is dan uitgeschakeld.
 */

const CART_ID_COOKIE = "cart_id";
const MOCK_CART_COOKIE = "mock_cart";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 dagen
};

type CartUserError = { field: string[] | null; message: string };
type CartMutationResult = { cart: RawCart | null; userErrors: CartUserError[] };
type RawCart = Cart; // GraphQL-vorm wordt platgeslagen via normalizeCart

/* ----------------------------- Shopify-cart ---------------------------- */

type RawCartResponse = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: Cart["cost"];
  lines: {
    edges: {
      node: {
        id: string;
        quantity: number;
        cost: { totalAmount: Money };
        merchandise: {
          id: string;
          title: string;
          selectedOptions: { name: string; value: string }[];
          product: CartLine["merchandise"]["product"];
        };
      };
    }[];
  };
};

function normalizeCart(raw: RawCartResponse): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    cost: raw.cost,
    lines: raw.lines.edges.map((e) => ({
      id: e.node.id,
      quantity: e.node.quantity,
      cost: e.node.cost,
      merchandise: e.node.merchandise,
    })),
  };
}

/* ------------------------------- Mock-cart ----------------------------- */

type MockLine = { variantId: string; quantity: number };

function findVariant(variantId: string) {
  for (const product of MOCK_PRODUCTS) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

function buildMockCart(lines: MockLine[]): Cart {
  const cartLines: CartLine[] = [];
  let subtotal = 0;
  let currency = "EUR";

  for (const { variantId, quantity } of lines) {
    const found = findVariant(variantId);
    if (!found) continue;
    const { product, variant } = found;
    const unit = Number(variant.price.amount);
    subtotal += unit * quantity;
    currency = variant.price.currencyCode;
    cartLines.push({
      id: variantId, // in mock = line id = variant id
      quantity,
      cost: {
        totalAmount: {
          amount: (unit * quantity).toFixed(2),
          currencyCode: currency,
        },
      },
      merchandise: {
        id: variant.id,
        title: variant.title,
        selectedOptions: variant.selectedOptions,
        product: {
          handle: product.handle,
          title: product.title,
          featuredImage: product.featuredImage,
        },
      },
    });
  }

  const money = (n: number): Money => ({
    amount: n.toFixed(2),
    currencyCode: currency,
  });

  return {
    id: "mock-cart",
    checkoutUrl: "", // leeg => demo-modus, geen checkout
    totalQuantity: cartLines.reduce((sum, l) => sum + l.quantity, 0),
    cost: { subtotalAmount: money(subtotal), totalAmount: money(subtotal) },
    lines: cartLines,
  };
}

async function readMockLines(): Promise<MockLine[]> {
  const store = await cookies();
  const raw = store.get(MOCK_CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MockLine[];
  } catch {
    return [];
  }
}

async function writeMockLines(lines: MockLine[]): Promise<Cart> {
  const store = await cookies();
  store.set(MOCK_CART_COOKIE, JSON.stringify(lines), COOKIE_OPTS);
  return buildMockCart(lines);
}

/* ------------------------------ Publieke API --------------------------- */

const EMPTY_CART: Cart = {
  id: "",
  checkoutUrl: "",
  totalQuantity: 0,
  cost: {
    subtotalAmount: { amount: "0.00", currencyCode: "EUR" },
    totalAmount: { amount: "0.00", currencyCode: "EUR" },
  },
  lines: [],
};

/** Haalt de huidige winkelmand op (read-only; veilig in Server Components). */
export async function getCart(): Promise<Cart> {
  if (!isShopifyConfigured) {
    return buildMockCart(await readMockLines());
  }

  const store = await cookies();
  const cartId = store.get(CART_ID_COOKIE)?.value;
  if (!cartId) return EMPTY_CART;

  try {
    const data = await shopifyFetch<{ cart: RawCartResponse | null }>({
      query: GET_CART_QUERY,
      variables: { cartId },
      cache: "no-store",
    });
    return data.cart ? normalizeCart(data.cart) : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

function ensureNoUserErrors(result: CartMutationResult | undefined) {
  if (result?.userErrors?.length) {
    throw new ShopifyError(
      result.userErrors.map((e) => e.message).join("; "),
      result.userErrors,
    );
  }
}

export async function addToCart(
  variantId: string,
  quantity = 1,
): Promise<Cart> {
  if (!isShopifyConfigured) {
    const lines = await readMockLines();
    const existing = lines.find((l) => l.variantId === variantId);
    if (existing) existing.quantity += quantity;
    else lines.push({ variantId, quantity });
    return writeMockLines(lines);
  }

  const store = await cookies();
  const cartId = store.get(CART_ID_COOKIE)?.value;
  const lineInput = [{ merchandiseId: variantId, quantity }];

  if (!cartId) {
    const data = await shopifyFetch<{ cartCreate: CartMutationResult }>({
      query: CREATE_CART_MUTATION,
      variables: { lines: lineInput },
      cache: "no-store",
    });
    ensureNoUserErrors(data.cartCreate);
    const cart = normalizeCart(data.cartCreate.cart as unknown as RawCartResponse);
    store.set(CART_ID_COOKIE, cart.id, COOKIE_OPTS);
    return cart;
  }

  const data = await shopifyFetch<{ cartLinesAdd: CartMutationResult }>({
    query: ADD_CART_LINES_MUTATION,
    variables: { cartId, lines: lineInput },
    cache: "no-store",
  });
  ensureNoUserErrors(data.cartLinesAdd);
  return normalizeCart(data.cartLinesAdd.cart as unknown as RawCartResponse);
}

export async function updateLineQuantity(
  lineId: string,
  quantity: number,
): Promise<Cart> {
  if (quantity <= 0) return removeFromCart(lineId);

  if (!isShopifyConfigured) {
    const lines = await readMockLines();
    const line = lines.find((l) => l.variantId === lineId);
    if (line) line.quantity = quantity;
    return writeMockLines(lines);
  }

  const store = await cookies();
  const cartId = store.get(CART_ID_COOKIE)?.value;
  if (!cartId) return EMPTY_CART;

  const data = await shopifyFetch<{ cartLinesUpdate: CartMutationResult }>({
    query: UPDATE_CART_LINES_MUTATION,
    variables: { cartId, lines: [{ id: lineId, quantity }] },
    cache: "no-store",
  });
  ensureNoUserErrors(data.cartLinesUpdate);
  return normalizeCart(data.cartLinesUpdate.cart as unknown as RawCartResponse);
}

export async function removeFromCart(lineId: string): Promise<Cart> {
  if (!isShopifyConfigured) {
    const lines = (await readMockLines()).filter(
      (l) => l.variantId !== lineId,
    );
    return writeMockLines(lines);
  }

  const store = await cookies();
  const cartId = store.get(CART_ID_COOKIE)?.value;
  if (!cartId) return EMPTY_CART;

  const data = await shopifyFetch<{ cartLinesRemove: CartMutationResult }>({
    query: REMOVE_CART_LINES_MUTATION,
    variables: { cartId, lineIds: [lineId] },
    cache: "no-store",
  });
  ensureNoUserErrors(data.cartLinesRemove);
  return normalizeCart(data.cartLinesRemove.cart as unknown as RawCartResponse);
}
