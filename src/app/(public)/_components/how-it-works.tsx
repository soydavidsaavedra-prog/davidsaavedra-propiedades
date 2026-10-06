import { SectionLabel } from "@/components/brand/section-label";
import { Container } from "@/components/ui/container";

const steps = [
  {
    title: "Encuentra tu local",
    body: "Fichas con fotografías, medidas y condiciones claras para comparar sin perder tiempo.",
  },
  {
    title: "Agenda una visita",
    body: "Elige la propiedad que te interesa y coordinamos una visita en el horario que te acomode.",
  },
  {
    title: "Te acompaño hasta el contrato",
    body: "Resuelvo tus dudas y te guío en la documentación y la negociación hasta el arriendo.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="border-y border-line bg-surface py-14 sm:py-20">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <SectionLabel>Cómo trabajo</SectionLabel>
          <h2 id="how-title" className="text-3xl font-semibold">
            Un proceso simple y acompañado
          </h2>
        </div>
        <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3 border-t border-line pt-5">
              <span className="font-display text-sm font-semibold text-accent tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
