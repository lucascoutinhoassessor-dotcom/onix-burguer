import { Suspense } from "react";
import { ConfirmationClient } from "@/components/confirmation-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ConfirmationPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-80px)] bg-hero-radial">
        <Suspense fallback={null}>
          <ConfirmationClient />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}