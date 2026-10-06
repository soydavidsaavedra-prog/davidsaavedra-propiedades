import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DiagonalLines } from "@/components/brand/diagonal-lines";
import { SectionLabel } from "@/components/brand/section-label";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { brandAssets } from "@/config/brand";
import { siteConfig } from "@/config/site";

/** Presentación personal (modo Noche). El retrato reemplazará al símbolo cuando esté disponible. */
export function AgentBlock() {
  return (
    <section aria-labelledby="agent-title" className="py-14 sm:py-20">
      <Container>
        <div className="theme-night relative overflow-hidden rounded-xl">
          <DiagonalLines />
          <div className="relative flex flex-col gap-8 p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Image
                src={brandAssets.symbol.src}
                alt=""
                width={88}
                height={88}
                unoptimized
                className="size-[88px] shrink-0 rounded-full ring-1 ring-accent-line ring-offset-4 ring-offset-canvas"
              />
              <div className="flex flex-col gap-2">
                <SectionLabel>Tu contacto directo</SectionLabel>
                <h2 id="agent-title" className="text-2xl font-semibold sm:text-3xl">
                  David Saavedra
                </h2>
                <p className="max-w-md text-ink-soft">
                  Te atiendo personalmente, desde la primera consulta hasta la firma del contrato.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-stretch">
              <Link href="/contacto" className={buttonStyles({ size: "lg" })}>
                Conversemos <ArrowRight />
              </Link>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ size: "lg", variant: "secondary" })}
              >
                {siteConfig.social.handle}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
