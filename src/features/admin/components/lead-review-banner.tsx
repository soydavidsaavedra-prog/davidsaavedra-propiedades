"use client";

import { useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteLeadAction, keepLeadAction } from "../leads/actions";

/**
 * Lead que llegó por un formulario: el administrador decide si lo mantiene
 * en el CRM o lo descarta (se elimina con su historial).
 */
export function LeadReviewBanner({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; message?: string } | void>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result && !result.ok) setError(result.message ?? "No se pudo guardar.");
    });
  }

  return (
    <div
      role="region"
      aria-label="Revisión del lead"
      className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold text-warning">Lead por revisar</p>
        <p className="text-sm text-ink-soft">
          Llegó por un formulario. ¿Lo mantienes en el CRM o lo descartas?
        </p>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(() => keepLeadAction(id))}>
          <Check /> Mantener
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          className="text-danger"
          onClick={() => {
            if (confirm(`¿Descartar a ${name}? Se elimina con todo su historial.`)) {
              run(() => deleteLeadAction(id));
            }
          }}
        >
          <Trash2 /> Descartar
        </Button>
      </div>
    </div>
  );
}
