import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseDayKey } from "@/lib/date";

export async function GET(request: NextRequest) {
  const obraId = request.nextUrl.searchParams.get("obraId");
  const dataParam = request.nextUrl.searchParams.get("data");

  if (!obraId || !dataParam) {
    return NextResponse.json({ error: "obraId e data são obrigatórios." }, { status: 400 });
  }

  const data = parseDayKey(dataParam);

  const [rdo, presentes] = await Promise.all([
    prisma.rdo.findUnique({ where: { obraId_data: { obraId, data } } }),
    prisma.registroDiario.findMany({
      where: { obraId, data, presenca: true },
      include: { funcionario: { select: { id: true, nome: true, funcao: true } } },
      orderBy: { funcionario: { nome: "asc" } },
    }),
  ]);

  return NextResponse.json({
    atividades: rdo?.atividades ?? "",
    equipe: presentes.map((r) => r.funcionario),
  });
}

const RdoSchema = z.object({
  obraId: z.string().min(1),
  data: z.string().min(1),
  atividades: z.string(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = RdoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const { obraId, data: dataStr, atividades } = parsed.data;
  const data = parseDayKey(dataStr);

  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) {
    return NextResponse.json({ error: "Obra não encontrada." }, { status: 400 });
  }

  const rdo = await prisma.rdo.upsert({
    where: { obraId_data: { obraId, data } },
    update: { atividades },
    create: { obraId, data, atividades },
  });

  return NextResponse.json(rdo);
}
