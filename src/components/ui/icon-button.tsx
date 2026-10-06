import { cn } from "@/lib/cn";

type IconButtonProps = Omit<React.ComponentProps<"button">, "aria-label"> & {
  /** Obligatorio: un botón solo con ícono necesita nombre accesible. */
  label: string;
  variant?: "ghost" | "secondary" | "overlay";
};

const variants = {
  ghost: "text-ink hover:bg-surface-muted",
  secondary: "border border-outline text-ink hover:border-ink",
  overlay: "bg-white/90 text-ink shadow-soft backdrop-blur hover:bg-white",
} as const;

export function IconButton({
  label,
  variant = "ghost",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
