-- CreateEnum
CREATE TYPE "StatusFuncionario" AS ENUM ('ATIVO', 'DESLIGADO');

-- CreateEnum
CREATE TYPE "TipoRefeicao" AS ENUM ('EM_ESPECIE', 'DINHEIRO');

-- CreateTable
CREATE TABLE "Obra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "funcao" TEXT NOT NULL,
    "dataAdmissao" TIMESTAMP(3) NOT NULL,
    "status" "StatusFuncionario" NOT NULL DEFAULT 'ATIVO',
    "dataDesligamento" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroDiario" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "presenca" BOOLEAN NOT NULL,
    "tipoRefeicao" "TipoRefeicao",
    "custoRefeicao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "merendaRecebida" BOOLEAN NOT NULL DEFAULT false,
    "custoMerenda" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorDeslocamento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroDiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "valorRefeicao" DOUBLE PRECISION NOT NULL DEFAULT 14.0,
    "valorMerenda" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Funcionario_obraId_idx" ON "Funcionario"("obraId");

-- CreateIndex
CREATE INDEX "Funcionario_status_idx" ON "Funcionario"("status");

-- CreateIndex
CREATE INDEX "RegistroDiario_obraId_data_idx" ON "RegistroDiario"("obraId", "data");

-- CreateIndex
CREATE INDEX "RegistroDiario_data_idx" ON "RegistroDiario"("data");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroDiario_funcionarioId_data_key" ON "RegistroDiario"("funcionarioId", "data");

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroDiario" ADD CONSTRAINT "RegistroDiario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroDiario" ADD CONSTRAINT "RegistroDiario_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
