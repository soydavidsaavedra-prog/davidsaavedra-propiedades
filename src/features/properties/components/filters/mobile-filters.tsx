"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

type MobileFiltersProps = {
  formId: string;
  activeCount: number;
  /** El formulario (renderizado en el servidor). */
  children: React.ReactNode;
};

/**
 * Botón + panel inferior de filtros (móvil). El padre lo monta con una `key`
 * por búsqueda, así el panel se cierra al aplicar filtros.
 */
export function MobileFilters({ formId, activeCount, children }: MobileFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <SlidersHorizontal />
        Filtros
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-contrast tabular-nums">
            {activeCount}
          </span>
        )}
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filtros"
        footer={
          <Button type="submit" form={formId} size="lg" fullWidth>
            Ver resultados
          </Button>
        }
      >
        {children}
      </Sheet>
    </>
  );
}
