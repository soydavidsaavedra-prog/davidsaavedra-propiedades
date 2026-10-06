"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signInAction, type SignInState } from "../auth-actions";

export function SignInForm({ returnTo }: { returnTo?: string }) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signInAction, {
    error: null,
    email: "",
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {returnTo && <input type="hidden" name="volver" value={returnTo} />}
      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {state.error}
        </p>
      )}
      <Field id="ingreso-email" label="Correo">
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue={state.email}
          />
        )}
      </Field>
      <Field id="ingreso-clave" label="Contraseña">
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={pending} fullWidth>
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
