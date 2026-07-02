import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseDayKey } from "@/lib/date";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const funcionario = await prisma.funcionario.findUnique({
    where: { id },
    include: { obra: { select: { id: true, nome: true } } },
  });
  if (!funcionario) {
    return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });
  }
  return NextResponse.json(funcionario);
}

const UpdateFuncionarioSchema = z
  .object({
    nome: z.string().trim().min(1).optional(),
    funcao: z.string().trim().min(1).optional(),
    obraId: z.string().min(1).optional(),
    status: z.enum(["ATIVO", "DESLIGADO"]).optional(),
    dataDesligamento: z.string().nullable().optional(),
  })
  .refine((data) => data.status !== "DESLIGADO" || !!data.dataDesligamento, {
    message: "Data de desligamento é obrigatória ao desligar um funcionário.",
    path: ["dataDesligamento"],
  });

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateFuncionarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const existing = await prisma.funcionario.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });
  }

  const { dataDesligamento, status, ...rest } = parsed.data;

  const data: Record<string, unknown> = { ...rest };
  if (status) {
    data.status = status;
    data.dataDesligamento = status === "DESLIGADO" ? parseDayKey(dataDesligamento as string) : null;
  }

  const funcionario = await prisma.funcionario.update({ where: { id }, data });
  return NextResponse.json(funcionario);
}
