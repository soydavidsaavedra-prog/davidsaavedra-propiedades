"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ImagePlus, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { formatPhone } from "@/lib/phone";
import { whatsappUrl } from "@/lib/whatsapp";
import { markPropertyReviewedAction, type ActionResult } from "../properties/actions";
import { importSubmissionPhotosAction } from "../properties/media-actions";
import type { AdminPropertyOwner, SubmissionPhoto } from "../properties/types";

type OwnerRequestPanelProps = {
  propertyId: string;
  code: string;
  owners: AdminPropertyOwner[];
  /** Solicitud enviada por el propietario y aún sin revisar. */
  pendingReview: boolean;
  photos: SubmissionPhoto[];
};

/**
 * Propietario de la propiedad y, si llegó por el formulario, la revisión de
 * la solicitud: fotos enviadas (privadas hasta agregarlas a la galería) y
 * marcarla como revisada.
 */
export function OwnerRequestPanel({
  propertyId,
  code,
  owners,
  pendingReview,
  photos,
}: OwnerRequestPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message);
      router.refresh();
    });
  }

  const importPhotos = (names: string[]) =>
    run(() => importSubmissionPhotosAction(propertyId, names));

  return (
    <section
      aria-labelledby="owner-title"
      className={
        pendingReview
          ? "flex flex-col gap-5 rounded-xl border border-warning/40 bg-warning-soft/60 p-5 sm:p-6"
          : "flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="owner-title" className="flex items-center gap-2 text-lg font-semibold">
            <UserRound className="size-4.5 text-accent" aria-hidden />
            {pendingReview ? "Solicitud del propietario" : "Propietario"}
          </h2>
          {pendingReview && (
            <p className="text-sm text-ink-soft">
              Llegó por el formulario «Publica tu propiedad». Revisa los datos, agrega las fotos y
              publícala cuando esté lista. Publicarla la marca como revisada.
            </p>
          )}
        </div>
        {pendingReview && (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => markPropertyReviewedAction(propertyId))}
          >
            <Check /> Marcar como revisada
          </Button>
        )}
      </div>

      {owners.map((owner) => (
        <div key={owner.id} className="flex flex-col gap-2">
          <p className="font-medium">{owner.fullName}</p>
          <div className="flex flex-wrap gap-2">
            {owner.phone && (
              <>
                <a href={`tel:${owner.phone}`} className={buttonStyles({ size: "sm" })}>
                  <Phone /> {formatPhone(owner.phone)}
                </a>
                <a
                  href={whatsappUrl(
                    owner.phone,
                    `Hola ${owner.fullName.split(" ")[0]}, te escribe David Saavedra por tu propiedad (${code}).`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ size: "sm", variant: "secondary" })}
                >
                  <MessageCircle /> WhatsApp
                </a>
              </>
            )}
            {owner.email && (
              <a
                href={`mailto:${owner.email}`}
                className={buttonStyles({ size: "sm", variant: "secondary" })}
              >
                <Mail /> {owner.email}
              </a>
            )}
          </div>
        </div>
      ))}

      {photos.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Fotos enviadas ({photos.length}) · privadas hasta que las agregues
            </p>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => importPhotos(photos.map((photo) => photo.name))}
            >
              <ImagePlus /> Agregar todas a la galería
            </Button>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((photo) => (
              <li key={photo.name} className="flex flex-col gap-1.5">
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-[4/3] overflow-hidden rounded-md bg-surface-muted"
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    unoptimized
                    sizes="200px"
                    className="object-cover"
                  />
                </a>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => importPhotos([photo.name])}
                >
                  <ImagePlus /> Agregar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
