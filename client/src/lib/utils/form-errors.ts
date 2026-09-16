import type { FieldValues, Path, UseFormSetError, UseFormSetFocus } from "react-hook-form";

/**
 * Mapea los errores de validación del backend (Laravel: { errors: { campo: ["mensaje"] } })
 * a los campos de un formulario de react-hook-form, y enfoca el primer campo con error.
 *
 * Devuelve true si encontró errores de campo y los aplicó (para que el caller decida si
 * además necesita mostrar un mensaje general de error).
 */
export function setFormErrorsFromServer<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  setFocus?: UseFormSetFocus<T>
): boolean {
  const fieldErrors = (error as any)?.response?.data?.errors;
  if (!fieldErrors || typeof fieldErrors !== "object") return false;

  let firstField: Path<T> | null = null;

  Object.keys(fieldErrors).forEach((key) => {
    const field = key as Path<T>;
    const raw = fieldErrors[key];
    const message = Array.isArray(raw) ? raw[0] : raw;
    setError(field, { type: "server", message });
    if (firstField === null) firstField = field;
  });

  if (firstField && setFocus) {
    setFocus(firstField);
  }

  return firstField !== null;
}
