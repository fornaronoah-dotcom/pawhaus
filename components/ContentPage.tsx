export type ContentSection = {
  heading?: string;
  paragraphs: string[];
};

export function ContentPage({
  title,
  intro,
  sections,
  updated,
}: {
  title: string;
  intro?: string;
  sections: ContentSection[];
  updated?: string;
}) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        {updated && (
          <p className="text-muted-foreground mt-2 text-sm">
            Laatst bijgewerkt: {updated}
          </p>
        )}
        {intro && (
          <p className="text-muted-foreground mt-6 leading-relaxed">{intro}</p>
        )}
      </div>
      <div className="mt-8 space-y-8">
        {sections.map((section, i) => (
          <section key={i} className="space-y-3">
            {section.heading && (
              <h2 className="text-lg font-medium">{section.heading}</h2>
            )}
            {section.paragraphs.map((p, j) => (
              <p key={j} className="text-muted-foreground leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
