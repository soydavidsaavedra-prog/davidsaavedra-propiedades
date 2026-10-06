import { cn } from "@/lib/cn";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-strong px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-ink-soft [&_svg]:size-6">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
