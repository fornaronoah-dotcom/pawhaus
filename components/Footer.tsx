import Image from "next/image";
import Link from "next/link";
import { Newsletter } from "@/components/Newsletter";

const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] =
  [
    {
      title: "Winkel",
      links: [
        { label: "Alle producten", href: "/producten" },
        { label: "Voor de hond", href: "/producten?category=hond" },
        { label: "Voor de kat", href: "/producten?category=kat" },
      ],
    },
    {
      title: "Informatie",
      links: [
        { label: "Over ons", href: "/over-ons" },
        { label: "Contact", href: "/contact" },
        { label: "Verzending & retour", href: "/verzending-retour" },
      ],
    },
    {
      title: "Juridisch",
      links: [
        { label: "Privacybeleid", href: "/privacy" },
        { label: "Algemene voorwaarden", href: "/algemene-voorwaarden" },
      ],
    },
  ];

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.5 3c.3 1.9 1.45 3.4 3.5 3.68v2.45c-1.2.05-2.37-.33-3.5-1v5.77c0 3.2-2.35 5.6-5.45 5.6C8 19.5 5.5 17 5.5 14s2.4-5.5 5.45-5.4v2.55c-1.6 0-2.9 1.2-2.9 2.85 0 1.65 1.3 2.95 2.9 2.95 1.6 0 2.9-1.3 2.9-3.05V3h2.65Z" />
    </svg>
  );
}

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/pawhaus", Icon: InstagramIcon },
  { label: "TikTok", href: "https://www.tiktok.com/@pawhaus", Icon: TikTokIcon },
];

/** Betaalmethode-badges (BE & NL). */
function PaymentMethods() {
  const tile =
    "inline-flex h-7 items-center justify-center rounded-md border bg-white px-2 shadow-sm";
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Betaalmethodes">
      <span className={tile}>
        <span className="text-[10px] font-bold tracking-tight">
          <span className="text-[#004e91]">Banc</span>
          <span className="text-[#0a99d6]">ontact</span>
        </span>
      </span>
      <span className={tile}>
        <span className="text-[11px] font-bold tracking-tight">
          <span className="text-[#cc0066]">i</span>
          <span className="text-[#0a2d8f]">DEAL</span>
        </span>
      </span>
      <span className={tile}>
        <span className="text-[11px] font-bold italic tracking-tight text-[#1a1f71]">
          VISA
        </span>
      </span>
      <span className={tile}>
        <svg viewBox="0 0 36 24" className="h-4 w-auto" aria-hidden>
          <circle cx="15" cy="12" r="7" fill="#eb001b" />
          <circle cx="21" cy="12" r="7" fill="#f79e1b" fillOpacity={0.9} />
        </svg>
      </span>
      <span className={tile}>
        <span className="text-[11px] font-bold italic tracking-tight">
          <span className="text-[#003087]">Pay</span>
          <span className="text-[#009cde]">Pal</span>
        </span>
      </span>
      <span className="inline-flex h-7 items-center justify-center rounded-md border border-transparent bg-[#ffb3c7] px-2 shadow-sm">
        <span className="text-[11px] font-bold tracking-tight text-black">
          Klarna
        </span>
      </span>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-muted/40 border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_2fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo.png"
                alt="Pawhaus"
                width={468}
                height={85}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-muted-foreground max-w-sm text-sm">
              Premium accessoires voor hond en kat. Zorgvuldig geselecteerd,
              snel geleverd en met persoonlijke service.
            </p>

            <div className="pt-2">
              <p className="mb-2 text-sm font-medium">Blijf op de hoogte</p>
              <Newsletter />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_LINKS.map((column) => (
              <div key={column.title}>
                <h3 className="mb-3 text-sm font-medium">{column.title}</h3>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="mb-3 text-sm font-medium">Volg ons</h3>
              <div className="flex gap-2">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-9 place-items-center rounded-full border bg-white text-[#0C2A5A] transition hover:-translate-y-0.5 hover:text-[#e0533f] hover:shadow-sm"
                  >
                    <Icon className="size-[18px]" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center sm:justify-end">
          <PaymentMethods />
        </div>

        <div className="text-muted-foreground mt-6 flex flex-col items-center gap-2 border-t pt-4 text-xs sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} · Alle rechten voorbehouden</p>
          <p>Veilig betalen · Verzending in België &amp; Nederland</p>
        </div>
      </div>
    </footer>
  );
}
