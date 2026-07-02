import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDayKey, toDayKey } from "@/lib/date";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");

  const to = toParam ? parseDayKey(toParam) : toDayKey(new Date());
  const from = fromParam ? parseDayKey(fromParam) : new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);

  const funcionario = await prisma.funcionario.findUnique({ where: { id } });
  if (!funcionario) {
    return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });
  }

  const registros = await prisma.registroDiario.findMany({
    where: { funcionarioId: id, data: { gte: from, lte: to } },
    orderBy: { data: "asc" },
  });

  let acumulado = 0;
  const linhas = registros.map((r) => {
    const totalDia = r.custoRefeicao + r.custoMerenda + r.valorDeslocamento;
    acumulado += totalDia;
    return { ...r, totalDia, acumulado };
  });

  return NextResponse.json({
    funcionario: { id: funcionario.id, nome: funcionario.nome, funcao: funcionario.funcao },
    from: from.toISOString(),
    to: to.toISOString(),
    linhas,
  });
}
