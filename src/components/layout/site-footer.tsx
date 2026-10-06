import { Divider } from "@/components/brand/divider";
import { Logo } from "@/components/brand/logo";
import { SectionLabel } from "@/components/brand/section-label";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  const { location, social } = siteConfig;

  return (
    <footer className="theme-night">
      <Container className="flex flex-col gap-10 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-sm text-ink-muted">
              {location.city}, {location.region}
            </p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <SectionLabel>Síguenos</SectionLabel>
            <ul className="flex gap-6 text-sm font-medium">
              <li>
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent"
                >
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>
        <Divider variant="cut" />
        <p className="text-xs text-ink-muted">
          © {new Date().getFullYear()} {siteConfig.name} · {social.handle}
        </p>
      </Container>
    </footer>
  );
}
