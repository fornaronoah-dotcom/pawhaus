# Roadmap

## Fase 1 — Live & valideren ✅ (huidige scope)
- [x] Next.js + Tailwind + shadcn/ui project setup
- [x] Shopify Storefront-client met mock-fallback
- [x] Homepage (hero, categorieën, featured, voordelen, nieuwsbrief)
- [x] Productoverzicht met filters & sortering
- [x] Productdetail met varianten & voorraadstatus
- [x] Winkelmand (drawer + pagina) via Shopify Cart API / mock
- [x] Checkout-redirect naar Shopify
- [x] Info-pagina's, SEO, sitemap, health check
- [x] Docker + Nginx + Certbot deployment
- [ ] Shopify-store koppelen + eerste echte producten
- [ ] Eerste verkopen

## Fase 2 — Eigen data (PostgreSQL)
> Nog **niet** bouwen. Pas oppakken zodra fase 1 valideert.
- Wishlist
- Reviews
- Analytics
- AI-dashboard / aanbevelingen
- Extra klantdata

Technisch: PostgreSQL toevoegen (bv. naast de container via Docker), eventueel
Redis voor caching/sessies, en een cache-handler voor ISR bij meerdere instances.

## Fase 3 — Automatisering & groei
- Geautomatiseerde rapporten
- Marketing-integraties (e-mail, ads)
- Voorraad-/prijssync optimalisaties
