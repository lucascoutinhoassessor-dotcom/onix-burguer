import type { Metadata, Viewport } from "next";
import { Barlow, Bebas_Neue } from "next/font/google";
import { CartDrawer } from "@/components/cart-drawer";
import { CartProvider } from "@/components/cart-context";
import "./globals.css";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas"
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow"
});

export const metadata: Metadata = {
  title: "Hamburgueria Modelo | Sistema de Pedidos Online",
  description:
    "Sistema de pedidos online para hamburguerias com cardápio digital, pagamento integrado e gestão de delivery."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${bebas.variable} ${barlow.variable} font-body bg-obsidian text-cream`}>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
