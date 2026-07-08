import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDayKey } from "@/lib/date";
import { computeQuinzenaReport } from "@/lib/relatorio";

export async function GET(request: NextRequest) {
  const obraId = request.nextUrl.searchParams.get("obraId");
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");

  if (!obraId || !fromParam || !toParam) {
    return NextResponse.json({ error: "obraId, from e to são obrigatórios." }, { status: 400 });
  }

  const from = parseDayKey(fromParam);
  const to = parseDayKey(toParam);
  if (from.getTime() > to.getTime()) {
    return NextResponse.json({ error: "A data inicial deve ser anterior à data final." }, { status: 400 });
  }

  const [registros, funcionarios] = await Promise.all([
    prisma.registroDiario.findMany({
      where: { obraId, data: { gte: from, lte: to } },
    }),
    prisma.funcionario.findMany({ where: { obraId } }),
  ]);

  const report = computeQuinzenaReport(registros, funcionarios);

  return NextResponse.json({
    from: from.toISOString(),
    to: to.toISOString(),
    ...report,
  });
}
