/**
 * Genereert AI-prompts voor Google Labs Flow. Pure, client-veilige functie
 * (geen server-afhankelijkheden). De prompts dwingen af dat het product exact
 * hetzelfde blijft; enkel de achtergrond/scène verandert.
 */

export type PromptInput = {
  title: string;
  productType?: string;
  tags?: string[];
};

export type PromptPreset = {
  key: "lifestyle" | "white";
  label: string;
  prompt: string;
};

function detectPet(input: PromptInput): "dog" | "cat" | null {
  const hay = [input.title, input.productType ?? "", ...(input.tags ?? [])]
    .join(" ")
    .toLowerCase();
  if (/\bkat\b|katten|cat\b|kitten/.test(hay)) return "cat";
  if (/\bhond\b|honden|dog\b|puppy/.test(hay)) return "dog";
  return null;
}

const KEEP =
  "Keep the product 100% identical to the reference image — do NOT change its shape, proportions, materials, colours, text or logo. Only change the background/scene.";

export function generatePrompts(input: PromptInput): PromptPreset[] {
  const pet = detectPet(input);
  const petClause =
    pet === "cat"
      ? " A calm cat may appear subtly in the scene, softly out of focus, never overlapping or hiding the product."
      : pet === "dog"
        ? " A friendly dog may appear subtly in the scene, softly out of focus, never overlapping or hiding the product."
        : "";

  const lifestyle =
    `Professional e-commerce product photo of the EXACT same product from the reference image ("${input.title}"). ` +
    `${KEEP} Place the product in a premium, warm PAWHAUS lifestyle setting: a clean modern home interior, soft natural daylight, tasteful minimal props, cosy but high-end.` +
    `${petClause} Photorealistic, high detail, realistic soft shadows and reflections, e-commerce quality, square 1:1 framing, product sharp and centered.`;

  const white =
    `Professional e-commerce product photo of the EXACT same product from the reference image ("${input.title}"). ` +
    `${KEEP} Place the product on a clean, bright white/light seamless studio background with soft even lighting and a subtle natural drop shadow. ` +
    `Photorealistic, crisp, catalog-ready, square 1:1 framing, product sharp and centered.`;

  return [
    { key: "lifestyle", label: "Premium lifestyle", prompt: lifestyle },
    { key: "white", label: "Witte achtergrond", prompt: white },
  ];
}
