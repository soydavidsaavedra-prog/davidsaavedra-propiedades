"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setLeadNextActionAction } from "../leads/actions";

/** ISO → valor de `<input type="datetime-local">` en la zona horaria del navegador. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** Próxima acción del lead (qué hacer y cuándo). */
export function LeadNextAction({
  id,
  nextAction,
  nextActionAt,
}: {
  id: string;
  nextAction: string | null;
  nextActionAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(nextAction ?? "");
  const [when, setWhen] = useState(toLocalInput(nextActionAt));
  const [error, setError] = useState<string | null>(null);
  const changed = text.trim() !== (nextAction ?? "") || when !== toLocalInput(nextActionAt);

  function submit(nextText: string, nextWhen: string) {
    setError(null);
    startTransition(async () => {
      // El navegador interpreta la hora local; al servidor viaja en ISO (UTC).
      const at = nextWhen ? new Date(nextWhen).toISOString() : null;
      const result = await setLeadNextActionAction(id, nextText, at);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(text, when);
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Qué hacer
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={200}
          placeholder="Ej.: llamar para agendar visita"
          disabled={pending}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Cuándo
        <Input
          type="datetime-local"
          value={when}
          onChange={(event) => setWhen(event.target.value)}
          disabled={pending}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {changed && (
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        )}
        {nextAction && !changed && (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setText("");
              setWhen("");
              submit("", "");
            }}
          >
            Marcar como hecha
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
