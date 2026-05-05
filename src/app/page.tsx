import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeaturedItemsSection } from "@/components/FeaturedItemModal";
import { WhatsAppFloatingButton } from "@/components/whatsapp-floating-button";
import { getCompanyData } from "@/lib/company-data";
import { menuItems } from "@/data/menu";

const reviews = [
  "Funcionários super atenciosos, comida uma delícia, amei a experiência.",
  "Experiência maravilhosa, lugar super aconchegante e atendimento de qualidade.",
  "O hambúrguer é incrível, mesma qualidade do delivery em um ambiente acolhedor."
];

const serviceModes = ["Refeição no local", "Para viagem", "Entrega"];

const categoryLabels = {
  hamburgueres: "Hambúrgueres",
  acompanhamentos: "Acompanhamentos",
  bebidas: "Bebidas",
  sobremesas: "Sobremesas"
} as const;

const groupedMenu = Object.entries(
  menuItems.reduce<Record<string, typeof menuItems>>((accumulator, item) => {
    if (!accumulator[item.category]) {
      accumulator[item.category] = [];
    }

    accumulator[item.category].push(item);
    return accumulator;
  }, {})
);

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amberglow">{children}</p>;
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-2xl space-y-4">
      <SectionEyebrow>Hamburgueria Modelo</SectionEyebrow>
      <h2 className="font-title text-4xl uppercase leading-none tracking-[0.1em] text-cream sm:text-5xl">
        {title}
      </h2>
      <p className="text-base leading-8 text-white/65 sm:text-lg">{description}</p>
    </div>
  );
}

function Currency({ value }: { value: number }) {
  return (
    <span>
      {value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      })}
    </span>
  );
}

export default async function Home() {
  const company = await getCompanyData();

  const companyName = company?.name || "Hamburgueria Modelo";
  const companyDescription = company?.description || "Hamburgueria premium com blend artesanal, atmosfera intimista e finalização impecável em cada pedido.";
  const companyAddress = company?.address || "";
  const companyLogo = company?.logo_url || "";
  const companyInstagram = company?.instagram;
  const companyWhatsapp = company?.whatsapp;

  return (
    <main id="inicio" className="min-h-screen bg-hero-radial">
      <SiteHeader companyName={companyName} logoUrl={companyLogo} />

      {/* ── HERO ── */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-hero-radial">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src="/videos/hamburguer%2001.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/65" aria-hidden="true" />

        {/* Radial gradient overlay to preserve brand feel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(243,181,98,0.18), transparent 40%), radial-gradient(circle at bottom right, rgba(199,138,44,0.12), transparent 35%)"
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="max-w-3xl space-y-6 sm:space-y-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amberglow/20 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-amberglow backdrop-blur-sm sm:gap-3 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.35em]">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amberglow sm:h-2 sm:w-2" />
              Premium burger experience
            </div>

            <div className="space-y-4 sm:space-y-6">
              <h1 className="font-title max-w-3xl text-[2.75rem] uppercase leading-[0.9] tracking-[0.06em] text-cream sm:text-6xl sm:leading-[0.88] sm:tracking-[0.08em] lg:text-[7.5rem]">
                {companyName}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/80 sm:text-lg sm:leading-8 lg:text-xl">
                {companyDescription}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/cardapio"
                className="btn-premium rounded-full bg-amberglow px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-obsidian hover:bg-[#ffcb7d] sm:px-7 sm:py-4 sm:text-sm sm:tracking-[0.2em]"
              >
                Fazer pedido agora
              </Link>
              {companyWhatsapp && (
                <a
                  href={`https://wa.me/${companyWhatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-premium rounded-full border border-white/20 px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm hover:border-amberglow/40 hover:text-amberglow sm:px-7 sm:py-4 sm:text-sm sm:tracking-[0.2em]"
                >
                  Pedir pelo WhatsApp
                </a>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 sm:gap-4 sm:pt-4">
              <div className="glass-panel rounded-2xl p-3 sm:rounded-3xl sm:p-5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.3em]">Avaliação</p>
                <p className="mt-2 font-title text-2xl uppercase tracking-[0.08em] text-cream sm:mt-3 sm:text-4xl sm:tracking-[0.12em]">5.0</p>
                <p className="text-[10px] text-white/60 sm:text-sm">1.343 avaliações</p>
              </div>
              <div className="glass-panel rounded-2xl p-3 sm:rounded-3xl sm:p-5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.3em]">Faixa</p>
                <p className="mt-2 font-title text-2xl uppercase tracking-[0.08em] text-cream sm:mt-3 sm:text-4xl sm:tracking-[0.12em]">R$20–60</p>
                <p className="text-[10px] text-white/60 sm:text-sm">Premium e acessível</p>
              </div>
              <div className="glass-panel rounded-2xl p-3 sm:rounded-3xl sm:p-5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.3em]">Abre</p>
                <p className="mt-2 font-title text-2xl uppercase tracking-[0.08em] text-cream sm:mt-3 sm:text-4xl sm:tracking-[0.12em]">18h</p>
                <p className="text-[10px] text-white/60 sm:text-sm">Todos os dias</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <SectionTitle
            title="Artesanal de verdade, do fogo ao acabamento."
            description="A Hamburgueria Modelo nasce para entregar hambúrgueres com identidade, técnica e presença. Cada receita foi pensada para equilibrar suculência, crocância e profundidade de sabor em um ambiente acolhedor."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-amberglow">Assinatura</p>
              <p className="mt-4 text-lg leading-8 text-white/70">
                Blend artesanal, pão macio, queijos selecionados e molhos de produção própria.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-amberglow">Experiência</p>
              <p className="mt-4 text-lg leading-8 text-white/70">
                Delivery consistente e atendimento presencial aconchegante para transformar a refeição em ocasião.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.35em] text-amberglow">Modalidades</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {serviceModes.map((mode) => (
                  <span
                    key={mode}
                    className="rounded-full border border-amberglow/20 bg-amberglow/10 px-4 py-2 text-sm text-cream"
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cardapio" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12">
          <SectionTitle
            title="Destaques do cardápio"
            description="Uma seleção autoral para apresentar a personalidade da casa. Cortes marcantes, texturas contrastantes e execução premium em cada camada."
          />

          <FeaturedItemsSection />

          <div className="grid gap-6 xl:grid-cols-4">
            {groupedMenu.map(([category, items]) => (
              <div key={category} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-title text-3xl uppercase tracking-[0.1em] text-cream">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                  <span className="rounded-full border border-amberglow/20 px-3 py-1 text-xs uppercase tracking-[0.25em] text-amberglow">
                    {items.length} itens
                  </span>
                </div>
                <div className="space-y-5">
                  {items.map((item) => (
                    <div key={item.name} className="border-b border-white/8 pb-5 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-cream">{item.name}</p>
                          <p className="mt-1 text-sm leading-6 text-white/55">{item.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-amberglow">
                          <Currency value={item.price} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="avaliacoes" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <SectionTitle
              title="Avaliações que reforçam cada detalhe."
              description="Reconhecimento real de quem viveu a experiência Hamburgueria Modelo no salão e no delivery."
            />
            <div className="rounded-[2rem] border border-amberglow/20 bg-amberglow/10 p-6">
              <p className="font-title text-6xl uppercase tracking-[0.08em] text-cream">5.0</p>
              <p className="mt-2 text-sm uppercase tracking-[0.3em] text-amberglow">1.343 avaliações</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <article key={review} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <div className="mb-6 flex gap-1 text-amberglow">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index}>★</span>
                  ))}
                </div>
                <p className="text-base leading-8 text-white/75">&ldquo;{review}&rdquo;</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="localizacao" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <SectionEyebrow>Visite a Hamburgueria</SectionEyebrow>
            <h2 className="mt-4 font-title text-5xl uppercase leading-none tracking-[0.1em] text-cream">
              Onde a experiência começa.
            </h2>
            <div className="mt-8 space-y-6 text-white/70">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Endereço</p>
                <p className="mt-2 text-lg leading-8">
                  Av. José Mendonça de Campos, 955 - Loja 07 - Colubandê, São Gonçalo - RJ, 24451-001
                </p>
                <p className="text-sm text-white/50">Colubandê Mall</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Horário</p>
                <p className="mt-2 text-lg">Abre às 18:00</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Atendimento</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {serviceModes.map((mode) => (
                    <span key={mode} className="rounded-full border border-white/10 px-4 py-2 text-sm">
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="https://www.google.com/maps/search/?api=1&query=Av.+Jose+Mendonca+de+Campos,+955+-+Loja+07+-+Colubande,+Sao+Goncalo+-+RJ"
                target="_blank"
                rel="noreferrer"
                className="btn-premium inline-flex rounded-full bg-amberglow px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-obsidian hover:bg-[#ffcb7d]"
              >
                Abrir no mapa
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-amberglow/20 bg-gradient-to-br from-[#141414] to-[#090909] p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(243,181,98,0.18),transparent_35%)]" />
            <div className="relative z-10 h-full space-y-8">
              <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Contato direto</p>
                <p className="mt-4 font-title text-4xl uppercase tracking-[0.08em] text-cream">(21) 96556-5600</p>
                <p className="mt-3 text-white/65">Pedidos rápidos, retirada ou delivery direto pelo WhatsApp.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Ambiente</p>
                  <p className="mt-3 text-lg leading-8 text-white/70">
                    Aconchegante, intimista e ideal para curtir um burger premium sem pressa.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Consistência</p>
                  <p className="mt-3 text-lg leading-8 text-white/70">
                    Mesma qualidade no salão, na retirada e na entrega.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Faixa de preço</p>
                <p className="mt-3 font-title text-5xl uppercase tracking-[0.08em] text-cream">R$ 20–60</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFloatingButton />
    </main>
  );
}
