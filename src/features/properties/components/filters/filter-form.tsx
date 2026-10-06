import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { formatArea } from "@/lib/format";
import {
  AREA_OPTIONS,
  BATHROOM_OPTIONS,
  SORT_OPTIONS,
  sortLabels,
  type PropertyFilters,
} from "../../filters";
import type { Commune, Feature, PropertyType } from "../../types";
import { CleanGetForm } from "./clean-get-form";

export type FilterOptions = {
  types: PropertyType[];
  communes: Commune[];
  features: Feature[];
};

type FilterFormProps = {
  /** id del formulario; también prefija los campos (hay una instancia por layout). */
  id: string;
  filters: PropertyFilters;
  options: FilterOptions;
  /** En el panel móvil el botón vive en el pie del panel (`form={id}`). */
  showSubmit?: boolean;
};

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-medium">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function FilterForm({ id, filters, options, showSubmit = true }: FilterFormProps) {
  const field = (name: string) => `${id}-${name}`;
  const activeTypes = options.types.filter((type) => type.isActive);
  const activeCommunes = options.communes.filter((commune) => commune.isActive);

  return (
    <CleanGetForm id={id} action="/propiedades" className="flex flex-col gap-6">
      <Field id={field("tipo")} label="Tipo de propiedad">
        {(control) => (
          <Select {...control} name="tipo" defaultValue={filters.type ?? ""}>
            <option value="">Todos</option>
            {activeTypes.map((type) => (
              <option key={type.slug} value={type.slug}>
                {type.namePlural}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field id={field("comuna")} label="Comuna">
        {(control) => (
          <Select {...control} name="comuna" defaultValue={filters.commune ?? ""}>
            <option value="">Todas</option>
            {activeCommunes.map((commune) => (
              <option key={commune.slug} value={commune.slug}>
                {commune.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Fieldset legend="Precio mensual (CLP)">
        <div className="grid grid-cols-2 gap-3">
          <Field id={field("precio_min")} label="Desde">
            {(control) => (
              <Input
                {...control}
                name="precio_min"
                inputMode="numeric"
                placeholder="$300.000"
                defaultValue={filters.priceMin ?? ""}
              />
            )}
          </Field>
          <Field id={field("precio_max")} label="Hasta">
            {(control) => (
              <Input
                {...control}
                name="precio_max"
                inputMode="numeric"
                placeholder="$800.000"
                defaultValue={filters.priceMax ?? ""}
              />
            )}
          </Field>
        </div>
      </Fieldset>

      <div className="grid gap-6">
        <Field id={field("m2_min")} label="Superficie mínima">
          {(control) => (
            <Select {...control} name="m2_min" defaultValue={filters.areaMin ?? ""}>
              <option value="">Cualquiera</option>
              {AREA_OPTIONS.map((area) => (
                <option key={area} value={area}>
                  {formatArea(area)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id={field("banos")} label="Baños">
          {(control) => (
            <Select {...control} name="banos" defaultValue={filters.bathroomsMin ?? ""}>
              <option value="">Cualquiera</option>
              {BATHROOM_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count} o más
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Fieldset legend="Condiciones">
        <div className="-my-1 flex flex-col">
          <Checkbox
            id={field("disponible")}
            name="disponible"
            value="1"
            defaultChecked={filters.availableNow}
            label="Disponible ahora"
          />
          <Checkbox
            id={field("estacionamiento")}
            name="estacionamiento"
            value="1"
            defaultChecked={filters.withParking}
            label="Con estacionamiento"
          />
          {options.features.map((feature) => (
            <Checkbox
              key={feature.key}
              id={field(`caracteristica-${feature.key}`)}
              name="caracteristica"
              value={feature.key}
              defaultChecked={filters.features.includes(feature.key)}
              label={feature.label}
            />
          ))}
        </div>
      </Fieldset>

      <Field id={field("orden")} label="Ordenar por">
        {(control) => (
          <Select
            {...control}
            name="orden"
            defaultValue={filters.sort === "recientes" ? "" : filters.sort}
          >
            {SORT_OPTIONS.map((sort) => (
              <option key={sort} value={sort === "recientes" ? "" : sort}>
                {sortLabels[sort]}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {showSubmit && (
        <Button type="submit" size="lg" fullWidth>
          Aplicar filtros
        </Button>
      )}
    </CleanGetForm>
  );
}
