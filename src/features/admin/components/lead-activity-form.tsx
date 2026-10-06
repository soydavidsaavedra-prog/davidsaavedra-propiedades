"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/input";
import { leadActivityLabels, type LeadActivityType } from "@/features/leads/constants";
import { addLeadActivityAction } from "../leads/actions";

const TYPES: LeadActivityType[] = ["note", "call", "whatsapp", "email", "meeting"];

const placeholders: Record<LeadActivityType, string> = {
  note: "Nota interna sobre el lead",
  call: "¿Qué se habló en la llamada?",
  whatsapp: "Resumen de la conversación por WhatsApp",
  email: "Resumen del correo",
  meeting: "¿Qué se acordó en la reunión?",
  web_inquiry: "",
};

/** Registra una nota o una interacción en el timeline del lead. */
export function LeadActivityForm({ leadId }: { leadId: string }) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<LeadActivityType>("note");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addLeadActivityAction({ leadId, type, body });
      if (result.ok) setBody("");
      else setError(result.message);
    });
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <div role="group" aria-label="Tipo de registro" className="flex flex-wrap gap-2">
        {TYPES.map((value) => (
          <Chip key={value} selected={type === value} onClick={() => setType(value)}>
            {leadActivityLabels[value]}
          </Chip>
        ))}
      </div>
      <Textarea
        aria-label="Detalle"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={4000}
        placeholder={placeholders[type]}
        disabled={pending}
      />
      <Button type="submit" size="sm" disabled={pending || !body.trim()} className="self-start">
        {pending ? "Guardando…" : "Agregar al timeline"}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
