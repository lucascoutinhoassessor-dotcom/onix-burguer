"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SimulacaoContextType {
  modoSimulacao: boolean;
  toggleModoSimulacao: () => void;
  ativarSimulacao: () => void;
  desativarSimulacao: () => void;
}

const SimulacaoContext = createContext<SimulacaoContextType | undefined>(undefined);

export function SimulacaoProvider({ children }: { children: ReactNode }) {
  const [modoSimulacao, setModoSimulacao] = useState(false);

  const toggleModoSimulacao = useCallback(() => {
    setModoSimulacao((prev) => !prev);
  }, []);

  const ativarSimulacao = useCallback(() => {
    setModoSimulacao(true);
  }, []);

  const desativarSimulacao = useCallback(() => {
    setModoSimulacao(false);
  }, []);

  return (
    <SimulacaoContext.Provider
      value={{ modoSimulacao, toggleModoSimulacao, ativarSimulacao, desativarSimulacao }}
    >
      {children}
    </SimulacaoContext.Provider>
  );
}

export function useSimulacao() {
  const context = useContext(SimulacaoContext);
  if (!context) {
    throw new Error("useSimulacao deve ser usado dentro de SimulacaoProvider");
  }
  return context;
}
