import type { BusinessType, Commune, Feature, PropertyRecord, PropertyType } from "../types";

/**
 * Fuente de datos públicos de propiedades. Entrega solo propiedades
 * publicadas y catálogos; el filtrado, el orden y el mapeo a la interfaz se
 * resuelven en `queries.ts`, igual para cualquier fuente.
 */
export type PropertySource = {
  loadPublishedProperties(): Promise<PropertyRecord[]>;
  loadPropertyTypes(): Promise<PropertyType[]>;
  loadCommunes(): Promise<Commune[]>;
  loadFeatures(): Promise<Feature[]>;
  loadBusinessTypes(): Promise<BusinessType[]>;
};
