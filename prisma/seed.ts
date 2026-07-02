import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.configuracao.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, valorRefeicao: 14.0, valorMerenda: 6.0 },
  });

  const obra = await prisma.obra.upsert({
    where: { id: "obra-seed-vista-verde" },
    update: {},
    create: {
      id: "obra-seed-vista-verde",
      nome: "Residencial Vista Verde",
      endereco: "Rua das Palmeiras, 480 — Zona Sul",
      ativa: true,
    },
  });

  const funcionarios = [
    { id: "func-seed-1", nome: "Carlos Eduardo Silva", funcao: "Mestre de obras" },
    { id: "func-seed-2", nome: "Marcos Vinícius Oliveira", funcao: "Pedreiro" },
    { id: "func-seed-3", nome: "Rafael Augusto Pereira", funcao: "Servente" },
  ];

  for (const f of funcionarios) {
    await prisma.funcionario.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        obraId: obra.id,
        nome: f.nome,
        funcao: f.funcao,
        dataAdmissao: new Date("2024-01-15T00:00:00Z"),
      },
    });
  }

  console.log("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
