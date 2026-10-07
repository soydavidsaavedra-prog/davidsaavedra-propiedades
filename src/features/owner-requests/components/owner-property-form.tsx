"use client";

/* eslint-disable @next/next/no-img-element -- vistas previas locales (blob:), sin optimizar */

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { ArrowRight, CheckCircle2, ImagePlus, MessageCircle, X } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import type { Commune, Feature, PropertyType } from "@/features/properties/types";
import { ACCEPTED_PHOTOS, preparePhoto, UPLOAD_EXTENSIONS } from "@/lib/media/prepare";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";
import { submitPropertyRequestAction } from "../actions";
import type { PropertyRequestErrors } from "../validation";

const MAX_PHOTOS = 10;

type OwnerPropertyFormProps = {
  types: PropertyType[];
  communes: Commune[];
  features: Feature[];
};

type Photo = { file: File; preview: string };

type Done = { firstName: string; whatsappUrl: string | null; failedPhotos: number };

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-5 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <legend className="contents">
        <span className="font-display text-lg font-semibold">{title}</span>
      </legend>
      {hint && <p className="-mt-3 text-sm text-ink-muted">{hint}</p>}
      {children}
    </fieldset>
  );
}

/**
 * "Publica tu propiedad": el propietario envía los datos (y fotos opcionales)
 * de su propiedad. Queda como borrador en el panel para revisarla y publicarla.
 */
export function OwnerPropertyForm({ types, communes, features }: OwnerPropertyFormProps) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<PropertyRequestErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [done, setDone] = useState<Done | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function addPhotos(list: FileList) {
    const room = MAX_PHOTOS - photos.length;
    const added = [...list]
      .slice(0, room)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos([...photos, ...added]);
    if (list.length > room) setMessage(`Puedes enviar hasta ${MAX_PHOTOS} fotos.`);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photos[index]!.preview);
    setPhotos(photos.filter((_, i) => i !== index));
  }

  /** Sube las fotos a la carpeta de la solicitud. Devuelve cuántas fallaron. */
  async function uploadPhotos(propertyId: string): Promise<number> {
    const config = getSupabaseConfig();
    if (!config || photos.length === 0) return photos.length;
    const bucket = createPublicClient(config).storage.from("property-submissions");
    let failed = 0;
    for (const [index, photo] of photos.entries()) {
      setProgress(`Subiendo foto ${index + 1} de ${photos.length}…`);
      try {
        const prepared = await preparePhoto(photo.file);
        const type = prepared.blob.type || photo.file.type;
        const path = `${propertyId}/${crypto.randomUUID()}.${UPLOAD_EXTENSIONS[type]}`;
        const { error } = await bucket.upload(path, prepared.blob, { contentType: type });
        if (error) failed++;
      } catch {
        failed++;
      }
    }
    return failed;
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    startTransition(async () => {
      setProgress("Enviando datos…");
      const result = await submitPropertyRequestAction(formData);
      if (!result.ok) {
        setProgress(null);
        setErrors(result.fieldErrors);
        setMessage(result.message);
        return;
      }
      setErrors({});
      const failedPhotos = await uploadPhotos(result.propertyId);
      setProgress(null);
      setDone({ firstName: result.firstName, whatsappUrl: result.whatsappUrl, failedPhotos });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <CheckCircle2 aria-hidden className="size-8 text-success" />
        <div className="flex flex-col gap-1">
          <p className="font-display text-xl font-semibold">¡Gracias, {done.firstName}!</p>
          <p className="text-ink-soft">
            Recibí los datos de tu propiedad. Los revisaré y te escribiré por WhatsApp para
            coordinar los siguientes pasos.
          </p>
          {done.failedPhotos > 0 && (
            <p className="text-sm font-medium text-warning">
              {done.failedPhotos === 1
                ? "Una foto no se pudo subir."
                : `${done.failedPhotos} fotos no se pudieron subir.`}{" "}
              Puedes enviármelas por WhatsApp.
            </p>
          )}
        </div>
        {done.whatsappUrl && (
          <a
            href={done.whatsappUrl}
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

  const sortedTypes = [...types].sort(
    (a, b) => Number(b.isActive) - Number(a.isActive) || a.sortOrder - b.sortOrder,
  );

  return (
    <form
      onSubmit={submit}
      // Al corregir un campo, su error desaparece.
      onChange={(event) => {
        const target = event.target as EventTarget & { name?: string };
        const name = target.name;
        if (name && errors[name]) setErrors({ ...errors, [name]: undefined });
      }}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* Trampa para bots: oculto para personas y lectores de pantalla. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="propietario-sitio-web">No completar</label>
        <input id="propietario-sitio-web" name="sitio_web" tabIndex={-1} autoComplete="off" />
      </div>

      <Section title="Tus datos">
        <Field id="propietario-nombre" label="Nombre" error={errors.nombre}>
          {(control) => (
            <Input {...control} name="nombre" autoComplete="name" required maxLength={120} />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="propietario-whatsapp" label="WhatsApp" error={errors.whatsapp}>
            {(control) => (
              <Input
                {...control}
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="9 1234 5678"
                required
              />
            )}
          </Field>
          <Field id="propietario-email" label="Correo" error={errors.email} optional>
            {(control) => (
              <Input {...control} name="email" type="email" autoComplete="email" maxLength={254} />
            )}
          </Field>
        </div>
      </Section>

      <Section title="Tu propiedad">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="propietario-tipo" label="Tipo de propiedad" error={errors.tipo}>
            {(control) => (
              <Select {...control} name="tipo" required defaultValue="">
                <option value="">Selecciona</option>
                {sortedTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="propietario-operacion" label="Quiero">
            {(control) => (
              <Select {...control} name="operacion" defaultValue="rent">
                <option value="rent">Arrendarla</option>
                <option value="sale">Venderla</option>
              </Select>
            )}
          </Field>
          <Field id="propietario-comuna" label="Comuna" error={errors.comuna}>
            {(control) => (
              <Select {...control} name="comuna" required defaultValue="">
                <option value="">Selecciona</option>
                {communes.map((commune) => (
                  <option key={commune.id} value={commune.id}>
                    {commune.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="propietario-sector" label="Sector o barrio" error={errors.sector} optional>
            {(control) => <Input {...control} name="sector" maxLength={80} placeholder="Centro" />}
          </Field>
        </div>
        <Field
          id="propietario-direccion"
          label="Dirección"
          hint="Solo la uso para coordinar la visita; no se publica."
          error={errors.direccion}
          optional
        >
          {(control) => (
            <Input {...control} name="direccion" maxLength={200} autoComplete="street-address" />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="propietario-precio"
            label="Precio que esperas (CLP)"
            hint="Mensual si es arriendo."
            error={errors.precio}
            optional
          >
            {(control) => (
              <Input {...control} name="precio" inputMode="numeric" placeholder="450.000" />
            )}
          </Field>
          <Field
            id="propietario-disponible"
            label="Disponible desde"
            error={errors.disponible_desde}
            optional
          >
            {(control) => <Input {...control} name="disponible_desde" type="date" />}
          </Field>
        </div>
      </Section>

      <Section title="Detalles" hint="Completa lo que sepas; lo revisamos juntos después.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            id="propietario-construida"
            label="Superficie construida (m²)"
            error={errors.superficie_construida}
            optional
          >
            {(control) => <Input {...control} name="superficie_construida" inputMode="decimal" />}
          </Field>
          <Field
            id="propietario-terreno"
            label="Superficie de terreno (m²)"
            error={errors.superficie_terreno}
            optional
          >
            {(control) => <Input {...control} name="superficie_terreno" inputMode="decimal" />}
          </Field>
          <Field id="propietario-banos" label="Baños" error={errors.banos} optional>
            {(control) => <Input {...control} name="banos" inputMode="numeric" />}
          </Field>
          <Field
            id="propietario-estacionamientos"
            label="Estacionamientos"
            error={errors.estacionamientos}
            optional
          >
            {(control) => <Input {...control} name="estacionamientos" inputMode="numeric" />}
          </Field>
          <Field
            id="propietario-dormitorios"
            label="Dormitorios"
            error={errors.dormitorios}
            optional
          >
            {(control) => <Input {...control} name="dormitorios" inputMode="numeric" />}
          </Field>
        </div>
        {features.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Características</p>
            <div className="grid gap-x-5 sm:grid-cols-2">
              {features.map((feature) => (
                <Checkbox
                  key={feature.id}
                  id={`propietario-caracteristica-${feature.id}`}
                  name="caracteristicas"
                  value={feature.id}
                  label={feature.label}
                />
              ))}
            </div>
          </div>
        )}
        <Field id="propietario-descripcion" label="Descripción" error={errors.descripcion} optional>
          {(control) => (
            <Textarea
              {...control}
              name="descripcion"
              rows={4}
              maxLength={5000}
              placeholder="Cómo es la propiedad, su estado, qué la hace especial…"
            />
          )}
        </Field>
      </Section>

      <Section
        title="Fotos"
        hint={`Opcional, hasta ${MAX_PHOTOS}. Si no tienes, las tomamos en la visita.`}
      >
        {photos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((photo, index) => (
              <li
                key={photo.preview}
                className="relative aspect-square overflow-hidden rounded-md bg-surface-muted"
              >
                <img src={photo.preview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label={`Quitar foto ${index + 1}`}
                  className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        {photos.length < MAX_PHOTOS && (
          <Button
            variant="secondary"
            className="self-start"
            disabled={pending}
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus /> {photos.length > 0 ? "Agregar más fotos" : "Agregar fotos"}
          </Button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_PHOTOS}
          multiple
          hidden
          onChange={(event) => event.target.files?.length && addPhotos(event.target.files)}
        />
      </Section>

      <Section title="¿Algo más?">
        <Field
          id="propietario-mensaje"
          label="Comentarios para David"
          error={errors.mensaje}
          optional
        >
          {(control) => (
            <Textarea
              {...control}
              name="mensaje"
              rows={3}
              maxLength={2000}
              placeholder="Horarios para visitar, condiciones, dudas…"
            />
          )}
        </Field>
        <div className="flex flex-col gap-1.5">
          <Checkbox
            id="propietario-consentimiento"
            name="consentimiento"
            value="1"
            required
            aria-invalid={errors.consentimiento ? true : undefined}
            label={
              <span>
                Autorizo a {siteConfig.name} a usar mis datos para contactarme sobre mi propiedad,
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
          {errors.consentimiento && (
            <p className="text-sm font-medium text-danger">{errors.consentimiento}</p>
          )}
        </div>
      </Section>

      {message && (
        <p role="alert" className="rounded-lg bg-danger-soft p-4 text-sm font-medium text-danger">
          {message}
        </p>
      )}
      {progress && (
        <p role="status" className="rounded-lg bg-surface-muted p-4 text-sm">
          {progress}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Enviando…" : "Enviar mi propiedad"}
        {!pending && <ArrowRight />}
      </Button>
    </form>
  );
}
