const fs = require('fs');
const path = require('path');

const projectPath = 'C:\\Users\\Lucas\\Projects\\onix-burguer';
const financeiroPath = path.join(projectPath, 'src/app/admin/financeiro/page.tsx');

let content = fs.readFileSync(financeiroPath, 'utf8');

// 1. Adicionar novos estados do form
const oldFormState = `  // Form state
  const [formTipo, setFormTipo] = useState<"Entrada" | "Saída">("Saída");
  const [formDescricao, setFormDescricao] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formDataVencimento, setFormDataVencimento] = useState("");
  const [formStatus, setFormStatus] = useState<"Pago" | "Pendente">("Pendente");`;

const newFormState = `  // Form state
  const [formTipo, setFormTipo] = useState<"Entrada" | "Saída">("Saída");
  const [formDescricao, setFormDescricao] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formDataVencimento, setFormDataVencimento] = useState("");
  const [formStatus, setFormStatus] = useState<"Pago" | "Pendente">("Pendente");
  const [formMetodoPagamento, setFormMetodoPagamento] = useState("PIX");
  const [formRecorrente, setFormRecorrente] = useState(false);
  const [formMesesRecorrencia, setFormMesesRecorrencia] = useState("1");`;

content = content.replace(oldFormState, newFormState);

// 2. Adicionar categorias dinamicas
const oldCategoriaSelect = `              {/* Categoria */}
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
              </div>`;

const newCategoriaSelect = `              {/* Categoria Dinamica */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CATEGORIA *</label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-amberglow/50"
                >
                  <option value="" className="bg-zinc-900 text-white">Selecione...</option>
                  {formTipo === "Entrada" ? (
                    <>
                      <option value="Venda Delivery" className="bg-zinc-900 text-white">Venda Delivery</option>
                      <option value="Venda Salão" className="bg-zinc-900 text-white">Venda Salão</option>
                      <option value="Evento" className="bg-zinc-900 text-white">Evento</option>
                    </>
                  ) : (
                    <>
                      <option value="Insumos" className="bg-zinc-900 text-white">Insumos</option>
                      <option value="Embalagens" className="bg-zinc-900 text-white">Embalagens</option>
                      <option value="Custos Fixos" className="bg-zinc-900 text-white">Custos Fixos</option>
                      <option value="Taxas de Apps" className="bg-zinc-900 text-white">Taxas de Apps</option>
                      <option value="Folha de Pagamento" className="bg-zinc-900 text-white">Folha de Pagamento</option>
                    </>
                  )}
                </select>
              </div>`;

content = content.replace(oldCategoriaSelect, newCategoriaSelect);

// 3. Adicionar Forma de Pagamento apos a categoria
const insertAfterCategoria = `</select>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">FORMA DE PAGAMENTO *</label>
                <select
                  value={formMetodoPagamento}
                  onChange={(e) => setFormMetodoPagamento(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-amberglow/50"
                >
                  <option value="PIX" className="bg-zinc-900 text-white">PIX</option>
                  <option value="Cartão de Crédito" className="bg-zinc-900 text-white">Cartão de Crédito</option>
                  <option value="Cartão de Débito" className="bg-zinc-900 text-white">Cartão de Débito</option>
                  <option value="Dinheiro" className="bg-zinc-900 text-white">Dinheiro</option>
                  <option value="Boleto" className="bg-zinc-900 text-white">Boleto</option>
                </select>
              </div>`;

content = content.replace(`</select>
              </div>

              {/* Valor Bruto */}`, insertAfterCategoria + `\n\n              {/* Valor Bruto */}`);

// 4. Adicionar checkbox recorrente e input de meses antes do Status
const oldStatus = `              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">STATUS *</label>`;

const newStatus = `              {/* Lançamento Recorrente */}
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formRecorrente}
                    onChange={(e) => setFormRecorrente(e.target.checked)}
                    className="rounded border-white/30"
                  />
                  <span className="text-sm text-cream/70">Lançamento Recorrente</span>
                </label>
                {formRecorrente && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={formMesesRecorrencia}
                      onChange={(e) => setFormMesesRecorrencia(e.target.value)}
                      className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-cream outline-none focus:border-amberglow/50"
                    />
                    <span className="text-xs text-cream/50">meses</span>
                  </div>
                )}
              </div>

              {/* Anexar Comprovante */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">ANEXAR COMPROVANTE</label>
                <div className="flex items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/[0.02] px-4 py-6 transition hover:border-amberglow/40 hover:bg-white/[0.04]">
                  <div className="text-center">
                    <svg className="mx-auto h-8 w-8 text-cream/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25z" />
                    </svg>
                    <p className="mt-2 text-xs text-cream/40">Clique ou arraste o comprovante aqui</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">STATUS *</label>`;

content = content.replace(oldStatus, newStatus);

// 5. Atualizar handleSave para incluir novos campos
const oldLancamento = `    const novoLancamento: Lancamento = {
      id: Date.now().toString(),
      data: formDataVencimento,
      descricao: formDescricao,
      categoria: formCategoria as any,
      canal: "Outros",
      metodoPagamento: "Pix",
      valorBruto: valorFinal,
      valorLiquido: Math.max(0, liquido),
      status: formStatus,
      tipo: formTipo,
      taxaValor: taxa > 0 ? taxa : undefined,
      taxaTipo: taxa > 0 ? formTaxaTipo : undefined,
    };`;

const newLancamento = `    const novoLancamento: Lancamento = {
      id: Date.now().toString(),
      data: formDataVencimento,
      descricao: formDescricao,
      categoria: formCategoria as any,
      canal: "Outros",
      metodoPagamento: formMetodoPagamento,
      valorBruto: valorFinal,
      valorLiquido: Math.max(0, liquido),
      status: formStatus,
      tipo: formTipo,
      taxaValor: taxa > 0 ? taxa : undefined,
      taxaTipo: taxa > 0 ? formTaxaTipo : undefined,
      recorrente: formRecorrente,
      mesesRecorrencia: formRecorrente ? parseInt(formMesesRecorrencia) || 1 : undefined,
    };`;

content = content.replace(oldLancamento, newLancamento);

// 6. Atualizar resetForm
const oldReset = `  const resetForm = () => {
    setFormTipo("Saída");
    setFormDescricao("");
    setFormCategoria("");
    setFormValor("");
    setFormDataVencimento("");
    setFormStatus("Pendente");
    setFormTaxaValor("");
    setFormTaxaTipo("%");
    setValorLiquidoPreview(0);
  };`;

const newReset = `  const resetForm = () => {
    setFormTipo("Saída");
    setFormDescricao("");
    setFormCategoria("");
    setFormValor("");
    setFormDataVencimento("");
    setFormStatus("Pendente");
    setFormTaxaValor("");
    setFormTaxaTipo("%");
    setValorLiquidoPreview(0);
    setFormMetodoPagamento("PIX");
    setFormRecorrente(false);
    setFormMesesRecorrencia("1");
  };`;

content = content.replace(oldReset, newReset);

fs.writeFileSync(financeiroPath, content, { encoding: 'utf8' });
console.log('✅ Formulario de Financeiro atualizado com novos campos!');
