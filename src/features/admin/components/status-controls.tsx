"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PropertyStatus } from "@/features/properties/constants";
import { deletePropertyAction, setPropertyStatusAction } from "../properties/actions";

/** Publicar, volver a borrador, archivar o eliminar una propiedad. */
export function StatusControls({ id, status }: { id: string; status: PropertyStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: PropertyStatus) {
    setError(null);
    startTransition(async () => {
      const result = await setPropertyStatusAction(id, next);
      if (!result.ok) setError(result.message);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("¿Eliminar esta propiedad con sus fotos? No se puede deshacer.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePropertyAction(id);
      if (result && !result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {status !== "published" && (
          <Button size="sm" disabled={pending} onClick={() => change("published")}>
            <Eye /> Publicar
          </Button>
        )}
        {status === "published" && (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => change("draft")}>
            <EyeOff /> Pasar a borrador
          </Button>
        )}
        {status !== "archived" && (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => change("archived")}
          >
            <Archive /> Archivar
          </Button>
        )}
        {status !== "published" && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={remove}
            className="text-danger"
          >
            <Trash2 /> Eliminar
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
