import type { Collection, Product, ProductImage } from "@/lib/types";

/**
 * Mock-catalogus die wordt gebruikt zolang er geen Shopify-store gekoppeld is
 * (zie `isShopifyConfigured` in shopify.ts). Zo werkt de volledige UI direct.
 * Vervang vanzelf zodra de Storefront-token is ingesteld.
 */

const PLACEHOLDER: ProductImage = {
  url: "/images/placeholder-product.svg",
  altText: null,
  width: 800,
  height: 800,
};

const CURRENCY = "EUR";

type MockInput = {
  handle: string;
  title: string;
  description: string;
  price: number;
  compareAt?: number;
  productType: string;
  category: "hond" | "kat";
  colors?: string[];
  sizes?: string[];
  available?: boolean;
  /** Tijdelijke stockfoto (Unsplash) voor een beter visueel beeld. */
  image?: string;
};

function euro(amount: number) {
  return { amount: amount.toFixed(2), currencyCode: CURRENCY };
}

function buildProduct(input: MockInput): Product {
  const {
    handle,
    title,
    description,
    price,
    compareAt,
    productType,
    category,
    colors = [],
    sizes = [],
    available = true,
    image,
  } = input;

  const mainImage: ProductImage = image
    ? { url: image, altText: title, width: 800, height: 800 }
    : PLACEHOLDER;

  const optionDefs: { name: string; values: string[] }[] = [];
  if (sizes.length) optionDefs.push({ name: "Maat", values: sizes });
  if (colors.length) optionDefs.push({ name: "Kleur", values: colors });

  // Cartesisch product van de opties → varianten.
  const combos: Record<string, string>[] = optionDefs.reduce<
    Record<string, string>[]
  >(
    (acc, opt) =>
      acc.flatMap((combo) =>
        opt.values.map((value) => ({ ...combo, [opt.name]: value })),
      ),
    [{}],
  );

  const variants = combos.map((combo, index) => {
    const selectedOptions = Object.entries(combo).map(([name, value]) => ({
      name,
      value,
    }));
    return {
      id: `gid://mock/ProductVariant/${handle}-${index}`,
      title: selectedOptions.map((o) => o.value).join(" / ") || "Standaard",
      availableForSale: available && index % 7 !== 6, // af en toe uitverkocht
      price: euro(price),
      compareAtPrice: compareAt ? euro(compareAt) : null,
      selectedOptions,
    };
  });

  return {
    id: `gid://mock/Product/${handle}`,
    handle,
    title,
    description,
    descriptionHtml: `<p>${description}</p>`,
    featuredImage: mainImage,
    images: [mainImage],
    priceRange: {
      minVariantPrice: euro(price),
      maxVariantPrice: euro(price),
    },
    compareAtPrice: compareAt ? euro(compareAt) : null,
    options: optionDefs.map((opt, i) => ({
      id: `gid://mock/ProductOption/${handle}-${i}`,
      name: opt.name,
      values: opt.values,
    })),
    variants,
    availableForSale: available,
    tags: [category],
    productType,
    vendor: "Pawhaus",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

export const MOCK_PRODUCTS: Product[] = [
  buildProduct({
    handle: "leren-halsband-hond",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=75&auto=format&fit=crop",
    title: "Handgemaakte leren halsband",
    description:
      "Tijdloze halsband van volnerf leer met messing gesp. Verzacht mee met de tijd en gaat jaren mee.",
    price: 39.95,
    productType: "Halsbanden",
    category: "hond",
    colors: ["Cognac", "Zwart", "Taupe"],
    sizes: ["S", "M", "L"],
  }),
  buildProduct({
    handle: "gewatteerde-hondenriem",
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=75&auto=format&fit=crop",
    title: "Gewatteerde hondenriem",
    description:
      "Zachte, gewatteerde handgreep en duurzaam nylon. Comfortabel wandelen, ook bij langere uitjes.",
    price: 29.95,
    compareAt: 39.95,
    productType: "Riemen",
    category: "hond",
    colors: ["Antraciet", "Olijf"],
  }),
  buildProduct({
    handle: "orthopedische-hondenmand",
    image: "https://images.unsplash.com/photo-1591768575198-88dac53fbd0a?w=800&q=75&auto=format&fit=crop",
    title: "Orthopedische hondenmand",
    description:
      "Traagschuim kern voor optimale steun aan gewrichten. Afneembare, wasbare hoes van linnenmix.",
    price: 89.0,
    productType: "Manden & kussens",
    category: "hond",
    sizes: ["M", "L", "XL"],
  }),
  buildProduct({
    handle: "natuurrubber-kauwspeelgoed",
    image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=75&auto=format&fit=crop",
    title: "Natuurrubber kauwspeelgoed",
    description:
      "Stevig, vrij van schadelijke stoffen en geschikt voor stevige kauwers. Drijft op water.",
    price: 14.95,
    productType: "Speelgoed",
    category: "hond",
    colors: ["Mint", "Terra"],
  }),
  buildProduct({
    handle: "keramische-kattenvoerbak",
    image: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&q=75&auto=format&fit=crop",
    title: "Keramische voerbak duo",
    description:
      "Set van twee handgeglazuurde keramische bakjes op een eikenhouten standaard. Vaatwasbestendig.",
    price: 34.95,
    productType: "Voerbakken",
    category: "kat",
  }),
  buildProduct({
    handle: "design-krabpaal",
    image: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&q=75&auto=format&fit=crop",
    title: "Design krabpaal eiken",
    description:
      "Minimalistische krabpaal met sisaltouw en een rustplek van bouclé. Past in elk interieur.",
    price: 129.0,
    compareAt: 149.0,
    productType: "Krabpalen",
    category: "kat",
    colors: ["Naturel", "Crème"],
  }),
  buildProduct({
    handle: "zelfreinigende-kattenbak",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=75&auto=format&fit=crop",
    title: "Gesloten kattenbak met filter",
    description:
      "Discrete, gesloten kattenbak met koolstoffilter tegen geurtjes en een uitneembare schep.",
    price: 49.95,
    productType: "Kattenbakken",
    category: "kat",
    colors: ["Grijs", "Wit"],
  }),
  buildProduct({
    handle: "wollen-kattenmand",
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=75&auto=format&fit=crop",
    title: "Wollen kattenmand",
    description:
      "Handgevilte mand van 100% wol. Zacht, ademend en van nature vuilafstotend.",
    price: 44.95,
    productType: "Manden & kussens",
    category: "kat",
    colors: ["Gemêleerd grijs", "Zand"],
  }),
];

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: "gid://mock/Collection/hond",
    handle: "hond",
    title: "Voor de hond",
    description: "Halsbanden, riemen, manden en speelgoed.",
    image: null,
  },
  {
    id: "gid://mock/Collection/kat",
    handle: "kat",
    title: "Voor de kat",
    description: "Krabpalen, voerbakken, manden en meer.",
    image: null,
  },
];
