import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const where = status === "ativas" ? { ativa: true } : status === "inativas" ? { ativa: false } : {};

  const obras = await prisma.obra.findMany({
    where,
    orderBy: { nome: "asc" },
    include: { _count: { select: { funcionarios: { where: { status: "ATIVO" } } } } },
  });

  return NextResponse.json(obras);
}

const CreateObraSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório."),
  endereco: z.string().trim().optional().nullable(),
  descricao: z.string().trim().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateObraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const obra = await prisma.obra.create({ data: parsed.data });
  return NextResponse.json(obra, { status: 201 });
}
