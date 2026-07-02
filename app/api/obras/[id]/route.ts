import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id },
    include: { funcionarios: { orderBy: { nome: "asc" } } },
  });
  if (!obra) {
    return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
  }
  return NextResponse.json(obra);
}

const UpdateObraSchema = z.object({
  nome: z.string().trim().min(1).optional(),
  endereco: z.string().trim().optional().nullable(),
  descricao: z.string().trim().optional().nullable(),
  ativa: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateObraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const existing = await prisma.obra.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
  }

  const obra = await prisma.obra.update({ where: { id }, data: parsed.data });
  return NextResponse.json(obra);
}
