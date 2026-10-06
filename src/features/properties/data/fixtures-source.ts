import {
  businessTypesFixture,
  communesFixture,
  featuresFixture,
  propertiesFixture,
  propertyTypesFixture,
} from "../fixtures";
import type { PropertySource } from "./source";

/** Datos de ejemplo locales (desarrollo sin base de datos). */
export const fixturesSource: PropertySource = {
  loadPublishedProperties: async () => propertiesFixture.filter((p) => p.status === "published"),
  loadPropertyTypes: async () => propertyTypesFixture,
  loadCommunes: async () => communesFixture,
  loadFeatures: async () => featuresFixture,
  loadBusinessTypes: async () => businessTypesFixture,
};
