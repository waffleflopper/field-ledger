import type { LucideIcon } from "lucide-react";

type PlaceholderPageProps = {
  description: string;
  icon: LucideIcon;
  sections: string[];
  title: string;
};

export function PlaceholderPage({
  description,
  icon: Icon,
  sections,
  title,
}: PlaceholderPageProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Not yet implemented
          </p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            {title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((section, index) => (
          <div
            className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-card-foreground"
            key={`${section}-${index}`}
          >
            {section}
          </div>
        ))}
      </div>
    </section>
  );
}
