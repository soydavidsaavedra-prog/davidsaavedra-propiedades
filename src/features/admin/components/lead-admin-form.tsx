"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  leadSourceLabels,
  leadTypeLabels,
  LEAD_SOURCES,
  LEAD_TYPES,
  moveTimeframeLabels,
  MOVE_TIMEFRAMES,
} from "@/features/leads/constants";
import { saveLeadAction, type LeadFormState } from "../leads/actions";
import type { LeadPropertyOption } from "../leads/types";

type LeadAdminFormProps = {
  /** Edición: id y valores guardados. Sin esto, es un alta manual. */
  lead?: { id: string; values: Record<string, string> };
  businessTypes: { id: string; name: string }[];
  /** Solo en el alta: propiedad por la que consultó. */
  propertyOptions?: LeadPropertyOption[];
};

const initialState: LeadFormState = { status: "idle" };

const NEW_LEAD_DEFAULTS: Record<string, string> = { tipo: "tenant", origen: "whatsapp" };

export function LeadAdminForm({ lead, businessTypes, propertyOptions }: LeadAdminFormProps) {
  const [state, formAction, pending] = useActionState(saveLeadAction, initialState);
  const failed = state.status === "invalid" || state.status === "error";
  const values = failed ? state.values : (lead?.values ?? NEW_LEAD_DEFAULTS);
  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const value = (name: string) => values[name] ?? "";

  return (
    <form
      key={failed ? state.attempt : "form"}
      action={formAction}
      noValidate
      className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6"
    >
      {lead && <input type="hidden" name="id" value={lead.id} />}

      {state.status === "saved" && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-sm font-medium text-success"
        >
          <CheckCircle2 className="size-4.5" aria-hidden /> Datos guardados.
        </p>
      )}
      {failed && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {state.message}
          {state.duplicateId && (
            <Link href={`/admin/leads/${state.duplicateId}`} className="underline">
              Ver el lead existente
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="lead-nombre" label="Nombre" error={errors.nombre}>
          {(control) => (
            <Input
              {...control}
              name="nombre"
              required
              maxLength={120}
              defaultValue={value("nombre")}
            />
          )}
        </Field>
        <Field id="lead-telefono" label="Teléfono / WhatsApp" error={errors.telefono}>
          {(control) => (
            <Input
              {...control}
              name="telefono"
              type="tel"
              inputMode="tel"
              required
              placeholder="9 1234 5678"
              defaultValue={value("telefono")}
            />
          )}
        </Field>
        <Field id="lead-email" label="Correo" error={errors.email} optional>
          {(control) => (
            <Input
              {...control}
              name="email"
              type="email"
              maxLength={254}
              defaultValue={value("email")}
            />
          )}
        </Field>
        <Field id="lead-tipo" label="Tipo">
          {(control) => (
            <Select {...control} name="tipo" defaultValue={value("tipo")}>
              {LEAD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {leadTypeLabels[type]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="lead-origen" label="Origen">
          {(control) => (
            <Select {...control} name="origen" defaultValue={value("origen")}>
              {LEAD_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {leadSourceLabels[source]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="lead-plazo" label="Plazo" optional>
          {(control) => (
            <Select {...control} name="plazo" defaultValue={value("plazo")}>
              <option value="">Sin definir</option>
              {MOVE_TIMEFRAMES.map((timeframe) => (
                <option key={timeframe} value={timeframe}>
                  {moveTimeframeLabels[timeframe]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="lead-rubro" label="Rubro" optional>
          {(control) => (
            <Select {...control} name="rubro" defaultValue={value("rubro")}>
              <option value="">Sin definir</option>
              {businessTypes.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="lead-rubro-detalle" label="Negocio" error={errors.rubro_detalle} optional>
          {(control) => (
            <Input
              {...control}
              name="rubro_detalle"
              maxLength={200}
              placeholder="Barbería con 2 sillones"
              defaultValue={value("rubro_detalle")}
            />
          )}
        </Field>
        <Field
          id="lead-presupuesto-min"
          label="Presupuesto mínimo (CLP)"
          error={errors.presupuesto_min}
          optional
        >
          {(control) => (
            <Input
              {...control}
              name="presupuesto_min"
              inputMode="numeric"
              defaultValue={value("presupuesto_min")}
            />
          )}
        </Field>
        <Field
          id="lead-presupuesto-max"
          label="Presupuesto máximo (CLP)"
          error={errors.presupuesto_max}
          optional
        >
          {(control) => (
            <Input
              {...control}
              name="presupuesto_max"
              inputMode="numeric"
              defaultValue={value("presupuesto_max")}
            />
          )}
        </Field>
        {propertyOptions && propertyOptions.length > 0 && (
          <Field
            id="lead-propiedad"
            label="Propiedad por la que consultó"
            optional
            className="sm:col-span-2"
          >
            {(control) => (
              <Select {...control} name="propiedad" defaultValue={value("propiedad")}>
                <option value="">Ninguna en particular</option>
                {propertyOptions.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.code} · {property.title}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
      </div>

      <Field id="lead-mensaje" label="Consulta o comentario" error={errors.mensaje} optional>
        {(control) => (
          <Textarea
            {...control}
            name="mensaje"
            rows={3}
            maxLength={2000}
            defaultValue={value("mensaje")}
          />
        )}
      </Field>

      {!lead && (
        <Checkbox
          id="lead-consentimiento"
          name="consentimiento"
          value="1"
          defaultChecked={value("consentimiento") === "1"}
          label="La persona autorizó guardar sus datos para contactarla"
        />
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando…" : lead ? "Guardar datos" : "Crear lead"}
      </Button>
    </form>
  );
}
