"use client";

import { useActionState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  availabilityLabels,
  operationLabels,
  PROPERTY_AVAILABILITIES,
  PROPERTY_OPERATIONS,
} from "@/features/properties/constants";
import { cn } from "@/lib/cn";
import { savePropertyAction, type PropertyFormState } from "../properties/actions";
import { toFormValues } from "../properties/form";
import type { AdminPropertyDetail, PropertyFormOptions } from "../properties/types";

type PropertyFormProps = {
  property?: AdminPropertyDetail;
  options: PropertyFormOptions;
};

const initialState: PropertyFormState = { status: "idle" };

const NEW_PROPERTY_DEFAULTS: Record<string, string | string[]> = {
  operacion: "rent",
  disponibilidad: "available",
  moneda: "CLP",
  precision_ubicacion: "approximate",
  caracteristicas: [],
  usos: [],
};

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <legend className="contents">
        <span className="flex items-center gap-2 text-lg font-semibold [&_svg]:size-4.5 [&_svg]:text-accent">
          {icon}
          {title}
        </span>
      </legend>
      {description && <p className="-mt-3 text-sm text-ink-muted">{description}</p>}
      {children}
    </fieldset>
  );
}

function Grid({ children, columns = 2 }: { children: React.ReactNode; columns?: 2 | 3 }) {
  return (
    <div className={cn("grid gap-5", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {children}
    </div>
  );
}

/** Campo de texto de una línea con su etiqueta y error. */
function TextField({
  name,
  label,
  hint,
  error,
  optional = true,
  className,
  ...inputProps
}: Omit<React.ComponentProps<"input">, "name"> & {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
}) {
  return (
    <Field
      id={`p-${name}`}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      {(control) => <Input {...control} name={name} {...inputProps} />}
    </Field>
  );
}

export function PropertyForm({ property, options }: PropertyFormProps) {
  const [state, formAction, pending] = useActionState(savePropertyAction, initialState);

  // Tras un error se restauran los valores enviados; si no, los guardados.
  const values =
    state.status === "invalid" || state.status === "error"
      ? state.values
      : property
        ? toFormValues(property)
        : NEW_PROPERTY_DEFAULTS;
  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const text = (name: string) => {
    const value = values[name];
    return typeof value === "string" ? value : "";
  };
  const list = (name: string) => {
    const value = values[name];
    return Array.isArray(value) ? value : [];
  };

  /** Nombre, valor inicial y error de un campo. */
  const bind = (name: string) => ({ name, defaultValue: text(name), error: errors[name] });

  return (
    <form
      key={"attempt" in state ? state.attempt : (property?.updatedAt ?? "new")}
      action={formAction}
      noValidate
      className="flex flex-col gap-6"
    >
      {property && <input type="hidden" name="id" value={property.id} />}

      {state.status === "saved" && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-sm font-medium text-success"
        >
          <CheckCircle2 className="size-4.5" aria-hidden /> Cambios guardados.
        </p>
      )}
      {(state.status === "invalid" || state.status === "error") && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {state.message}
        </p>
      )}

      <Section title="Publicación" description="Lo que ve el público en el listado y la ficha.">
        <TextField
          {...bind("titulo")}
          label="Título"
          optional={false}
          required
          maxLength={120}
          placeholder="Local comercial con vitrina en el centro de La Ligua"
        />
        <TextField
          {...bind("slug")}
          label="Dirección web (slug)"
          hint={
            property
              ? `davidsaavedra.cl/propiedades/${property.slug}. Cambiarla en una propiedad publicada rompe los enlaces ya compartidos.`
              : "Se genera a partir del título si la dejas vacía."
          }
          maxLength={80}
          autoCapitalize="none"
          spellCheck={false}
        />
        <Field
          id="p-resumen"
          label="Resumen"
          hint="Una frase para las tarjetas del listado (máx. 280 caracteres)."
          error={errors.resumen}
          optional
        >
          {(control) => (
            <Textarea
              {...control}
              name="resumen"
              rows={2}
              maxLength={280}
              defaultValue={text("resumen")}
            />
          )}
        </Field>
        <Field id="p-descripcion" label="Descripción" error={errors.descripcion} optional>
          {(control) => (
            <Textarea
              {...control}
              name="descripcion"
              rows={7}
              maxLength={5000}
              defaultValue={text("descripcion")}
            />
          )}
        </Field>
      </Section>

      <Section title="Tipo y disponibilidad">
        <Grid>
          <Field id="p-tipo" label="Tipo de propiedad" error={errors.tipo}>
            {(control) => (
              <Select {...control} name="tipo" required defaultValue={text("tipo")}>
                <option value="">Selecciona</option>
                {options.types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                    {type.isActive ? "" : " (próximamente en el sitio)"}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="p-operacion" label="Operación">
            {(control) => (
              <Select {...control} name="operacion" defaultValue={text("operacion")}>
                {PROPERTY_OPERATIONS.map((operation) => (
                  <option key={operation} value={operation}>
                    {operationLabels[operation]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="p-disponibilidad" label="Disponibilidad">
            {(control) => (
              <Select {...control} name="disponibilidad" defaultValue={text("disponibilidad")}>
                {PROPERTY_AVAILABILITIES.map((availability) => (
                  <option key={availability} value={availability}>
                    {availabilityLabels[availability]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <TextField
            {...bind("disponible_desde")}
            label="Disponible desde"
            type="date"
            hint="Vacío = disponibilidad inmediata."
          />
        </Grid>
      </Section>

      <Section title="Precio y condiciones" description="Montos en pesos, sin signo (ej. 450.000).">
        <Grid columns={3}>
          <TextField
            {...bind("precio")}
            label="Precio mensual"
            inputMode="decimal"
            hint="Vacío = precio a consultar. Decimales con coma."
          />
          <Field id="p-moneda" label="Moneda">
            {(control) => (
              <Select {...control} name="moneda" defaultValue={text("moneda")}>
                <option value="CLP">Pesos (CLP)</option>
                <option value="UF">UF</option>
              </Select>
            )}
          </Field>
          <TextField {...bind("gastos_comunes")} label="Gastos comunes (CLP)" inputMode="numeric" />
          <TextField {...bind("garantia_meses")} label="Garantía (meses)" inputMode="decimal" />
          <TextField
            {...bind("plazo_minimo_meses")}
            label="Contrato mínimo (meses)"
            inputMode="numeric"
          />
        </Grid>
      </Section>

      <Section title="Superficie y espacios">
        <Grid columns={3}>
          <TextField
            {...bind("superficie_construida")}
            label="Superficie construida (m²)"
            inputMode="decimal"
          />
          <TextField
            {...bind("superficie_terreno")}
            label="Superficie de terreno (m²)"
            inputMode="decimal"
          />
          <TextField {...bind("banos")} label="Baños" inputMode="numeric" />
          <TextField {...bind("estacionamientos")} label="Estacionamientos" inputMode="numeric" />
          <TextField {...bind("dormitorios")} label="Dormitorios" inputMode="numeric" />
        </Grid>
        {options.features.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Características</p>
            <div className="grid gap-x-5 sm:grid-cols-2">
              {options.features.map((feature) => (
                <Checkbox
                  key={feature.id}
                  id={`p-caracteristica-${feature.id}`}
                  name="caracteristicas"
                  value={feature.id}
                  defaultChecked={list("caracteristicas").includes(feature.id)}
                  label={feature.label}
                />
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Usos recomendados"
        description="Rubros para los que el local es apto. Solo los marcados se muestran en la ficha."
      >
        <div className="grid gap-x-5 sm:grid-cols-2">
          {options.businessTypes.map((business) => (
            <Checkbox
              key={business.id}
              id={`p-uso-${business.id}`}
              name="usos"
              value={business.id}
              defaultChecked={list("usos").includes(business.id)}
              label={business.name}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Ubicación pública"
        description="La dirección exacta va en los datos internos y nunca se publica."
      >
        <Grid>
          <Field id="p-comuna" label="Comuna" error={errors.comuna}>
            {(control) => (
              <Select {...control} name="comuna" required defaultValue={text("comuna")}>
                <option value="">Selecciona</option>
                {options.communes.map((commune) => (
                  <option key={commune.id} value={commune.id}>
                    {commune.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <TextField
            {...bind("sector")}
            label="Sector o barrio"
            maxLength={80}
            placeholder="Centro"
          />
          <TextField
            {...bind("latitud")}
            label="Latitud"
            inputMode="decimal"
            placeholder="-32.4521"
            hint="Desde Google Maps: clic derecho sobre el punto."
          />
          <TextField
            {...bind("longitud")}
            label="Longitud"
            inputMode="decimal"
            placeholder="-71.2310"
          />
          <Field id="p-precision" label="Precisión del mapa">
            {(control) => (
              <Select
                {...control}
                name="precision_ubicacion"
                defaultValue={text("precision_ubicacion")}
              >
                <option value="approximate">Aproximada (recomendada)</option>
                <option value="exact">Exacta</option>
              </Select>
            )}
          </Field>
        </Grid>
      </Section>

      <Section
        title="Datos internos"
        description="Solo visibles en este panel."
        icon={<Lock aria-hidden />}
      >
        <Grid>
          <TextField {...bind("direccion")} label="Dirección exacta" maxLength={200} />
          <TextField {...bind("unidad")} label="Local / unidad" maxLength={50} />
          <TextField {...bind("llaves")} label="Ubicación de llaves" maxLength={200} />
        </Grid>
        <Field id="p-comision" label="Condiciones de comisión" error={errors.comision} optional>
          {(control) => (
            <Textarea {...control} name="comision" rows={2} defaultValue={text("comision")} />
          )}
        </Field>
        <Field id="p-notas" label="Notas internas" error={errors.notas_internas} optional>
          {(control) => (
            <Textarea
              {...control}
              name="notas_internas"
              rows={3}
              defaultValue={text("notas_internas")}
            />
          )}
        </Field>
      </Section>

      <Section title="Destacada y SEO">
        <Grid>
          <Checkbox
            id="p-destacada"
            name="destacada"
            value="1"
            defaultChecked={text("destacada") === "1"}
            label="Destacar en el inicio y primero en el listado"
          />
          <TextField
            {...bind("orden_destacada")}
            label="Orden entre destacadas"
            inputMode="numeric"
            hint="1 = primera."
          />
          <TextField
            {...bind("seo_titulo")}
            label="Título para Google"
            maxLength={70}
            hint="Vacío = se genera desde el tipo, la comuna y la superficie."
          />
          <TextField {...bind("seo_descripcion")} label="Descripción para Google" maxLength={170} />
        </Grid>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : property ? "Guardar cambios" : "Crear borrador"}
        </Button>
      </div>
    </form>
  );
}
