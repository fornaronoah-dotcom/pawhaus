# Pawhaus — headless Next.js + Shopify

Premium webshop voor honden- en kattenaccessoires. De frontend draait op Next.js;
**Shopify** is de bron van waarheid voor producten, prijzen, voorraad, winkelmand,
checkout en orders. Orderafhandeling: Shopify → GOGETTERS → Van der Meer.

## Tech stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (neutraal premium thema)
- Shopify Storefront API (GraphQL) — via kale `fetch`, geen extra client
- Docker (standalone output) + Nginx + Certbot voor deployment

## Lokaal draaien
Vereist: Node 20+ en pnpm (`corepack enable`).

```bash
pnpm install
cp .env.example .env.local   # optioneel; zonder Shopify draait de shop op mock-data
pnpm dev
```

Open http://localhost:3000.

> **Demo-modus:** zolang `SHOPIFY_STOREFRONT_ACCESS_TOKEN` leeg is, gebruikt de shop
> automatisch een mock-catalogus (`lib/mock.ts`) zodat de volledige UI en cart-flow
> werken. Checkout is dan uitgeschakeld.

## Scripts
| Commando      | Functie                          |
| ------------- | -------------------------------- |
| `pnpm dev`    | Ontwikkelserver (Turbopack)      |
| `pnpm build`  | Productie-build (standalone)     |
| `pnpm start`  | Start (gebruik in prod: Docker)  |
| `pnpm lint`   | ESLint                           |

## Projectstructuur
```
app/                Routes (App Router)
  product/[handle]/ Productdetail
  producten/        Productoverzicht
  cart/             Winkelmand
  api/health/       Health check (Docker/Nginx)
components/         UI-componenten (+ ui/ = shadcn)
lib/
  shopify.ts        Storefront fetch-client + config-detectie
  queries.ts        GraphQL queries & mutations
  products.ts       Product-fetch + normalisatie (mock-fallback)
  cart.ts           Winkelmand Server Actions (Shopify + mock)
  mock.ts           Mock-catalogus
  types.ts          Gedeelde types
  utils.ts          cn, formatPrice, kortinghelpers
```

## Shopify koppelen
Zie [DEPLOYMENT.md](./DEPLOYMENT.md) → "Shopify koppelen".

## Volgende fases
Zie [ROADMAP.md](./ROADMAP.md).
