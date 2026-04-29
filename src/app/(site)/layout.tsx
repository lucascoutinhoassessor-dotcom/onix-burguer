import { WhatsAppFloatingButton } from "@/components/whatsapp-floating-button";

export default function SiteLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <WhatsAppFloatingButton />
    </>
  );
}
