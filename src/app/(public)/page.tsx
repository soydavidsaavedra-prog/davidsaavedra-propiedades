import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

// PROVISORIO: la Home definitiva (por intención) se construye en el paso 3.
export default function HomePage() {
  return (
    <Container className="flex min-h-[60dvh] flex-col justify-center gap-4 py-16">
      <p className="text-xs font-medium tracking-brand text-ink-muted">EN CONSTRUCCIÓN</p>
      <h1 className="max-w-2xl text-display font-semibold">{siteConfig.name}</h1>
      <p className="max-w-xl text-lg text-ink-soft">
        Propiedades en {siteConfig.location.city}, {siteConfig.location.region}.
      </p>
    </Container>
  );
}
