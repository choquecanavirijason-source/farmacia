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
  History,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

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
  history: History,
  shield: ShieldCheck,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

export type MenuIconName = keyof typeof ICON_MAP;
