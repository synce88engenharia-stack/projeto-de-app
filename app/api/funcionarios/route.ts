import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseDayKey } from "@/lib/date";
import { STATUS_FUNCIONARIO } from "@/lib/funcionario";
import type { Prisma, StatusFuncionario } from "@/app/generated/prisma/client";

function isStatusFuncionario(value: string): value is StatusFuncionario {
  return (STATUS_FUNCIONARIO as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const obraId = request.nextUrl.searchParams.get("obraId");
  const status = request.nextUrl.searchParams.get("status");

  const where: Prisma.FuncionarioWhereInput = {
    ...(obraId ? { obraId } : {}),
    ...(status && isStatusFuncionario(status) ? { status } : {}),
  };

  const funcionarios = await prisma.funcionario.findMany({
    where,
    orderBy: { nome: "asc" },
    include: { obra: { select: { id: true, nome: true } } },
  });

  return NextResponse.json(funcionarios);
}

const CreateFuncionarioSchema = z.object({
  obraId: z.string().min(1, "Obra é obrigatória."),
  nome: z.string().trim().min(1, "Nome é obrigatório."),
  funcao: z.string().trim().min(1, "Função é obrigatória."),
  dataAdmissao: z.string().min(1, "Data de admissão é obrigatória."),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateFuncionarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const obra = await prisma.obra.findUnique({ where: { id: parsed.data.obraId } });
  if (!obra) {
    return NextResponse.json({ error: "Obra não encontrada." }, { status: 400 });
  }

  const funcionario = await prisma.funcionario.create({
    data: {
      obraId: parsed.data.obraId,
      nome: parsed.data.nome,
      funcao: parsed.data.funcao,
      dataAdmissao: parseDayKey(parsed.data.dataAdmissao),
    },
  });

  return NextResponse.json(funcionario, { status: 201 });
}
