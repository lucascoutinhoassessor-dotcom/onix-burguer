const fs = require('fs');
const path = require('path');

const projectPath = 'C:\\Users\\Lucas\\Projects\\onix-burguer';
const financeiroPath = path.join(projectPath, 'src/app/admin/financeiro/page.tsx');

let content = fs.readFileSync(financeiroPath, 'utf8');

// 1. Adicionar import do contexto de simulacao
const oldImports = `import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/checkout";`;

const newImports = `import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/checkout";
import { useSimulacao } from "@/contexts/simulacao-context";`;

content = content.replace(oldImports, newImports);

// 2. Atualizar o tipo Lancamento para incluir novos campos
const oldTipo = `type Lancamento = {
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
};`;

const newTipo = `type Lancamento = {
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
  recorrente?: boolean;
  mesesRecorrencia?: number;
};`;

content = content.replace(oldTipo, newTipo);

// 3. Atualizar mock data com dados mais realistas
const oldMock = `const mockLancamentos: Lancamento[] = [
  { id: "1", data: "2025-01-20", descricao: "Venda #1234", categoria: "Venda", canal: "iFood", metodoPagamento: "iFood", valorBruto: 150, valorLiquido: calcularLiquido(150, 12, "%"), status: "A Receber", tipo: "Entrada", taxaValor: 12, taxaTipo: "%" },
  { id: "2", data: "2025-01-20", descricao: "Venda #1235", categoria: "Venda", canal: "Balcão", metodoPagamento: "Pix", valorBruto: 89.90, valorLiquido: 89.90, status: "Pago", tipo: "Entrada", taxaValor: 0, taxaTipo: "%" },
  { id: "3", data: "2025-01-20", descricao: "Embalagens Delivery", categoria: "Embalagens", canal: "Outros", metodoPagamento: "Pix", valorBruto: 250, valorLiquido: 250, status: "Pago", tipo: "Saída" },
  { id: "4", data: "2025-01-21", descricao: "Venda #1236", categoria: "Venda", canal: "WhatsApp", metodoPagamento: "Dinheiro", valorBruto: 45.00, valorLiquido: 45.00, status: "Pago", tipo: "Entrada", taxaValor: 0, taxaTipo: "%" },
  { id: "5", data: "2025-01-21", descricao: "Insumos - Carne", categoria: "Insumos", canal: "Outros", metodoPagamento: "Pix", valorBruto: 350, valorLiquido: 350, status: "Pendente", tipo: "Saída" },
  { id: "6", data: "2025-01-21", descricao: "Taxa iFood", categoria: "Taxas Apps", canal: "iFood", metodoPagamento: "iFood", valorBruto: 18, valorLiquido: 18, status: "Pago", tipo: "Saída" },
];`;

const newMock = `const mockLancamentos: Lancamento[] = [
  { id: "1", data: "2025-01-20", descricao: "Venda #1234", categoria: "Venda Delivery", canal: "iFood", metodoPagamento: "Cartão de Crédito", valorBruto: 150, valorLiquido: calcularLiquido(150, 12, "%"), status: "A Receber", tipo: "Entrada", taxaValor: 12, taxaTipo: "%" },
  { id: "2", data: "2025-01-20", descricao: "Venda #1235", categoria: "Venda Salão", canal: "Balcão", metodoPagamento: "PIX", valorBruto: 89.90, valorLiquido: 89.90, status: "Pago", tipo: "Entrada", taxaValor: 0, taxaTipo: "%" },
  { id: "3", data: "2025-01-20", descricao: "Embalagens Delivery", categoria: "Embalagens", canal: "Outros", metodoPagamento: "Boleto", valorBruto: 250, valorLiquido: 250, status: "Pago", tipo: "Saída" },
  { id: "4", data: "2025-01-21", descricao: "Venda #1236", categoria: "Venda Salão", canal: "WhatsApp", metodoPagamento: "Dinheiro", valorBruto: 45.00, valorLiquido: 45.00, status: "Pago", tipo: "Entrada", taxaValor: 0, taxaTipo: "%" },
  { id: "5", data: "2025-01-21", descricao: "Insumos - Carne", categoria: "Insumos", canal: "Outros", metodoPagamento: "PIX", valorBruto: 350, valorLiquido: 350, status: "Pendente", tipo: "Saída" },
  { id: "6", data: "2025-01-21", descricao: "Taxa iFood", categoria: "Taxas de Apps", canal: "iFood", metodoPagamento: "Cartão de Débito", valorBruto: 18, valorLiquido: 18, status: "Pago", tipo: "Saída" },
  { id: "7", data: "2025-01-22", descricao: "Folha - Cozinheiro", categoria: "Folha de Pagamento", canal: "Outros", metodoPagamento: "PIX", valorBruto: 2200, valorLiquido: 2200, status: "Pago", tipo: "Saída", recorrente: true, mesesRecorrencia: 12 },
  { id: "8", data: "2025-01-22", descricao: "Evento - Festa Junina", categoria: "Evento", canal: "WhatsApp", metodoPagamento: "PIX", valorBruto: 1200, valorLiquido: 1200, status: "A Receber", tipo: "Entrada" },
  { id: "9", data: "2025-01-22", descricao: "Aluguel", categoria: "Custos Fixos", canal: "Outros", metodoPagamento: "Boleto", valorBruto: 3500, valorLiquido: 3500, status: "Pago", tipo: "Saída", recorrente: true, mesesRecorrencia: 12 },
];`;

content = content.replace(oldMock, newMock);

// 4. Substituir o estado local modoSimulacao pelo contexto global
const oldState = `export default function FinanceiroPage() {
  const [modoSimulacao, setModoSimulacao] = useState(false);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [realData, setRealData] = useState<Lancamento[]>([]);`;

const newState = `export default function FinanceiroPage() {
  const { modoSimulacao } = useSimulacao();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [realData, setRealData] = useState<Lancamento[]>([]);
  const [simData, setSimData] = useState<Lancamento[]>([]);`;

content = content.replace(oldState, newState);

// 5. Atualizar useEffect de carregamento para separar dados reais e simulados
const oldEffect = `  // Carregar dados
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
  }, [modoSimulacao, realData]);`;

const newEffect = `  // Carregar dados - separacao real vs simulado
  useEffect(() => {
    setLoading(true);
    if (modoSimulacao) {
      setTimeout(() => {
        setLancamentos([...mockLancamentos, ...simData]);
        setLoading(false);
      }, 300);
    } else {
      setLancamentos(realData);
      setLoading(false);
    }
  }, [modoSimulacao, realData, simData]);`;

content = content.replace(oldEffect, newEffect);

// 6. Atualizar handleSave para adicionar ao array correto
const oldSave = `    setSaving(true);
    setTimeout(() => {
      setRealData(prev => [novoLancamento, ...prev]);
      setShowForm(false);
      resetForm();
      setSaving(false);
    }, 500);`;

const newSave = `    setSaving(true);
    setTimeout(() => {
      if (modoSimulacao) {
        setSimData(prev => [novoLancamento, ...prev]);
      } else {
        setRealData(prev => [novoLancamento, ...prev]);
      }
      setShowForm(false);
      resetForm();
      setSaving(false);
    }, 500);`;

content = content.replace(oldSave, newSave);

fs.writeFileSync(financeiroPath, content, { encoding: 'utf8' });
console.log('✅ Financeiro atualizado com separacao de dados real/simulado!');
