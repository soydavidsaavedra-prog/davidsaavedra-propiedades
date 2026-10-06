import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="flex min-h-dvh flex-col items-start justify-center gap-4 py-16">
      <p className="text-xs font-medium tracking-brand text-ink-muted">ERROR 404</p>
      <h1 className="text-3xl font-semibold">Esta página no existe o aún no está disponible.</h1>
      <Link href="/" className={buttonStyles({ variant: "secondary" })}>
        Volver al inicio
      </Link>
    </Container>
  );
}
