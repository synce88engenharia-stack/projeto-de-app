import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuinzenaRange } from "@/lib/quinzena";
import { computeQuinzenaReport } from "@/lib/relatorio";

export async function GET(request: NextRequest) {
  const obraId = request.nextUrl.searchParams.get("obraId");
  const quinzena = request.nextUrl.searchParams.get("quinzena");

  if (!obraId || !quinzena) {
    return NextResponse.json({ error: "obraId e quinzena são obrigatórios." }, { status: 400 });
  }

  let range;
  try {
    range = getQuinzenaRange(quinzena);
  } catch {
    return NextResponse.json({ error: "Quinzena inválida." }, { status: 400 });
  }

  const [registros, funcionarios] = await Promise.all([
    prisma.registroDiario.findMany({
      where: { obraId, data: { gte: range.start, lte: range.end } },
    }),
    prisma.funcionario.findMany({ where: { obraId } }),
  ]);

  const report = computeQuinzenaReport(registros, funcionarios);

  return NextResponse.json({
    quinzena,
    inicio: range.start.toISOString(),
    fim: range.end.toISOString(),
    ...report,
  });
}
