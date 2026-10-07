"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";

type ShareLinkCardProps = {
  title: string;
  description: string;
  url: string;
  /** Mensaje sugerido para WhatsApp; el enlace se agrega al final. */
  message: string;
};

/** Enlace de un formulario público, listo para copiar o enviar por WhatsApp. */
export function ShareLinkCard({ title, description, url, message }: ShareLinkCardProps) {
  const [text, setText] = useState(message);
  const [copied, setCopied] = useState(false);
  const whatsappText = `${text.trim()}\n${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 truncate rounded-md bg-surface-muted px-3 py-2.5 text-sm">
          {url}
        </code>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={copy}>
            {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar"}
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ size: "sm", variant: "ghost" })}
          >
            <ExternalLink /> Ver
          </a>
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Mensaje para WhatsApp
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          maxLength={600}
        />
      </label>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonStyles(), "self-start")}
      >
        <MessageCircle /> Enviar por WhatsApp
      </a>
    </section>
  );
}
