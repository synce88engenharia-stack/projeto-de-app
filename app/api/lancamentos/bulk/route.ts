import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseDayKey } from "@/lib/date";

const RegistroInputSchema = z.object({
  funcionarioId: z.string().min(1),
  presenca: z.boolean(),
  tipoRefeicao: z.enum(["EM_ESPECIE", "DINHEIRO"]).nullable().optional(),
  merendaRecebida: z.boolean().optional(),
  valorDeslocamento: z.number().min(0).optional(),
});

const BulkSchema = z.object({
  obraId: z.string().min(1),
  data: z.string().min(1),
  registros: z.array(RegistroInputSchema),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = BulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const { obraId, data: dataStr, registros } = parsed.data;
  const data = parseDayKey(dataStr);

  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) {
    return NextResponse.json({ error: "Obra não encontrada." }, { status: 400 });
  }

  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  const valorRefeicao = config?.valorRefeicao ?? 14;
  const valorMerenda = config?.valorMerenda ?? 0;

  const funcionarioIds = registros.map((r) => r.funcionarioId);
  const funcionariosValidos = await prisma.funcionario.findMany({
    where: { id: { in: funcionarioIds }, obraId, status: "ATIVO" },
    select: { id: true },
  });
  const idsValidos = new Set(funcionariosValidos.map((f) => f.id));

  const invalido = registros.find((r) => !idsValidos.has(r.funcionarioId));
  if (invalido) {
    return NextResponse.json(
      { error: "Um ou mais funcionários não pertencem a esta obra ou não estão ativos." },
      { status: 400 }
    );
  }

  const results = await prisma.$transaction(
    registros.map((r) => {
      const presenca = r.presenca;
      const tipoRefeicao = presenca ? r.tipoRefeicao ?? null : null;
      // Custo de R$14 é o mesmo para a empresa em ambos os casos (almoço ou vale).
      const custoRefeicao = tipoRefeicao ? valorRefeicao : 0;
      const valorDeslocamento = presenca ? r.valorDeslocamento ?? 0 : 0;
      // Quem recebe deslocamento já tem a merenda incluída.
      const merendaRecebida = presenca ? !!r.merendaRecebida || valorDeslocamento > 0 : false;
      const custoMerenda = merendaRecebida ? valorMerenda : 0;

      return prisma.registroDiario.upsert({
        where: { funcionarioId_data: { funcionarioId: r.funcionarioId, data } },
        update: {
          presenca,
          tipoRefeicao,
          custoRefeicao,
          merendaRecebida,
          custoMerenda,
          valorDeslocamento,
        },
        create: {
          funcionarioId: r.funcionarioId,
          obraId,
          data,
          presenca,
          tipoRefeicao,
          custoRefeicao,
          merendaRecebida,
          custoMerenda,
          valorDeslocamento,
        },
      });
    })
  );

  return NextResponse.json({ ok: true, registros: results });
}
