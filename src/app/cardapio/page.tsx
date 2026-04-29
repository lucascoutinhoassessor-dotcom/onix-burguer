import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MenuPageClient } from "@/components/menu-page-client";
import { WhatsAppFloatingButton } from "@/components/whatsapp-floating-button";

export default function CardapioPage() {
  return (
    <>
      <SiteHeader />
      <MenuPageClient />
      <SiteFooter />
      <WhatsAppFloatingButton />
    </>
  );
}
