"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/checkout";

// Tipo estendido com taxa
type Lancamento = {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  canal: string;
  metodoPagamento: string;
  valorBruto: number;
  valorLiquido: number;
  status: "Pago" | "Pendente" | "A Receber";
  tipo: "Entrada" | "Saída";
  taxaValor?: number;
  taxaTipo?: "%" | "R$";
};

// Função de cálculo de liquido com taxa
function calcularLiquido(bruto: number, taxa: number, tipo: "%" | "R$"): number {
  if (tipo === "%") {
    return bruto - (bruto * (taxa / 100));
  }
  return bruto - taxa;
}

// Mock data para simulação
const mockLancamentos: Lancamento[] = [
  { id: "1", data: "2025-01-20", descricao: "Venda #1234", categoria: "Venda", canal: "iFood", metodoPagamento: "iFood", valorBruto: 150, valorLiquido: calcularLiquido(150, 12, "%"), status: "A Receber", tipo: "Entrada", taxaValor: 12, taxaTipo: "%" },
  { id: "2", data: "2025-01-20", descricao: "Venda #1235", categoria: "Venda", canal: "Balcão", metodoPagamento: "Pix", valorBruto: 89.90, valorLiquido: 89.90, status: "Pago", tipo: "Entrada", taxaValor: 0, taxaTipo: "%" },
  { id: "3", data: "2025-01-20", descricao: "Embalagens Delivery", categoria: "Embalagens", canal: "Outros", metodoPagamento: "Pix", valorBruto: 250, valorLiquido: 250, status: "Pago", tipo: "Saída" },
  { id: "4", data: "2025-01-21", descricao: "Venda #1236", categoria: "Venda", canal: "WhatsApp", metodoPagamento: "Dinheiro", valorBruto: 45.00, valorLiquido: 45.00, status: "Pago", tipo: "Entrada", taxaValor: 0, taxaTipo: "%" },
  { id: "5", data: "2025-01-21", descricao: "Insumos - Carne", categoria: "Insumos", canal: "Outros", metodoPagamento: "Pix", valorBruto: 350, valorLiquido: 350, status: "Pendente", tipo: "Saída" },
  { id: "6", data: "2025-01-21", descricao: "Taxa iFood", categoria: "Taxas Apps", canal: "iFood", metodoPagamento: "iFood", valorBruto: 18, valorLiquido: 18, status: "Pago", tipo: "Saída" },
];

// Componente Card de Métrica
function MetricCard({ title, value, trend, trendUp, icon, color }: { 
  title: string; 
  value: string; 
  trend?: string; 
  trendUp?: boolean;
  icon: string;
  color: "green" | "blue" | "red" | "amber";
}) {
  const colorClasses = {
    green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
    red: "from-red-500/20 to-red-600/5 border-red-500/30",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${colorClasses[color]}`}>
      <div className="relative z-10">
        <p className="text-xs font-medium tracking-wider text-cream/50 uppercase">{title}</p>
        <p className="mt-2 text-2xl font-bold text-cream">{value}</p>
        {trend && (
          <p className={`mt-1 text-xs ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </p>
        )}
      </div>
      <span className="absolute -right-2 -top-2 text-6xl opacity-10">{icon}</span>
    </div>
  );
}

// Componente Gráfico Simples
function SimpleChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h3 className="mb-4 text-sm font-medium text-cream/70">Vendas Físicas vs Delivery</h3>
      <div className="flex h-48 items-end gap-4">
        {data.map((item, i) => {
          const height = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div 
                className="w-full rounded-t-lg transition-all duration-500"
                style={{ 
                  height: `${Math.max(height, 5)}%`,
                  backgroundColor: item.color 
                }}
              />
              <span className="text-xs text-cream/50">{item.label}</span>
              <span className="text-sm font-semibold text-cream">{formatCurrency(item.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componente Principal
export default function FinanceiroPage() {
  const [modoSimulacao, setModoSimulacao] = useState(false);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [realData, setRealData] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroData, setFiltroData] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formTipo, setFormTipo] = useState<"Entrada" | "Saída">("Saída");
  const [formDescricao, setFormDescricao] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formDataVencimento, setFormDataVencimento] = useState("");
  const [formStatus, setFormStatus] = useState<"Pago" | "Pendente">("Pendente");
  
  // Taxa state
  const [formTaxaValor, setFormTaxaValor] = useState("");
  const [formTaxaTipo, setFormTaxaTipo] = useState<"%" | "R$">("%");
  const [valorLiquidoPreview, setValorLiquidoPreview] = useState(0);

  // Calcular liquido em tempo real
  useEffect(() => {
    const bruto = parseFloat(formValor.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    const taxa = parseFloat(formTaxaValor) || 0;
    const liquido = calcularLiquido(bruto, taxa, formTaxaTipo);
    setValorLiquidoPreview(Math.max(0, liquido));
  }, [formValor, formTaxaValor, formTaxaTipo]);

  // Carregar dados
  useEffect(() => {
    setLoading(true);
    if (modoSimulacao) {
      setTimeout(() => {
        setLancamentos(mockLancamentos);
        setLoading(false);
      }, 300);
    } else {
      setLancamentos(realData);
      setLoading(false);
    }
  }, [modoSimulacao, realData]);

  // Métricas calculadas
  const metricas = useMemo(() => {
    const entradas = lancamentos.filter(l => l.tipo === "Entrada");
    const saidas = lancamentos.filter(l => l.tipo === "Saída");
    
    const faturamentoBruto = entradas.reduce((sum, l) => sum + l.valorBruto, 0);
    const lucroLiquido = entradas.reduce((sum, l) => sum + l.valorLiquido, 0) - saidas.reduce((sum, l) => sum + l.valorLiquido, 0);
    const aPagar = saidas.filter(l => l.status === "Pendente").reduce((sum, l) => sum + l.valorLiquido, 0);
    const aReceber = entradas.filter(l => l.status === "A Receber").reduce((sum, l) => sum + l.valorLiquido, 0);
    
    const vendasFisicas = entradas.filter(l => l.canal === "Balcão" || l.canal === "WhatsApp").reduce((sum, l) => sum + l.valorLiquido, 0);
    const vendasDelivery = entradas.filter(l => l.canal === "iFood" || l.canal === "UberEats").reduce((sum, l) => sum + l.valorLiquido, 0);
    
    return { faturamentoBruto, lucroLiquido, aPagar, aReceber, vendasFisicas, vendasDelivery };
  }, [lancamentos]);

  // Total de comissões/taxas
  const totalComissoes = useMemo(() => {
    return lancamentos
      .filter(l => l.taxaValor && l.taxaValor > 0)
      .reduce((sum, l) => {
        if (l.taxaTipo === "%") {
          return sum + (l.valorBruto * (l.taxaValor! / 100));
        }
        return sum + (l.taxaValor || 0);
      }, 0);
  }, [lancamentos]);

  // Filtrar lançamentos
  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter(l => {
      const matchData = !filtroData || l.data.includes(filtroData);
      const matchCategoria = !filtroCategoria || l.categoria === filtroCategoria;
      const matchStatus = !filtroStatus || l.status === filtroStatus;
      return matchData && matchCategoria && matchStatus;
    });
  }, [lancamentos, filtroData, filtroCategoria, filtroStatus]);

  // Salvar novo lançamento
  const handleSave = () => {
    if (!formDescricao || !formCategoria || !formValor || !formDataVencimento) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const bruto = parseFloat(formValor.replace(/[^\d,]/g, "").replace(",", "."));
    if (isNaN(bruto) || bruto <= 0) {
      alert("Valor inválido");
      return;
    }

    const taxa = parseFloat(formTaxaValor) || 0;
    const liquido = calcularLiquido(bruto, taxa, formTaxaTipo);

    const novoLancamento: Lancamento = {
      id: Date.now().toString(),
      data: formDataVencimento,
      descricao: formDescricao,
      categoria: formCategoria as any,
      canal: "Outros",
      metodoPagamento: "Pix",
      valorBruto: bruto,
      valorLiquido: Math.max(0, liquido),
      status: formStatus,
      tipo: formTipo,
      taxaValor: taxa > 0 ? taxa : undefined,
      taxaTipo: taxa > 0 ? formTaxaTipo : undefined,
    };

    setSaving(true);
    setTimeout(() => {
      setRealData(prev => [novoLancamento, ...prev]);
      setShowForm(false);
      resetForm();
      setSaving(false);
    }, 500);
  };

  const resetForm = () => {
    setFormTipo("Saída");
    setFormDescricao("");
    setFormCategoria("");
    setFormValor("");
    setFormDataVencimento("");
    setFormStatus("Pendente");
    setFormTaxaValor("");
    setFormTaxaTipo("%");
    setValorLiquidoPreview(0);
  };

  // Exportações
  const exportToPDF = () => {
    const html = `
      <html>
        <head><title>Relatório Financeiro</title></head>
        <body>
          <h1>Relatório Financeiro - ${new Date().toLocaleDateString('pt-BR')}</h1>
          <p><strong>Total em Comissões/Taxas:</strong> ${formatCurrency(totalComissoes)}</p>
          <table border="1">
            <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Bruto</th><th>Taxa</th><th>Líquido</th><th>Status</th></tr>
            ${lancamentosFiltrados.map(l => `
              <tr>
                <td>${l.data}</td>
                <td>${l.descricao}</td>
                <td>${l.categoria}</td>
                <td>${formatCurrency(l.valorBruto)}</td>
                <td>${l.taxaValor ? `${l.taxaValor}${l.taxaTipo}` : '-'}</td>
                <td>${formatCurrency(l.valorLiquido)}</td>
                <td>${l.status}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win?.document.write(html);
    win?.print();
  };

  const exportToExcel = () => {
    const csv = [
      ["Data", "Descrição", "Categoria", "Valor Bruto", "Taxa", "Valor Líquido", "Status", "Tipo"],
      ...lancamentosFiltrados.map(l => [
        l.data, l.descricao, l.categoria, l.valorBruto.toString(), 
        l.taxaValor ? `${l.taxaValor}${l.taxaTipo}` : '',
        l.valorLiquido.toString(), l.status, l.tipo
      ])
    ].map(row => row.join(";")).join("\n");
    
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return <div className="p-6 text-cream">Carregando...</div>;

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream">Financeiro</h1>
          <p className="text-sm text-cream/50">Gestão financeira e fluxo de caixa</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowForm(true)} 
            className="rounded-lg bg-amberglow/25 px-4 py-2 text-sm font-medium text-amberglow hover:bg-amberglow/35"
          >
            + Novo Lançamento
          </button>
          <button onClick={exportToPDF} className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30">Exportar PDF</button>
          <button onClick={exportToExcel} className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/30">Exportar Excel</button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Faturamento Bruto" value={formatCurrency(metricas.faturamentoBruto)} icon="💰" color="blue" />
        <MetricCard title="Lucro Líquido" value={formatCurrency(metricas.lucroLiquido)} icon="📈" color="green" />
        <MetricCard title="A Pagar (Hoje)" value={formatCurrency(metricas.aPagar)} icon="💳" color="red" />
        <MetricCard title="Comissões/Taxas" value={formatCurrency(totalComissoes)} icon="📊" color="amber" />
      </div>

      {/* Gráfico */}
      <div className="mb-6">
        <SimpleChart data={[
          { label: "Físico", value: metricas.vendasFisicas, color: "#10b981" },
          { label: "Delivery", value: metricas.vendasDelivery, color: "#f59e0b" },
        ]} />
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input 
          type="date" 
          value={filtroData} 
          onChange={(e) => setFiltroData(e.target.value)} 
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
        <select 
          value={filtroCategoria} 
          onChange={(e) => setFiltroCategoria(e.target.value)} 
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          <option value="" className="bg-zinc-900 text-white">Todas Categorias</option>
          <option value="Venda" className="bg-zinc-900 text-white">Venda</option>
          <option value="Insumos" className="bg-zinc-900 text-white">Insumos</option>
          <option value="Embalagens" className="bg-zinc-900 text-white">Embalagens</option>
          <option value="Custos Fixos" className="bg-zinc-900 text-white">Custos Fixos</option>
          <option value="Custos Variáveis" className="bg-zinc-900 text-white">Custos Variáveis</option>
          <option value="Taxas Apps" className="bg-zinc-900 text-white">Taxas Apps</option>
          <option value="Folha de Pagamento" className="bg-zinc-900 text-white">Folha de Pagamento</option>
        </select>
        <select 
          value={filtroStatus} 
          onChange={(e) => setFiltroStatus(e.target.value)} 
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          <option value="" className="bg-zinc-900 text-white">Todos Status</option>
          <option value="Pago" className="bg-zinc-900 text-white">Pago</option>
          <option value="Pendente" className="bg-zinc-900 text-white">Pendente</option>
          <option value="A Receber" className="bg-zinc-900 text-white">A Receber</option>
        </select>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="mb-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-cream/50">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Bruto</th>
              <th className="px-4 py-3">Taxa</th>
              <th className="px-4 py-3">Líquido</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {lancamentosFiltrados.map((l) => (
              <tr key={l.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-cream/70">{new Date(l.data).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 font-medium text-cream">{l.descricao}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    l.categoria === 'Venda' ? 'bg-emerald-500/20 text-emerald-400' :
                    l.categoria === 'Embalagens' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>{l.categoria}</span>
                </td>
                <td className="px-4 py-3 text-cream/60">{formatCurrency(l.valorBruto)}</td>
                <td className="px-4 py-3 text-cream/60">{l.taxaValor ? `${l.taxaValor}${l.taxaTipo}` : '-'}</td>
                <td className={`px-4 py-3 font-semibold ${l.tipo === 'Entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {l.tipo === 'Entrada' ? '+' : '-'}{formatCurrency(l.valorLiquido)}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    l.status === 'Pago' ? 'bg-emerald-500/20 text-emerald-400' :
                    l.status === 'A Receber' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{l.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DRE Simplificado */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="mb-4 text-lg font-semibold text-cream">DRE Simplificado</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-cream/70">Receita Bruta</span>
            <span className="font-medium text-cream">{formatCurrency(metricas.faturamentoBruto)}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-cream/70">(-) Comissões/Taxas</span>
            <span className="font-medium text-red-400">{formatCurrency(totalComissoes)}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-cream/70">(-) Custos Operacionais</span>
            <span className="font-medium text-red-400">{formatCurrency(lancamentos.filter(l => l.tipo === 'Saída').reduce((s, l) => s + l.valorLiquido, 0))}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="font-semibold text-cream">Lucro Líquido</span>
            <span className="font-bold text-emerald-400">{formatCurrency(metricas.lucroLiquido)}</span>
          </div>
        </div>
      </div>

      {/* Modal de Novo Lançamento */}
      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="mb-5 font-title text-xl text-cream">Novo Lançamento</h2>

            <div className="space-y-4">
              {/* Tipo */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">TIPO *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormTipo("Entrada")}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                      formTipo === "Entrada" 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "bg-white/5 text-cream/50 border border-white/10"
                    }`}
                  >
                    Receita
                  </button>
                  <button
                    onClick={() => setFormTipo("Saída")}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                      formTipo === "Saída" 
                        ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                        : "bg-white/5 text-cream/50 border border-white/10"
                    }`}
                  >
                    Despesa
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">DESCRIÇÃO *</label>
                <input
                  type="text"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Conta de Luz, Fornecedor de Queijo"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CATEGORIA *</label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-amberglow/50"
                >
                  <option value="" className="bg-zinc-900 text-white">Selecione...</option>
                  <option value="Insumos" className="bg-zinc-900 text-white">Insumos</option>
                  <option value="Embalagens" className="bg-zinc-900 text-white">Embalagens</option>
                  <option value="Custos Fixos" className="bg-zinc-900 text-white">Custos Fixos</option>
                  <option value="Custos Variáveis" className="bg-zinc-900 text-white">Custos Variáveis</option>
                  <option value="Taxas Apps" className="bg-zinc-900 text-white">Taxas Apps</option>
                  <option value="Folha de Pagamento" className="bg-zinc-900 text-white">Folha de Pagamento</option>
                  <option value="Venda" className="bg-zinc-900 text-white">Venda</option>
                </select>
              </div>

              {/* Valor Bruto */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">VALOR BRUTO (R$) *</label>
                <input
                  type="text"
                  value={formValor}
                  onChange={(e) => setFormValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>

              {/* Taxa/Comissão */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">TAXA/COMISSÃO</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formTaxaValor}
                    onChange={(e) => setFormTaxaValor(e.target.value)}
                    placeholder="0"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                  />
                  <select
                    value={formTaxaTipo}
                    onChange={(e) => setFormTaxaTipo(e.target.value as "%" | "R$")}
                    className="w-20 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-amberglow/50"
                  >
                    <option value="%" className="bg-zinc-900 text-white">%</option>
                    <option value="R$" className="bg-zinc-900 text-white">R$</option>
                  </select>
                </div>
              </div>

              {/* Preview Valor Líquido */}
              {formValor && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                  <p className="text-xs text-cream/50">Valor Líquido Estimado:</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(valorLiquidoPreview)}</p>
                </div>
              )}

              {/* Data de Vencimento */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">DATA DE VENCIMENTO *</label>
                <input
                  type="date"
                  value={formDataVencimento}
                  onChange={(e) => setFormDataVencimento(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-amberglow/50"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">STATUS *</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "Pago" | "Pendente")}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-amberglow/50"
                >
                  <option value="Pago" className="bg-zinc-900 text-white">Pago</option>
                  <option value="Pendente" className="bg-zinc-900 text-white">Pendente</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="rounded-lg px-4 py-2 text-sm text-cream/50 transition hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-amberglow/25 px-4 py-2 text-sm font-medium text-amberglow transition hover:bg-amberglow/35 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
