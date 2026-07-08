import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Correção pontual: lançamentos de "Almoço" (EM_ESPECIE) salvos antes da
 * regra que passou a contar o custo de R$14 igual ao Vale ficaram com
 * custoRefeicao=0. Esta rota atualiza esses registros históricos para o
 * valor de refeição configurado atualmente. Idempotente — rodar de novo
 * não altera nada, pois só atinge linhas ainda em 0.
 */
export async function POST() {
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  const valorRefeicao = config?.valorRefeicao ?? 14;

  const resultado = await prisma.registroDiario.updateMany({
    where: { tipoRefeicao: "EM_ESPECIE", custoRefeicao: 0 },
    data: { custoRefeicao: valorRefeicao },
  });

  return NextResponse.json({ corrigidos: resultado.count, valorAplicado: valorRefeicao });
}
