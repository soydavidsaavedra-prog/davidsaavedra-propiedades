import { cn } from "@/lib/cn";

type ChipProps = Omit<React.ComponentProps<"button">, "aria-pressed"> & {
  selected?: boolean;
};

/** Opción seleccionable (filtros, intenciones). El estado lo controla el padre. */
export function Chip({ selected = false, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        selected
          ? "border-ink bg-ink text-white"
          : "border-line-strong bg-surface text-ink hover:border-ink",
        className,
      )}
      {...props}
    />
  );
}
