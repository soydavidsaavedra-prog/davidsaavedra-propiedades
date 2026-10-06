"use client";

import { useRouter } from "next/navigation";

type CleanGetFormProps = Omit<React.ComponentProps<"form">, "method" | "onSubmit"> & {
  action: string;
};

/**
 * Formulario GET que navega sin recargar y omite los campos vacíos de la URL.
 * Sin JavaScript funciona como un formulario GET nativo (mejora progresiva).
 */
export function CleanGetForm({ action, children, ...props }: CleanGetFormProps) {
  const router = useRouter();

  return (
    <form
      {...props}
      action={action}
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        for (const [key, value] of new FormData(event.currentTarget)) {
          if (typeof value === "string" && value.trim() !== "") params.append(key, value.trim());
        }
        const query = params.toString();
        router.push(query ? `${action}?${query}` : action, { scroll: false });
      }}
    >
      {children}
    </form>
  );
}
