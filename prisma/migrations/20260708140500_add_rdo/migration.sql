-- CreateTable
CREATE TABLE "Rdo" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "obraId" TEXT NOT NULL,
    "atividades" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rdo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rdo_obraId_data_idx" ON "Rdo"("obraId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "Rdo_obraId_data_key" ON "Rdo"("obraId", "data");

-- AddForeignKey
ALTER TABLE "Rdo" ADD CONSTRAINT "Rdo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
