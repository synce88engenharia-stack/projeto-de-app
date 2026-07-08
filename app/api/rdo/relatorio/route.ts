import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDayKey, formatDayKey } from "@/lib/date";

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

  const [rdos, presentes] = await Promise.all([
    prisma.rdo.findMany({
      where: { obraId, data: { gte: from, lte: to } },
      orderBy: { data: "asc" },
    }),
    prisma.registroDiario.findMany({
      where: { obraId, data: { gte: from, lte: to }, presenca: true },
      include: { funcionario: { select: { id: true, nome: true, funcao: true } } },
      orderBy: { funcionario: { nome: "asc" } },
    }),
  ]);

  const equipePorDia = new Map<string, { id: string; nome: string; funcao: string }[]>();
  for (const registro of presentes) {
    const key = formatDayKey(registro.data);
    const lista = equipePorDia.get(key) ?? [];
    lista.push(registro.funcionario);
    equipePorDia.set(key, lista);
  }

  const dias = rdos.map((rdo) => {
    const key = formatDayKey(rdo.data);
    return {
      data: rdo.data.toISOString(),
      atividades: rdo.atividades,
      equipe: equipePorDia.get(key) ?? [],
    };
  });

  return NextResponse.json({ from: from.toISOString(), to: to.toISOString(), dias });
}
