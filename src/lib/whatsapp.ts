/** Enlace "click to chat" de WhatsApp con mensaje prellenado. */
export function whatsappUrl(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
