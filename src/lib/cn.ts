type ClassValue = string | false | null | undefined;

/** Une clases condicionales. Los componentes exponen variantes; `className` solo agrega. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
