import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.15em] [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-contrast hover:bg-primary-hover active:bg-primary-hover",
  secondary:
    "border border-outline bg-transparent text-ink hover:border-ink active:bg-surface-muted",
  ghost: "text-ink hover:bg-surface-muted active:bg-surface-muted",
};

// Altura mínima de 44px desde `md` para garantizar un área táctil cómoda.
const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-md px-3.5 text-sm",
  md: "h-11 rounded-md px-5 text-[0.9375rem]",
  lg: "h-13 rounded-lg px-6 text-base",
};

/** Estilos de botón reutilizables también en enlaces (`<Link className={buttonStyles()}>`). */
export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: ButtonStyleOptions = {}): string {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full");
}

type ButtonProps = React.ComponentProps<"button"> & ButtonStyleOptions;

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}
