import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.configuracao.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, valorRefeicao: 14.0, valorMerenda: 6.0 },
  });
  return NextResponse.json(config);
}

const UpdateConfigSchema = z.object({
  valorRefeicao: z.number().min(0),
  valorMerenda: z.number().min(0),
});

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = UpdateConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const config = await prisma.configuracao.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  return NextResponse.json(config);
}
