import { getRestaurantWhatsAppUrl } from "@/lib/checkout";

export function WhatsAppFloatingButton() {
  return (
    <a
      href={getRestaurantWhatsAppUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Abrir WhatsApp da Onix Burguer"
      className="fixed bottom-5 right-5 z-[90] inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.35)] transition hover:scale-105 hover:bg-[#20bd5c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 fill-current">
        <path d="M19.11 17.49c-.27-.14-1.58-.78-1.83-.86-.24-.09-.42-.14-.6.13-.18.27-.69.86-.84 1.03-.16.18-.31.2-.58.07-.27-.14-1.13-.41-2.15-1.3-.8-.71-1.34-1.57-1.5-1.84-.16-.27-.02-.42.12-.56.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.14-.6-1.44-.82-1.97-.22-.53-.44-.45-.6-.46h-.51c-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22 0 1.31.96 2.57 1.09 2.75.13.18 1.88 2.87 4.56 4.03.64.27 1.14.43 1.53.55.64.2 1.22.17 1.68.1.51-.08 1.58-.65 1.8-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.51-.31Z" />
        <path d="M27.11 4.88A15.78 15.78 0 0 0 16 0C7.18 0 0 7.18 0 16c0 2.82.74 5.58 2.15 8.01L0 32l8.2-2.12A15.93 15.93 0 0 0 16 32c8.82 0 16-7.18 16-16 0-4.27-1.66-8.28-4.89-11.12ZM16 29.15c-2.38 0-4.72-.64-6.77-1.85l-.49-.29-4.87 1.26 1.3-4.75-.32-.49A13.08 13.08 0 0 1 2.86 16C2.86 8.9 8.9 2.86 16 2.86c3.46 0 6.72 1.35 9.17 3.8A12.88 12.88 0 0 1 29.14 16c0 7.1-6.04 13.15-13.14 13.15Z" />
      </svg>
    </a>
  );
}