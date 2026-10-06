import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

// 16px de tamaño de texto: evita el zoom automático de iOS al enfocar.
const control =
  "w-full rounded-md border border-line-strong bg-surface text-base text-ink placeholder:text-ink-muted transition-colors duration-150 hover:border-ink-muted focus-visible:border-ink focus-visible:outline-1 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus-visible:outline-danger";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, "h-12 px-3.5", className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: React.ComponentProps<"textarea">) {
  return <textarea rows={rows} className={cn(control, "px-3.5 py-3", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(control, "h-12 appearance-none pr-10 pl-3.5", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}
