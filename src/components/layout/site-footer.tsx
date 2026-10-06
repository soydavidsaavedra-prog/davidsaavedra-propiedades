import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  const { location, social } = siteConfig;

  return (
    <footer className="border-t border-line bg-surface">
      <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-sm text-ink-muted">
            {location.city}, {location.region}
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm md:items-end">
          <ul className="flex gap-6 font-medium">
            <li>
              <a href={social.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href={social.tiktok} target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </li>
          </ul>
          <p className="text-ink-muted">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
        </div>
      </Container>
    </footer>
  );
}
