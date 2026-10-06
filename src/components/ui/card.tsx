import { cn } from "@/lib/cn";

type CardProps = React.ComponentProps<"div"> & {
  /** Agrega estado hover para tarjetas que actúan como enlace. */
  interactive?: boolean;
};

export function Card({ interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-surface",
        interactive &&
          "transition-shadow duration-200 ease-out-soft focus-within:shadow-raised hover:shadow-raised",
        className,
      )}
      {...props}
    />
  );
}
