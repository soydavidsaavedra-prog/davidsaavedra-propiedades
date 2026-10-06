"use client";

import { useState } from "react";
import { ChevronRight, House, Store, Trees } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

const intents = [
  { key: "local", label: "Un local para mi negocio", icon: Store, enabled: true },
  { key: "vivienda", label: "Una propiedad para vivir", icon: House, enabled: false },
  { key: "terreno", label: "Un terreno", icon: Trees, enabled: false },
];

/** Selector de intención del hero (ejemplo; la Home definitiva se construye después). */
export function IntentDemo() {
  return (
    <ul className="grid max-w-lg gap-2.5">
      {intents.map(({ key, label, icon: Icon, enabled }) => (
        <li key={key}>
          <button
            type="button"
            disabled={!enabled}
            className={cn(
              "flex min-h-16 w-full items-center gap-3 rounded-lg border px-4 text-left transition-colors duration-150",
              enabled
                ? "border-outline bg-surface/60 hover:border-ink"
                : "cursor-not-allowed border-line text-ink-muted",
            )}
          >
            <Icon aria-hidden className={cn("size-5 shrink-0", enabled && "text-accent")} />
            <span className="flex-1 text-[0.9375rem] font-medium">{label}</span>
            {enabled ? (
              <ChevronRight aria-hidden className="size-4 text-ink-muted" />
            ) : (
              <Badge>Próximamente</Badge>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

const filters = ["Con estacionamiento", "Con baño", "Vitrina a la calle", "Disponible ya"];

export function ChipsDemo() {
  const [selected, setSelected] = useState<string[]>(["Con baño"]);
  const toggle = (value: string) =>
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Chip key={filter} selected={selected.includes(filter)} onClick={() => toggle(filter)}>
          {filter}
        </Chip>
      ))}
    </div>
  );
}

export function FormDemo() {
  return (
    <form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
      <Field id="demo-name" label="Nombre">
        {(control) => <Input {...control} autoComplete="name" placeholder="Tu nombre" />}
      </Field>
      <Field
        id="demo-phone"
        label="WhatsApp"
        hint="Te escribiremos solo para coordinar la visita."
        error="Ingresa un número válido, por ejemplo +56 9 1234 5678."
      >
        {(control) => (
          <Input {...control} type="tel" inputMode="tel" autoComplete="tel" defaultValue="9 12" />
        )}
      </Field>
      <Field id="demo-budget" label="Presupuesto mensual" optional>
        {(control) => (
          <Select {...control} defaultValue="">
            <option value="" disabled>
              Selecciona un rango
            </option>
            <option>Hasta $400.000</option>
            <option>$400.000 – $600.000</option>
            <option>Más de $600.000</option>
          </Select>
        )}
      </Field>
      <Field id="demo-message" label="Mensaje" optional>
        {(control) => <Textarea {...control} placeholder="Cuéntanos sobre tu proyecto" />}
      </Field>
      <Button type="submit" size="lg" fullWidth>
        Quiero visitar esta propiedad
      </Button>
    </form>
  );
}

export function SheetDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Abrir filtros
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filtros"
        footer={
          <Button size="lg" fullWidth onClick={() => setOpen(false)}>
            Ver 4 locales
          </Button>
        }
      >
        <div className="grid gap-5">
          <Field id="sheet-commune" label="Comuna">
            {(control) => (
              <Select {...control} defaultValue="la-ligua">
                <option value="la-ligua">La Ligua</option>
              </Select>
            )}
          </Field>
          <Field id="sheet-max" label="Precio máximo" optional>
            {(control) => <Input {...control} inputMode="numeric" placeholder="$600.000" />}
          </Field>
          <ChipsDemo />
        </div>
      </Sheet>
    </>
  );
}
