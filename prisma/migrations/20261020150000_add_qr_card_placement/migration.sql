-- Posição do cartão do QR, em px da imagem 1920×1080.
-- Colunas opcionais, sem default e sem backfill: vazio significa a posição legada,
-- então os registros existentes não mudam e o código anterior continua funcionando.

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "qrLeft" INTEGER,
ADD COLUMN     "qrSize" INTEGER,
ADD COLUMN     "qrTop" INTEGER;

-- AlterTable
ALTER TABLE "Wallpaper" ADD COLUMN     "qrLeft" INTEGER,
ADD COLUMN     "qrSize" INTEGER,
ADD COLUMN     "qrTop" INTEGER;
