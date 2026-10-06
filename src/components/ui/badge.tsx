import { cn } from "@/lib/cn";

export type BadgeTone =
  "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "overlay";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-ink-soft",
  brand: "bg-primary text-primary-contrast",
  // Contorno fino de marca (como la pastilla del banner).
  accent: "border border-accent-line text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  // Para usar sobre fotografías.
  overlay: "bg-white/90 text-ink shadow-soft backdrop-blur",
};

type BadgeProps = React.ComponentProps<"span"> & {
  tone?: BadgeTone;
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium [&_svg]:size-3.5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
