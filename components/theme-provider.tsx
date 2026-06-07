"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Thema-context voor next-themes (nodig voor o.a. de Toaster).
 * De webshop draait standaard in een lichte, premium modus.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
