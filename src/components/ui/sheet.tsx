"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { IconButton } from "./icon-button";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Panel modal sobre `<dialog>` nativo: foco atrapado, Escape y capa de fondo
 * sin dependencias. En móvil aparece desde abajo; en desktop, centrado.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clic en la capa de fondo (fuera del contenido) cierra el panel.
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-xl bg-surface p-0 text-ink shadow-raised backdrop:bg-ink/40 sm:m-auto sm:max-w-lg sm:rounded-xl"
    >
      <div className="flex max-h-[90dvh] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line py-2 pr-2 pl-5">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <IconButton label="Cerrar" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
