"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import {
  leadPropertyRelationLabels,
  LEAD_PROPERTY_RELATIONS,
  type LeadPropertyRelation,
} from "@/features/leads/constants";
import { statusLabels } from "@/features/properties/constants";
import { removeLeadPropertyAction, setLeadPropertyAction } from "../leads/actions";
import { statusTones } from "../properties/labels";
import type { LeadLinkedProperty, LeadPropertyOption } from "../leads/types";

/** Propiedades vinculadas al lead: consultadas, sugeridas, visitadas o descartadas. */
export function LeadProperties({
  leadId,
  linked,
  options,
}: {
  leadId: string;
  linked: LeadLinkedProperty[];
  options: LeadPropertyOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [toAdd, setToAdd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const linkedIds = new Set(linked.map((item) => item.propertyId));
  const available = options.filter((option) => !linkedIds.has(option.id));

  function run(action: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {linked.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin propiedades vinculadas.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {linked.map((item) => (
            <li
              key={item.propertyId}
              className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium tracking-wide text-ink-muted">
                    {item.code}
                  </span>
                  {item.status !== "published" && (
                    <Badge tone={statusTones[item.status]}>{statusLabels[item.status]}</Badge>
                  )}
                </div>
                <Link
                  href={`/admin/propiedades/${item.propertyId}`}
                  className="truncate font-medium hover:underline"
                >
                  {item.title}
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <Select
                  aria-label={`Relación con ${item.code}`}
                  value={item.relation}
                  disabled={pending}
                  onChange={(event) =>
                    run(() =>
                      setLeadPropertyAction(
                        leadId,
                        item.propertyId,
                        event.target.value as LeadPropertyRelation,
                      ),
                    )
                  }
                >
                  {LEAD_PROPERTY_RELATIONS.map((relation) => (
                    <option key={relation} value={relation}>
                      {leadPropertyRelationLabels[relation]}
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Quitar ${item.code}`}
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`¿Quitar ${item.code} de este lead?`)) {
                      run(() => removeLeadPropertyAction(leadId, item.propertyId));
                    }
                  }}
                >
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!toAdd) return;
            run(async () => {
              const result = await setLeadPropertyAction(leadId, toAdd, "suggested");
              if (result.ok) setToAdd("");
              return result;
            });
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="flex-1">
            <Select
              aria-label="Propiedad para sugerir"
              value={toAdd}
              onChange={(event) => setToAdd(event.target.value)}
              disabled={pending}
            >
              <option value="">Sugerir una propiedad…</option>
              {available.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.code} · {option.title}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" size="sm" variant="secondary" disabled={pending || !toAdd}>
            <Plus /> Agregar
          </Button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
