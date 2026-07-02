import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDayKey } from "@/lib/date";

export async function GET(request: NextRequest) {
  const obraId = request.nextUrl.searchParams.get("obraId");
  const dataParam = request.nextUrl.searchParams.get("data");

  if (!obraId || !dataParam) {
    return NextResponse.json({ error: "obraId e data são obrigatórios." }, { status: 400 });
  }

  const data = parseDayKey(dataParam);

  const funcionarios = await prisma.funcionario.findMany({
    where: { obraId, status: "ATIVO" },
    orderBy: { nome: "asc" },
  });

  const registros = await prisma.registroDiario.findMany({
    where: { obraId, data },
  });
  const registrosPorFuncionario = new Map(registros.map((r) => [r.funcionarioId, r]));

  const linhas = funcionarios.map((f) => ({
    funcionario: { id: f.id, nome: f.nome, funcao: f.funcao },
    registro: registrosPorFuncionario.get(f.id) ?? null,
  }));

  return NextResponse.json({ data: dataParam, linhas });
}
