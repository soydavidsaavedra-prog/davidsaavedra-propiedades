"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteLeadAction } from "../leads/actions";

/** Elimina el lead y todo su historial, tras confirmar. */
export function DeleteLeadButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    if (!confirm(`¿Eliminar a ${name} y todo su historial? No se puede deshacer.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteLeadAction(id);
      if (result && !result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" disabled={pending} onClick={remove} className="text-danger">
        <Trash2 /> {pending ? "Eliminando…" : "Eliminar lead"}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
