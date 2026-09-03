"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

/** Deja pasar solo dígitos (y un único punto decimal si `allowDecimal`), con tope de `maxDigits` dígitos. */
function sanitizeNumeric(raw: string, allowDecimal: boolean, maxDigits: number): string {
  let out = "";
  let digitCount = 0;
  let dotUsed = false;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      if (digitCount >= maxDigits) continue;
      out += ch;
      digitCount++;
    } else if (allowDecimal && ch === "." && !dotUsed) {
      out += ch;
      dotUsed = true;
    }
  }

  // Quita ceros a la izquierda en la parte entera (050 -> 50, 00.5 -> 0.5),
  // sin tocar el "0" solo ni la parte decimal.
  const dotIndex = out.indexOf(".");
  let intPart = dotIndex === -1 ? out : out.slice(0, dotIndex);
  const rest = dotIndex === -1 ? "" : out.slice(dotIndex);
  while (intPart.length > 1 && intPart[0] === "0") {
    intPart = intPart.slice(1);
  }

  return intPart + rest;
}

interface NumericInputProps extends Omit<React.ComponentProps<"input">, "type" | "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Permite un punto decimal — úsalo únicamente en campos de precio/monto. */
  allowDecimal?: boolean;
  /** Tope de dígitos que se pueden escribir (sin contar el punto). Default 10. */
  maxDigits?: number;
}

/** Input de solo-números: filtra letras/símbolos al escribir o pegar, y limita la cantidad de dígitos. */
export function NumericInput({
  value,
  onValueChange,
  allowDecimal = false,
  maxDigits = 10,
  ...props
}: NumericInputProps) {
  return (
    <Input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={value}
      onChange={(e) => onValueChange(sanitizeNumeric(e.target.value, allowDecimal, maxDigits))}
      {...props}
    />
  );
}
