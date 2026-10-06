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
import type { BusinessType } from "@/features/properties/types";
import { submitLeadAction, type LeadFormState } from "../actions";
import { BUDGET_RANGES, timeframeOptions } from "../options";

type LeadFormProps = {
  propertyId?: string;
  propertyCode?: string;
  businessTypes: BusinessType[];
};

const initialState: LeadFormState = { status: "idle" };

/**
 * Formulario de interés en dos niveles: lo mínimo para contactar (nombre y
 * WhatsApp) y detalles opcionales de calificación.
 */
export function LeadForm({ propertyId, propertyCode, businessTypes }: LeadFormProps) {
  const [state, formAction, pending] = useActionState(submitLeadAction, initialState);

  // Agrega el origen de la visita (UTM guardado en la sesión) al enviar.
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
            Recibí tu solicitud{propertyCode ? ` por ${propertyCode}` : ""}. Te contactaré por
            WhatsApp para coordinar la visita.
          </p>
        </div>
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
      </div>
    );
  }

  const errors = state.status === "invalid" ? state.fieldErrors : {};
  // React restablece el formulario tras cada envío: se restauran los valores
  // ingresados para que la persona solo corrija lo necesario.
  const values = state.status === "invalid" || state.status === "error" ? state.values : {};
  const hasDetails = Boolean(values.rubro || values.presupuesto || values.plazo || values.mensaje);

  return (
    <form
      // Remonta tras cada intento para aplicar los valores restaurados.
      key={"attempt" in state ? state.attempt : 0}
      action={submitWithOrigin}
      noValidate
      className="flex flex-col gap-5"
    >
      {propertyId && <input type="hidden" name="propiedad" value={propertyId} />}
      {/* Trampa para bots: oculto para personas y lectores de pantalla. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="sitio_web">No completar</label>
        <input id="sitio_web" name="sitio_web" tabIndex={-1} autoComplete="off" />
      </div>

      <Field id="lead-nombre" label="Nombre" error={errors.fullName}>
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
      <Field
        id="lead-whatsapp"
        label="WhatsApp"
        hint="Te escribiré solo para coordinar la visita."
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

      <details
        open={hasDetails || undefined}
        className="group rounded-lg border border-line bg-surface-muted/50 open:bg-transparent"
      >
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[0.9375rem] font-medium [&::-webkit-details-marker]:hidden">
          Cuéntame sobre tu proyecto
          <span className="text-sm font-normal text-ink-muted group-open:hidden">Opcional</span>
        </summary>
        <div className="flex flex-col gap-5 px-4 pt-1 pb-5">
          <Field id="lead-rubro" label="Tipo de negocio" optional>
            {(control) => (
              <Select {...control} name="rubro" defaultValue={values.rubro ?? ""}>
                <option value="">Selecciona</option>
                {businessTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="lead-presupuesto" label="Presupuesto mensual" optional>
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
          <Field id="lead-plazo" label="¿Cuándo te gustaría instalarte?" optional>
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
          <Field id="lead-mensaje" label="Mensaje" optional error={errors.message}>
            {(control) => (
              <Textarea
                {...control}
                name="mensaje"
                rows={3}
                maxLength={2000}
                placeholder="Horarios para visitar, dudas sobre el local…"
                defaultValue={values.mensaje}
              />
            )}
          </Field>
        </div>
      </details>

      <div className="flex flex-col gap-1.5">
        <Checkbox
          id="lead-consentimiento"
          name="consentimiento"
          value="1"
          required
          defaultChecked={values.consentimiento === "1"}
          aria-invalid={errors.consent ? true : undefined}
          aria-describedby={errors.consent ? "lead-consentimiento-error" : undefined}
          label={
            <span>
              Autorizo a {siteConfig.name} a usar mis datos para contactarme sobre esta solicitud,
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
          className="items-start text-sm text-ink-soft [&>input]:mt-0.5"
        />
        {errors.consent && (
          <p id="lead-consentimiento-error" className="text-sm font-medium text-danger">
            {errors.consent}
          </p>
        )}
      </div>

      {state.status === "error" && (
        <div role="alert" className="flex flex-col gap-3 rounded-lg bg-danger-soft p-4 text-sm">
          <p className="text-danger">{state.message}</p>
          <div className="flex flex-wrap gap-2">
            {state.whatsappUrl && (
              <a
                href={state.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ size: "sm" })}
              >
                <MessageCircle /> WhatsApp
              </a>
            )}
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ size: "sm", variant: "secondary" })}
            >
              Instagram {siteConfig.social.handle}
            </a>
          </div>
        </div>
      )}

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Enviando…" : "Quiero visitar esta propiedad"}
        {!pending && <ArrowRight />}
      </Button>
    </form>
  );
}
