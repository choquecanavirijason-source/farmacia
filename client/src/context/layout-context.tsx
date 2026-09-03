"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type LayoutMode = "sidebar" | "top";

interface LayoutContextType {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  sidebarPinned: boolean;
  setSidebarPinned: (pinned: boolean) => void;
  toggleSidebarPinned: () => void;
  /** Oculta sidebar y topbar para vistas de pantalla completa (ej. POS). No se persiste. */
  focusMode: boolean;
  setFocusMode: (focused: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const STORAGE_KEY_MODE = "farmacia_layout_mode";
const STORAGE_KEY_PINNED = "farmacia_sidebar_pinned";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  // Por defecto: Barra lateral (sidebar) y fija/expandida (pinned = true)
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>("sidebar");
  const [sidebarPinned, setSidebarPinnedState] = useState<boolean>(true);
  const [focusMode, setFocusMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY_MODE);
      if (savedMode === "sidebar" || savedMode === "top") {
        setLayoutModeState(savedMode);
      }

      const savedPinned = localStorage.getItem(STORAGE_KEY_PINNED);
      if (savedPinned !== null) {
        setSidebarPinnedState(savedPinned === "true");
      }
    } catch {
      // Ignorar errores de acceso a localStorage
    } finally {
      setMounted(true);
    }
  }, []);

  const setLayoutMode = (mode: LayoutMode) => {
    setLayoutModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch {}
  };

  const setSidebarPinned = (pinned: boolean) => {
    setSidebarPinnedState(pinned);
    try {
      localStorage.setItem(STORAGE_KEY_PINNED, String(pinned));
    } catch {}
  };

  const toggleSidebarPinned = () => {
    setSidebarPinned(!sidebarPinned);
  };

  return (
    <LayoutContext.Provider
      value={{
        layoutMode,
        setLayoutMode,
        sidebarPinned,
        setSidebarPinned,
        toggleSidebarPinned,
        focusMode,
        setFocusMode,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout debe utilizarse dentro de un LayoutProvider");
  }
  return context;
}
