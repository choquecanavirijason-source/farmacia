import {
  Users,
  Tags,
  Pill,
  Boxes,
  Truck,
  ShoppingCart,
  BarChart3,
  Contact,
  ShoppingBag,
  ClipboardList,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Los componentes de ícono (funciones) no pueden pasar de un Server Component
 * a un Client Component como prop (RSC solo serializa datos planos). El menú
 * se define con `iconName` (string) y este mapa resuelve el componente donde
 * haga falta renderizarlo, tanto en server (dashboard) como en client (sidebar).
 */
export const ICON_MAP = {
  users: Users,
  tags: Tags,
  pill: Pill,
  boxes: Boxes,
  truck: Truck,
  "shopping-cart": ShoppingCart,
  "bar-chart": BarChart3,
  contact: Contact,
  "shopping-bag": ShoppingBag,
  "clipboard-list": ClipboardList,
  wallet: Wallet,
} satisfies Record<string, LucideIcon>;

export type MenuIconName = keyof typeof ICON_MAP;
