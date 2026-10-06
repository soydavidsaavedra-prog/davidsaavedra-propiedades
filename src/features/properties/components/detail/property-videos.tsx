import { PlayCircle } from "lucide-react";
import { MediaFrame } from "@/components/ui/media-frame";
import type { PropertyMedia } from "../../types";

const providerNames = { youtube: "YouTube", vimeo: "Vimeo", storage: "" } as const;

/**
 * Videos de la propiedad. Archivo propio: <video> sin precarga (no consume
 * datos hasta reproducir). YouTube/Vimeo: enlace externo, sin incrustar
 * scripts de terceros.
 */
export function PropertyVideos({ videos, title }: { videos: PropertyMedia[]; title: string }) {
  if (videos.length === 0) return null;

  return (
    <ul className="grid gap-4">
      {videos.map((video) =>
        video.provider === "storage" ? (
          <li key={video.id}>
            <MediaFrame ratio="16/9" className="rounded-lg bg-night">
              <video
                src={video.source}
                poster={video.posterSource ?? undefined}
                controls
                playsInline
                preload="none"
                aria-label={video.alt || `Video: ${title}`}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </MediaFrame>
          </li>
        ) : (
          <li key={video.id}>
            <a
              href={video.source}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-ink"
            >
              <PlayCircle aria-hidden className="size-8 shrink-0 text-accent" strokeWidth={1.5} />
              <span className="flex flex-col">
                <span className="font-medium">{video.alt || "Ver el video de la propiedad"}</span>
                <span className="text-sm text-ink-muted">
                  Se abre en {providerNames[video.provider]}
                </span>
              </span>
            </a>
          </li>
        ),
      )}
    </ul>
  );
}
