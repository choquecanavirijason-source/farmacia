import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { BranchViewProvider } from "@/context/branch-view-context";
import { DndAppProvider } from "@/components/dnd-provider";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farmacia Juan de Dios",
  description: "Sistema de gestión de inventarios, compras y ventas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${fontSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DndAppProvider>
            <AuthProvider>
              <BranchViewProvider>
                <div id="app-shell">{children}</div>
                <Toaster richColors position="top-right" />
              </BranchViewProvider>
            </AuthProvider>
          </DndAppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
