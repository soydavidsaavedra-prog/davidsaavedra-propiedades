import { cn } from "@/lib/cn";

type CheckboxProps = Omit<React.ComponentProps<"input">, "type"> & {
  label: React.ReactNode;
};

/** Casilla nativa con etiqueta clicable y área táctil de 44 px. */
export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn("flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem]", className)}
    >
      <input
        id={id}
        type="checkbox"
        className="size-5 shrink-0 cursor-pointer rounded-sm accent-[var(--color-primary)]"
        {...props}
      />
      {label}
    </label>
  );
}
