import { cn } from "@/lib/cn";

type RadioCardProps = Omit<React.ComponentProps<"input">, "type"> & {
  label: string;
  description?: string;
  icon?: React.ReactNode;
};

/** Opción de selección única con apariencia de tarjeta (radio nativo, accesible). */
export function RadioCard({ label, description, icon, className, id, ...props }: RadioCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border border-line-strong bg-surface px-4 py-3 transition-colors hover:border-ink has-checked:border-primary has-checked:ring-1 has-checked:ring-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
        className,
      )}
    >
      <input id={id} type="radio" className="sr-only" {...props} />
      {icon && <span className="text-accent [&_svg]:size-5">{icon}</span>}
      <span className="flex flex-col">
        <span className="text-[0.9375rem] font-medium">{label}</span>
        {description && <span className="text-sm text-ink-muted">{description}</span>}
      </span>
    </label>
  );
}
