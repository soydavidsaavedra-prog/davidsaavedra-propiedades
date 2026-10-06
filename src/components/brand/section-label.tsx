import { cn } from "@/lib/cn";

type SectionLabelProps = {
  children: React.ReactNode;
  /** `center`: línea a ambos lados, como "—— PROPIEDADES ——" del logotipo. */
  align?: "start" | "center";
  className?: string;
};

export function SectionLabel({ children, align = "start", className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[0.6875rem] font-medium tracking-brand text-accent uppercase",
        align === "center" && "justify-center",
        className,
      )}
    >
      {align === "center" && <span aria-hidden className="h-px w-10 bg-accent-line" />}
      <span>{children}</span>
      <span aria-hidden className="h-px w-10 bg-accent-line" />
    </p>
  );
}
