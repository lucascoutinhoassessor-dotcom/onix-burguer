"use client";

import { useEffect, useState } from "react";

interface CompanyData {
  id: string;
  name: string;
  logo_url: string;
  address: string;
  instagram: string;
  whatsapp: string;
  description: string;
  slug: string;
}

export function useCompanyData() {
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/company", { cache: "no-store" });
        const result = await res.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (err) {
        console.error("Erro ao carregar dados da empresa:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, loading };
}
