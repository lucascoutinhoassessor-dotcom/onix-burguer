import { CheckoutClient } from "@/components/checkout-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-80px)] bg-hero-radial">
        <CheckoutClient />
      </main>
      <SiteFooter />
    </>
  );
}
