import { cn } from "@/lib/cn";

type DividerProps = {
  /**
   * `line`: línea fina neutra.
   * `accent`: trazo corto champagne (inicio de sección).
   * `cut`: línea con un rombo a 45° al centro (cierre de bloque de marca).
   */
  variant?: "line" | "accent" | "cut";
  className?: string;
};

export function Divider({ variant = "line", className }: DividerProps) {
  if (variant === "accent") {
    return <span aria-hidden className={cn("block h-px w-12 bg-accent-line", className)} />;
  }

  if (variant === "cut") {
    return (
      <div aria-hidden className={cn("flex items-center gap-3", className)}>
        <span className="h-px flex-1 bg-line" />
        <span className="size-2 rotate-45 border border-accent-line" />
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }

  return <hr className={cn("border-0 border-t border-line", className)} />;
}
