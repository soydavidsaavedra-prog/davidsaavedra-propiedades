import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/brand/section-label";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: `Cómo ${siteConfig.name} recopila, usa y protege tus datos personales, y cómo ejercer tus derechos.`,
  alternates: { canonical: "/privacidad" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex flex-col gap-3 text-ink-soft [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** Canal para ejercer derechos: correo si está configurado; si no, Instagram. */
function ContactChannel() {
  const { privacyEmail } = siteConfig.legal;
  if (privacyEmail) {
    return (
      <a
        href={`mailto:${privacyEmail}`}
        className="font-medium text-ink underline underline-offset-4"
      >
        {privacyEmail}
      </a>
    );
  }
  return (
    <a
      href={siteConfig.social.instagram}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-ink underline underline-offset-4"
    >
      Instagram {siteConfig.social.handle}
    </a>
  );
}

export default function PrivacyPage() {
  const { controller, taxId, privacyUpdatedAt } = siteConfig.legal;

  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <header className="flex flex-col gap-3 pb-8">
        <SectionLabel>Legal</SectionLabel>
        <h1 className="text-3xl font-semibold sm:text-4xl">Política de privacidad</h1>
        <p className="text-ink-muted">Última actualización: {formatDate(privacyUpdatedAt)}</p>
        <p className="text-lg text-ink-soft">
          En {siteConfig.name} tratamos tus datos personales con respeto y solo para lo que nos
          pediste: ayudarte a encontrar y arrendar una propiedad. Esta política explica qué datos
          usamos, para qué y cómo ejercer tus derechos, de acuerdo con la legislación chilena de
          protección de datos personales (Ley N° 19.628, modificada por la Ley N° 21.719).
        </p>
      </header>

      <div className="flex flex-col gap-8">
        <Section title="1. Responsable de tus datos">
          <p>
            El responsable del tratamiento es <strong className="text-ink">{controller}</strong>
            {taxId && <>, RUT {taxId}</>}, corredor de propiedades con domicilio en{" "}
            {siteConfig.location.city}, {siteConfig.location.region}, {siteConfig.location.country}.
          </p>
          <p>
            Para cualquier consulta sobre tus datos puedes escribir a <ContactChannel />.
          </p>
        </Section>

        <Section title="2. Qué datos recopilamos">
          <p>Cuando completas el formulario de interés en una propiedad:</p>
          <ul>
            <li>Nombre y número de WhatsApp.</li>
            <li>
              De forma opcional: tipo de negocio, presupuesto mensual, plazo estimado y el mensaje
              que nos escribas.
            </li>
            <li>La propiedad que consultaste y la fecha de tu solicitud.</li>
            <li>
              El origen de tu visita, cuando llegas desde un enlace de campaña (por ejemplo, una
              publicación de Instagram o TikTok).
            </li>
          </ul>
          <p>
            Para recordar el origen de tu visita usamos el almacenamiento de sesión de tu navegador,
            que se borra al cerrarlo. No usamos cookies de publicidad ni de seguimiento de terceros.
          </p>
        </Section>

        <Section title="3. Para qué usamos tus datos">
          <ul>
            <li>Responder tu solicitud y coordinar visitas a la propiedad que te interesa.</li>
            <li>Hacer seguimiento de tu búsqueda y del proceso de arriendo.</li>
            <li>Sugerirte otras propiedades que se ajusten a lo que nos contaste.</li>
            <li>
              Saber, de forma agregada, qué canales nos traen consultas, para mejorar nuestro
              servicio.
            </li>
          </ul>
          <p>No vendemos ni arrendamos tus datos personales.</p>
        </Section>

        <Section title="4. Base para tratarlos">
          <p>
            Tratamos tus datos con tu consentimiento, que entregas al marcar la casilla de
            autorización del formulario. Puedes retirarlo en cualquier momento escribiéndonos; el
            retiro no afecta el tratamiento realizado antes.
          </p>
        </Section>

        <Section title="5. Con quién los compartimos">
          <ul>
            <li>
              Con el propietario de la propiedad, solo cuando sea necesario para coordinar una
              visita o avanzar en un arriendo, y con tu conocimiento.
            </li>
            <li>
              Con proveedores tecnológicos que alojan este sitio y su base de datos, que actúan por
              encargo nuestro y no pueden usar tus datos para fines propios. Algunos de ellos pueden
              almacenar la información en servidores ubicados fuera de Chile.
            </li>
            <li>
              Si eliges continuar la conversación por WhatsApp, ese intercambio queda sujeto además
              a las condiciones de WhatsApp.
            </li>
          </ul>
        </Section>

        <Section title="6. Cuánto tiempo los guardamos">
          <p>
            Mientras tengamos una relación comercial activa contigo y, después, hasta 24 meses desde
            nuestro último contacto. Luego los eliminamos o anonimizamos, salvo que la ley nos
            obligue a conservarlos por más tiempo.
          </p>
        </Section>

        <Section title="7. Tus derechos">
          <p>Puedes solicitar en cualquier momento:</p>
          <ul>
            <li>
              <strong className="text-ink">Acceso:</strong> saber qué datos tuyos tenemos.
            </li>
            <li>
              <strong className="text-ink">Rectificación:</strong> corregir datos inexactos o
              incompletos.
            </li>
            <li>
              <strong className="text-ink">Supresión:</strong> que eliminemos tus datos.
            </li>
            <li>
              <strong className="text-ink">Oposición:</strong> que dejemos de usarlos para un fin
              determinado.
            </li>
            <li>
              <strong className="text-ink">Portabilidad:</strong> recibir tus datos en un formato de
              uso común.
            </li>
            <li>
              <strong className="text-ink">Bloqueo:</strong> que suspendamos temporalmente su uso.
            </li>
          </ul>
          <p>
            Para ejercerlos, escríbenos a <ContactChannel /> indicando tu nombre y el número de
            WhatsApp con el que nos contactaste. Responderemos dentro de los plazos que establece la
            ley. Si consideras que no atendimos tu solicitud, puedes recurrir a la Agencia de
            Protección de Datos Personales.
          </p>
        </Section>

        <Section title="8. Seguridad">
          <p>
            Aplicamos medidas razonables para proteger tus datos: acceso restringido a la
            información interna, conexiones cifradas y reglas que impiden que terceros consulten los
            datos de nuestros clientes.
          </p>
        </Section>

        <Section title="9. Menores de edad">
          <p>
            Este sitio está dirigido a personas mayores de 18 años. No recopilamos de forma
            intencional datos de menores de edad.
          </p>
        </Section>

        <Section title="10. Cambios en esta política">
          <p>
            Podemos actualizar esta política. Publicaremos aquí la versión vigente con su fecha de
            actualización.
          </p>
          <p>
            <Link href="/" className="font-medium text-ink underline underline-offset-4">
              Volver al inicio
            </Link>
          </p>
        </Section>
      </div>
    </Container>
  );
}
