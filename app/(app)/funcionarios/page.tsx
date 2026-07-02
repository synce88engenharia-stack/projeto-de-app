import { Suspense } from "react";
import { FuncionariosContent } from "@/components/FuncionariosContent";

export default function FuncionariosPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <FuncionariosContent />
    </Suspense>
  );
}
