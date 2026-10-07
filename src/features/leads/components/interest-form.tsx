"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { readStoredUtm } from "@/components/analytics/utm-capture";
import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import type { BusinessType, Commune, PropertyType } from "@/features/properties/types";
import { submitLeadAction, type LeadFormState } from "../actions";
import { BUDGET_RANGES, timeframeOptions } from "../options";

type InterestFormProps = {
  types: PropertyType[];
  communes: Commune[];
  businessTypes: BusinessType[];
};

const initialState: LeadFormState = { status: "idle" };

/**
 * "Busco propiedad": formulario para compartir por enlace con clientes
 * interesados. Registra el lead con sus preferencias de búsqueda; en el panel
 * queda por revisar.
 */
export function InterestForm({ types, communes, businessTypes }: InterestFormProps) {
  const [state, formAction, pending] = useActionState(submitLeadAction, initialState);

  const submitWithOrigin = (formData: FormData) => {
    for (const [key, value] of Object.entries(readStoredUtm())) {
      if (value) formData.set(key, value);
    }
    formAction(formData);
  };

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <CheckCircle2 aria-hidden className="size-8 text-success" />
        <div className="flex flex-col gap-1">
          <p className="font-display text-xl font-semibold">
            {state.firstName ? `¡Gracias, ${state.firstName}!` : "¡Gracias!"}
          </p>
          <p className="text-ink-soft">
            Recibí lo que buscas. Te escribiré por WhatsApp con las opciones que se ajusten.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {state.whatsappUrl && (
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ size: "lg" })}
            >
              <MessageCircle /> Continuar por WhatsApp
            </a>
          )}
          <Link href="/propiedades" className={buttonStyles({ size: "lg", variant: "secondary" })}>
            Ver propiedades
          </Link>
        </div>
      </div>
    );
  }

  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const values = state.status === "invalid" || state.status === "error" ? state.values : {};
  const sortedTypes = [...types].sort(
    (a, b) => Number(b.isActive) - Number(a.isActive) || a.sortOrder - b.sortOrder,
  );

  return (
    <form
      key={"attempt" in state ? state.attempt : 0}
      action={submitWithOrigin}
      noValidate
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="tipo_cliente" value="tenant" />
      {/* Trampa para bots: oculto para personas y lectores de pantalla. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="interes-sitio-web">No completar</label>
        <input id="interes-sitio-web" name="sitio_web" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-4 font-display text-lg font-semibold">Tus datos</legend>
        <Field id="interes-nombre" label="Nombre" error={errors.fullName}>
          {(control) => (
            <Input
              {...control}
              name="nombre"
              autoComplete="name"
              required
              maxLength={120}
              defaultValue={values.nombre}
            />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="interes-whatsapp"
            label="WhatsApp"
            hint="Te responderé por este medio."
            error={errors.phone}
          >
            {(control) => (
              <Input
                {...control}
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="9 1234 5678"
                required
                defaultValue={values.whatsapp}
              />
            )}
          </Field>
          <Field id="interes-email" label="Correo" error={errors.email} optional>
            {(control) => (
              <Input
                {...control}
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                defaultValue={values.email}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 border-t border-line pt-6">
        <legend className="mb-4 font-display text-lg font-semibold">Lo que buscas</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="interes-tipo" label="Tipo de propiedad" optional>
            {(control) => (
              <Select {...control} name="tipo_buscado" defaultValue={values.tipo_buscado ?? ""}>
                <option value="">Cualquiera</option>
                {sortedTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="interes-comuna" label="Comuna" optional>
            {(control) => (
              <Select {...control} name="comuna_buscada" defaultValue={values.comuna_buscada ?? ""}>
                <option value="">Cualquiera</option>
                {communes.map((commune) => (
                  <option key={commune.id} value={commune.id}>
                    {commune.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="interes-presupuesto" label="Presupuesto mensual" optional>
            {(control) => (
              <Select {...control} name="presupuesto" defaultValue={values.presupuesto ?? ""}>
                <option value="">Selecciona un rango</option>
                {BUDGET_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            id="interes-superficie"
            label="Superficie mínima (m²)"
            error={errors.area}
            optional
          >
            {(control) => (
              <Input
                {...control}
                name="superficie_min"
                inputMode="decimal"
                placeholder="60"
                defaultValue={values.superficie_min}
              />
            )}
          </Field>
          <Field id="interes-rubro" label="Si es para un negocio, ¿de qué rubro?" optional>
            {(control) => (
              <Select {...control} name="rubro" defaultValue={values.rubro ?? ""}>
                <option value="">No aplica / prefiero no decir</option>
                {businessTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="interes-plazo" label="¿Para cuándo la necesitas?" optional>
            {(control) => (
              <Select {...control} name="plazo" defaultValue={values.plazo ?? ""}>
                <option value="">Selecciona</option>
                {timeframeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field id="interes-mensaje" label="Algo más que deba saber" error={errors.message} optional>
          {(control) => (
            <Textarea
              {...control}
              name="mensaje"
              rows={3}
              maxLength={2000}
              placeholder="Vitrina a la calle, estacionamiento, cerca de la plaza…"
              defaultValue={values.mensaje}
            />
          )}
        </Field>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Checkbox
          id="interes-consentimiento"
          name="consentimiento"
          value="1"
          required
          defaultChecked={values.consentimiento === "1"}
          aria-invalid={errors.consent ? true : undefined}
          label={
            <span>
              Autorizo a {siteConfig.name} a usar mis datos para contactarme sobre esta búsqueda,
              según la{" "}
              <Link
                href="/privacidad"
                target="_blank"
                className="font-medium text-ink underline underline-offset-4"
              >
                política de privacidad
              </Link>
              .
            </span>
          }
        />
        {errors.consent && <p className="text-sm font-medium text-danger">{errors.consent}</p>}
      </div>

      {state.status === "error" && (
        <p role="alert" className="rounded-lg bg-danger-soft p-4 text-sm text-danger">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Enviando…" : "Enviar lo que busco"}
        {!pending && <ArrowRight />}
      </Button>
    </form>
  );
}
