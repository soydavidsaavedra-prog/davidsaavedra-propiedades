import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { publicNav } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Logo />
        {/* En móvil la navegación principal vive en la barra inferior. */}
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-medium text-ink-soft">
            {publicNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
