-- Renomeia comarcaName para location preservando os dados existentes.
-- Escrito à mão: o Prisma não reconhece renomeações e geraria DROP + ADD COLUMN,
-- descartando o conteúdo da coluna.
--
-- Idempotente de propósito: a renomeação já foi aplicada manualmente no banco de
-- produção antes deste deploy. Sem a guarda, o `prisma migrate deploy` do
-- entrypoint falharia e o contêiner não subiria.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Wallpaper' AND column_name = 'comarcaName'
  ) THEN
    ALTER TABLE "Wallpaper" RENAME COLUMN "comarcaName" TO "location";
  END IF;
END $$;

-- Backfill do acervo anterior à introdução do campo no formulário.
-- Alcança apenas registros vazios; "São Luís" não é valor padrão para novos registros.
UPDATE "Wallpaper" SET "location" = 'São Luís' WHERE "location" = '';
