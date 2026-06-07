import type { Metadata } from "next";
import { Baloo_2, Caveat, Inter, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Rond, speels-premium display-font voor titels.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

// Premium display-font voor de productpagina (Poppins).
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Body-font: rustige, leesbare partner voor Plus Jakarta Sans.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Handschrift-font voor speelse doodle-teksten in de hero.
const caveat = Caveat({
  variable: "--font-hand-caveat",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Premium accessoires voor hond & kat",
    template: "%s · Pawhaus",
  },
  description:
    "Zorgvuldig geselecteerde, hoogwaardige accessoires voor honden en katten. Snelle levering, eenvoudig retour en persoonlijke service.",
  openGraph: {
    type: "website",
    locale: "nl_BE",
    siteName: "Pawhaus",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      suppressHydrationWarning
      className={`${baloo.variable} ${geistMono.variable} ${inter.variable} ${caveat.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
