"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { leadStatusLabels, LEAD_STATUSES, type LeadStatus } from "@/features/leads/constants";
import { setLeadStatusAction } from "../leads/actions";

/** Cambia la etapa del embudo. Pasar a "Perdido" pide el motivo. */
export function LeadStatusControl({
  id,
  status,
  lostReason,
}: {
  id: string;
  status: LeadStatus;
  lostReason: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [next, setNext] = useState<LeadStatus>(status);
  const [reason, setReason] = useState(lostReason ?? "");
  const [error, setError] = useState<string | null>(null);
  const changed = next !== status || (next === "lost" && reason.trim() !== (lostReason ?? ""));

  function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await setLeadStatusAction(id, next, reason);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Etapa
        <Select
          value={next}
          onChange={(event) => setNext(event.target.value as LeadStatus)}
          disabled={pending}
        >
          {LEAD_STATUSES.map((value) => (
            <option key={value} value={value}>
              {leadStatusLabels[value]}
            </option>
          ))}
        </Select>
      </label>
      {next === "lost" && (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Motivo
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={300}
            placeholder="Ej.: arrendó en otro lugar"
            required
            disabled={pending}
          />
        </label>
      )}
      {changed && (
        <Button type="submit" size="sm" disabled={pending} className="self-start">
          {pending ? "Guardando…" : "Guardar etapa"}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
