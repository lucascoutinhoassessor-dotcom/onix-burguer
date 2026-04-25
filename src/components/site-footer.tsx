import Link from "next/link";

const socialLinks = [
  { label: "WhatsApp", href: "https://wa.me/5521965565600" },
  { label: "Instagram", href: "#inicio" },
  {
    label: "Google Maps",
    href: "https://www.google.com/maps/search/?api=1&query=Av.+Jose+Mendonca+de+Campos,+955+-+Loja+07+-+Colubande,+Sao+Goncalo+-+RJ"
  }
];

const accountLinks = [
  { label: "Minha Conta", href: "/minha-conta" },
  { label: "Entrar / Cadastrar", href: "/login" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050505]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <p className="font-title text-3xl uppercase tracking-[0.14em] text-cream">Onix Burguer Artesanal</p>
          <p className="max-w-md text-sm leading-7 text-white/60">
            Hambúrgueres premium preparados com blend artesanal, ingredientes selecionados e uma experiência acolhedora em São Gonçalo.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amberglow">Contato</p>
          <div className="space-y-2 text-sm text-white/70">
            <p>(21) 96556-5600</p>
            <p>Abre às 18:00</p>
            <p>Refeição no local · Para viagem · Entrega</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amberglow">Endereço</p>
          <div className="space-y-3 text-sm text-white/70">
            <p>Av. José Mendonça de Campos, 955 - Loja 07</p>
            <p>Colubandê Mall · Colubandê · São Gonçalo/RJ</p>
            <div className="flex flex-wrap gap-3 pt-2">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] transition hover:border-amberglow/40 hover:text-amberglow"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amberglow">Conta</p>
          <div className="flex flex-col gap-2">
            {accountLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-white/60 transition hover:text-amberglow"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
