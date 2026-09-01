"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { ReactNode } from "react";

/** Singleton DnD provider — debe montarse UNA sola vez en el root layout.
 *  Evita el error "Cannot have two HTML5 backends at the same time" que
 *  ocurre cuando varios <DataTable> con DndProvider propio coexisten en el DOM.
 */
export function DndAppProvider({ children }: { children: ReactNode }) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}
